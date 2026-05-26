mod git_update;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            git_update::check_git_update,
            git_update::pull_git_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
