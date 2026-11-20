package com.henrique.yourself

import android.app.Activity
import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Build
import android.os.Process
import android.provider.Settings
import android.util.Base64
import app.tauri.annotation.Command
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSArray
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.ByteArrayOutputStream
import java.util.Calendar

/**
 * Plugin Android (Kotlin) que lê o tempo de uso dos apps com UsageStatsManager.
 *
 * Os métodos `@Command` são chamados pelo Rust (`src-tauri/src/lib.rs`) via
 * `PluginHandle`. O nome do comando é exatamente o nome do método Kotlin.
 * Nenhuma decisão de interface (UI) vive aqui.
 */
class UsagePlugin(private val activity: Activity) : Plugin(activity) {
  private val usageStatsManager: UsageStatsManager =
    activity.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
  private val packageManager: PackageManager = activity.packageManager

  /** Acumulado por package name, preenchido em uma única consulta. */
  private class AggregatedUsage {
    var totalMs: Long = 0
    var todayMs: Long = 0
    var last7DaysMs: Long = 0
    var lastTimeUsed: Long = 0
  }

  companion object {
    private const val DAY_MS = 24L * 60L * 60L * 1000L
    private const val ICON_SIZE = 64
  }

  /** "Acesso ao uso de aplicativos" é uma permissão especial (AppOps). */
  private fun hasUsageAccess(): Boolean {
    val appOps = activity.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        activity.packageName
      )
    } else {
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        activity.packageName
      )
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  /** Devolve `{ granted: Boolean }`. Nunca concede a permissão automaticamente. */
  @Command
  fun hasPermission(invoke: Invoke) {
    val result = JSObject()
    result.put("granted", hasUsageAccess())
    invoke.resolve(result)
  }

  /** Abre a tela do sistema de Acesso aos dados de uso. */
  @Command
  fun openUsageSettings(invoke: Invoke) {
    val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    activity.startActivity(intent)
    invoke.resolve()
  }

  /**
   * Consulta TODOS os apps de uma vez (ou apenas `packageName`, quando filtrado).
   * Payload: { days: Int, packageName: String? }.
   * Resposta: { apps: [...], totalTodayMs: Long }.
   */
  @Command
  fun queryUsage(invoke: Invoke) {
    if (!hasUsageAccess()) {
      invoke.reject(
        "Permissão de acesso ao uso de aplicativos não concedida",
        "PERMISSION_DENIED",
        null,
        null
      )
      return
    }

    try {
      val args = invoke.getArgs()
      val days = (args.getInteger("days", 30) ?: 30).coerceIn(1, 365)
      val packageFilter = args.getString("packageName", null)
      val now = System.currentTimeMillis()
      val startToday = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }.timeInMillis
      val totalFrom = now - days * DAY_MS
      val last7From = now - 7 * DAY_MS
      // Consulta no mínimo 7 dias para que o campo dos últimos 7 dias seja completo.
      val queryFrom = now - maxOf(days, 7) * DAY_MS

      val usage = LinkedHashMap<String, AggregatedUsage>()

      // 1) queryUsageStats: uma única consulta agregada para todos os pacotes.
      val stats = usageStatsManager.queryUsageStats(
        UsageStatsManager.INTERVAL_BEST,
        queryFrom,
        now
      )
      for (stat in stats) {
        val pkg = stat.packageName ?: continue
        if (pkg == activity.packageName) continue
        if (packageFilter != null && pkg != packageFilter) continue

        val entry = usage.getOrPut(pkg) { AggregatedUsage() }
        val firstUsed = stat.firstTimeStamp
        val lastUsed = stat.lastTimeUsed
        if (lastUsed > entry.lastTimeUsed) entry.lastTimeUsed = lastUsed

        val time = stat.totalTimeInForeground
        if (time <= 0L) continue
        if (firstUsed >= totalFrom) entry.totalMs += time
        if (firstUsed >= last7From) entry.last7DaysMs += time
        if (firstUsed >= startToday) entry.todayMs += time
      }

      // 2) queryEvents: cobre apps com eventos recentes mas sem stats agregados
      //    (por exemplo, uso muito recente que ainda não foi consolidado).
      val events = usageStatsManager.queryEvents(last7From, now)
      val event = UsageEvents.Event()
      while (events.hasNextEvent()) {
        events.getNextEvent(event)
        if (event.eventType != UsageEvents.Event.MOVE_TO_FOREGROUND) continue
        val pkg = event.packageName ?: continue
        if (pkg == activity.packageName) continue
        if (packageFilter != null && pkg != packageFilter) continue
        val entry = usage.getOrPut(pkg) { AggregatedUsage() }
        if (event.timeStamp > entry.lastTimeUsed) entry.lastTimeUsed = event.timeStamp
      }

      // 3) Monta a resposta ordenada por tempo total (ranking) e converte ícones.
      val apps = JSArray()
      var totalTodayMs = 0L
      for ((pkg, entry) in usage.entries.sortedByDescending { it.value.totalMs }) {
        if (entry.totalMs == 0L && entry.lastTimeUsed == 0L) continue
        totalTodayMs += entry.todayMs

        val app = JSObject()
        app.put("packageName", pkg)
        app.put("appName", appNameFor(pkg))
        app.put("iconBase64", iconFor(pkg))
        app.put("totalTimeInForeground", entry.totalMs)
        app.put("todayTimeInForeground", entry.todayMs)
        app.put("last7DaysTimeInForeground", entry.last7DaysMs)
        app.put("lastTimeUsed", entry.lastTimeUsed)
        apps.put(app)
      }

      val result = JSObject()
      result.put("apps", apps)
      result.put("totalTodayMs", totalTodayMs)
      invoke.resolve(result)
    } catch (error: Exception) {
      invoke.reject("Falha ao consultar o uso dos apps", "QUERY_FAILED", error, null)
    }
  }

  private fun appNameFor(packageName: String): String = try {
    val info = packageManager.getApplicationInfo(packageName, 0)
    packageManager.getApplicationLabel(info).toString()
  } catch (_: PackageManager.NameNotFoundException) {
    packageName
  }

  /** Devolve o ícone como data URI PNG em base64, ou null se indisponível. */
  private fun iconFor(packageName: String): String? = try {
    val info = packageManager.getApplicationInfo(packageName, 0)
    val drawable = info.loadIcon(packageManager) ?: return null
    val bitmap = Bitmap.createBitmap(ICON_SIZE, ICON_SIZE, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, ICON_SIZE, ICON_SIZE)
    drawable.draw(canvas)
    val stream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
    val encoded = Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
    "data:image/png;base64,$encoded"
  } catch (_: Exception) {
    null
  }
}
