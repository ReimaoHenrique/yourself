use serde::{Deserialize, Serialize};
use std::sync::Mutex;

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

#[derive(Default)]
pub struct AppState(Mutex<Vec<Task>>);

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            list_tasks,
            add_task,
            toggle_task,
            remove_task,
            app_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
