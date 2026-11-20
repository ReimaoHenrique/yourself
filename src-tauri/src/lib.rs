use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{
    Manager, State, Wry,
    plugin::{Builder as PluginBuilder, TauriPlugin},
};
#[cfg(target_os = "android")]
use tauri::plugin::PluginHandle;

// ---------------------------------------------------------------------------
// Model — fonte única de verdade no backend, espelhado em src/app/models
// ---------------------------------------------------------------------------

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: u64,
    pub title: String,
    pub done: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub name: &'static str,
    pub version: &'static str,
    pub profile: &'static str,
    pub os: &'static str,
}

/// Uso de um aplicativo, espelhado em `src/app/models/usage.model.ts`.
/// Todos os tempos são milissegundos; o ícone é uma data URI PNG (quante disponível).
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppUsage {
    pub package_name: String,
    pub app_name: String,
    pub icon_base64: Option<String>,
    pub total_time_in_foreground: u64,
    pub today_time_in_foreground: u64,
    #[serde(rename = "last7DaysTimeInForeground")]
    pub last_7_days_time_in_foreground: u64,
    pub last_time_used: u64,
}

/// Resposta da consulta de todos os apps: ranking + total de uso diário.
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageReport {
    pub apps: Vec<AppUsage>,
    pub total_today_ms: u64,
}

/// Formato devolvido pelo comando Kotlin `queryUsage`.
#[cfg(target_os = "android")]
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UsageResponse {
    apps: Vec<AppUsage>,
    total_today_ms: u64,
}

/// Formato devolvido pelo comando Kotlin `hasPermission`.
#[cfg(target_os = "android")]
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UsagePermissionResponse {
    granted: bool,
}

/// Estado compartilhado da aplicação (equivalente ao in-memory store).
#[derive(Default)]
pub struct AppState(Mutex<Vec<Task>>);

/// Ponte com o plugin Kotlin registrado no `MainActivity` do Android.
struct UsageMobile {
    #[cfg(target_os = "android")]
    plugin: PluginHandle<Wry>,
}

/// Plugin Tauri sem código JS: só registra a classe Kotlin na plataforma mobile.
fn usage_plugin() -> TauriPlugin<Wry> {
    PluginBuilder::<Wry>::new("usage")
        .setup(|app, _api| {
            #[cfg(target_os = "android")]
            let plugin =
                _api.register_android_plugin("com.henrique.yourself", "UsagePlugin")?;

            app.manage(UsageMobile {
                #[cfg(target_os = "android")]
                plugin,
            });
            Ok(())
        })
        .build()
}

#[cfg(not(target_os = "android"))]
fn android_only_error<T>() -> Result<T, String> {
    Err("A leitura de uso de apps está disponível apenas no Android.".to_string())
}

// ---------------------------------------------------------------------------
// Controllers — expostos como comandos Tauri, chamados pelos Services
// ---------------------------------------------------------------------------

#[tauri::command]
fn list_tasks(state: tauri::State<'_, AppState>) -> Vec<Task> {
    state.0.lock().expect("state poisoned").clone()
}

#[tauri::command]
fn add_task(title: String, state: tauri::State<'_, AppState>) -> Option<Task> {
    let title = title.trim();
    if title.is_empty() {
        return None;
    }

    let mut tasks = state.0.lock().expect("state poisoned");
    let id = tasks.iter().map(|task| task.id).max().unwrap_or(0) + 1;
    let task = Task {
        id,
        title: title.to_string(),
        done: false,
    };

    tasks.push(task.clone());
    Some(task)
}

#[tauri::command]
fn toggle_task(id: u64, state: tauri::State<'_, AppState>) -> Option<Task> {
    let mut tasks = state.0.lock().expect("state poisoned");
    let task = tasks.iter_mut().find(|task| task.id == id)?;
    task.done = !task.done;
    Some(task.clone())
}

#[tauri::command]
fn remove_task(id: u64, state: tauri::State<'_, AppState>) -> bool {
    let mut tasks = state.0.lock().expect("state poisoned");
    let before = tasks.len();
    tasks.retain(|task| task.id != id);
    tasks.len() != before
}

#[tauri::command]
fn app_info() -> AppInfo {
    AppInfo {
        name: env!("CARGO_PKG_NAME"),
        version: env!("CARGO_PKG_VERSION"),
        profile: if cfg!(debug_assertions) {
            "debug"
        } else {
            "release"
        },
        os: std::env::consts::OS,
    }
}

// ---------------------------------------------------------------------------
// Comandos de uso de apps — delegam para o plugin Kotlin no Android
// ---------------------------------------------------------------------------

/// Verifica se o usuário concedeu "Acesso ao uso de aplicativos".
#[tauri::command]
fn check_usage_permission(mobile: State<'_, UsageMobile>) -> Result<bool, String> {
    #[cfg(target_os = "android")]
    {
        let response: UsagePermissionResponse = mobile
            .plugin
            .run_mobile_plugin("hasPermission", ())
            .map_err(|error| error.to_string())?;
        Ok(response.granted)
    }

    #[cfg(not(target_os = "android"))]
    {
        let _ = mobile;
        android_only_error()
    }
}

/// Abre as configurações de Acesso aos dados de uso (não concede automaticamente).
#[tauri::command]
fn request_usage_permission(mobile: State<'_, UsageMobile>) -> Result<bool, String> {
    #[cfg(target_os = "android")]
    {
        mobile
            .plugin
            .run_mobile_plugin::<()>("openUsageSettings", ())
            .map_err(|error| error.to_string())?;
        Ok(true)
    }

    #[cfg(not(target_os = "android"))]
    {
        let _ = mobile;
        android_only_error()
    }
}

/// Consulta todos os apps de uma vez, já ordenados como ranking.
#[tauri::command]
fn get_all_app_usage(days: u16, mobile: State<'_, UsageMobile>) -> Result<UsageReport, String> {
    #[cfg(target_os = "android")]
    {
        let response: UsageResponse = mobile
            .plugin
            .run_mobile_plugin(
                "queryUsage",
                serde_json::json!({ "days": days.max(1).min(365) }),
            )
            .map_err(|error| error.to_string())?;
        Ok(UsageReport {
            apps: response.apps,
            total_today_ms: response.total_today_ms,
        })
    }

    #[cfg(not(target_os = "android"))]
    {
        let _ = (days, mobile);
        android_only_error()
    }
}

/// Consulta um único app pelo package name (usa o mesmo query em lote, filtrado).
#[tauri::command]
fn get_app_usage(
    package_name: String,
    days: u16,
    mobile: State<'_, UsageMobile>,
) -> Result<Option<AppUsage>, String> {
    #[cfg(target_os = "android")]
    {
        let response: UsageResponse = mobile
            .plugin
            .run_mobile_plugin(
                "queryUsage",
                serde_json::json!({
                    "days": days.max(1).min(365),
                    "packageName": package_name,
                }),
            )
            .map_err(|error| error.to_string())?;
        Ok(response.apps.into_iter().next())
    }

    #[cfg(not(target_os = "android"))]
    {
        let _ = (package_name, days, mobile);
        android_only_error()
    }
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(usage_plugin())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            list_tasks,
            add_task,
            toggle_task,
            remove_task,
            app_info,
            check_usage_permission,
            request_usage_permission,
            get_all_app_usage,
            get_app_usage
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
