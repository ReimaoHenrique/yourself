import { useUsageController } from "../../controllers";
import {
  formatLastUsed,
  formatUsageTime,
  USAGE_PERIODS,
} from "../../models";
import { routes } from "../../routes";
import "./UsageView.css";

/** View — só renderiza o estado devolvido pelo `useUsageController`. */
export function UsageView() {
  const {
    apps,
    totalTodayMs,
    permissionPending,
    granted,
    days,
    setDays,
    loading,
    error,
    refresh,
    openSettings,
  } = useUsageController();

  return (
    <section className="view usage-view">
      <header className="usage-header">
        <div>
          <h1>Uso de aplicativos</h1>
          <p className="muted">Tempo em primeiro plano vindo do Android.</p>
        </div>
        <select
          aria-label="Período"
          value={days}
          onChange={(event) => setDays(Number(event.currentTarget.value))}
        >
          {USAGE_PERIODS.map((period) => (
            <option key={period.days} value={period.days}>
              {period.label}
            </option>
          ))}
        </select>
      </header>

      {loading && <p className="muted">Carregando…</p>}
      {error && <p className="error">{error}</p>}

      {permissionPending && (
        <div className="usage-permission">
          <p>
            Permissão pendente: permita o acesso aos dados de uso nas
            configurações do Android. Você precisa conceder manualmente.
          </p>
          <button type="button" className="button" onClick={() => void openSettings()}>
            Abrir configurações
          </button>
          <button type="button" className="button ghost" onClick={() => void refresh()}>
            Já concedi, verificar novamente
          </button>
        </div>
      )}

      {granted && !loading && !error && (
        <>
          <div className="usage-summary">
            <span>Tempo total de uso hoje</span>
            <strong>{formatUsageTime(totalTodayMs)}</strong>
          </div>

          <h2>Ranking de aplicativos</h2>
          {apps.length === 0 && <p className="muted">Nenhum uso registrado nesse período.</p>}

          <ol className="usage-list">
            {apps.map((app, index) => (
              <li key={app.packageName}>
                <span className="usage-rank">{index + 1}</span>
                {app.iconBase64 ? (
                  <img className="usage-icon" src={app.iconBase64} alt="" />
                ) : (
                  <span className="usage-icon fallback">{app.appName.charAt(0)}</span>
                )}
                <div className="usage-info">
                  <span className="usage-label">{app.appName}</span>
                  <span className="usage-package">{app.packageName}</span>
                  <span className="usage-details">
                    Hoje: {formatUsageTime(app.todayTimeInForeground)} · 7 dias:{" "}
                    {formatUsageTime(app.last7DaysTimeInForeground)} · Último uso:{" "}
                    {formatLastUsed(app.lastTimeUsed)}
                  </span>
                </div>
                <span className="usage-time">
                  {formatUsageTime(app.totalTimeInForeground)}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}

      <p>
        <a href={routes.home}>← Voltar</a>
      </p>
    </section>
  );
}
