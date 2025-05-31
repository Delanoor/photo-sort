use serde::Serialize;
use std::fs;
use std::path::Path;

#[derive(Serialize)]
struct PhotoInfo {
    name: String,
    path: String,
    size: u64,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn load_photos_from_directory(directory_path: String) -> Result<Vec<PhotoInfo>, String> {
    let path = Path::new(&directory_path);

    if !path.exists() || !path.is_dir() {
        return Err("Invalid directory path".to_string());
    }

    let mut photos = Vec::new();
    let photo_extensions = vec!["jpg", "jpeg", "png", "gif", "bmp", "tiff", "tif", "webp"];

    match fs::read_dir(path) {
        Ok(entries) => {
            for entry in entries {
                match entry {
                    Ok(entry) => {
                        let file_path = entry.path();
                        if let Some(extension) = file_path.extension() {
                            if let Some(ext_str) = extension.to_str() {
                                if photo_extensions.contains(&ext_str.to_lowercase().as_str()) {
                                    if let Ok(metadata) = entry.metadata() {
                                        photos.push(PhotoInfo {
                                            name: file_path
                                                .file_name()
                                                .unwrap_or_default()
                                                .to_string_lossy()
                                                .to_string(),
                                            path: file_path.to_string_lossy().to_string(),
                                            size: metadata.len(),
                                        });
                                    }
                                }
                            }
                        }
                    }
                    Err(_) => continue,
                }
            }
        }
        Err(e) => return Err(format!("Failed to read directory: {}", e)),
    }

    Ok(photos)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet, load_photos_from_directory])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
