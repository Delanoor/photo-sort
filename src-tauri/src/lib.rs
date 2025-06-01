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

#[tauri::command]
async fn copy_file(source_path: String, target_dir: String) -> Result<String, String> {
    let source = Path::new(&source_path);
    let target_directory = Path::new(&target_dir);

    // Validate source file exists
    if !source.exists() || !source.is_file() {
        return Err("Source file does not exist".to_string());
    }

    // Validate target directory exists
    if !target_directory.exists() || !target_directory.is_dir() {
        return Err("Target directory does not exist".to_string());
    }

    // Get the filename from the source path
    let filename = source
        .file_name()
        .ok_or("Could not extract filename from source path")?;

    // Create the target file path
    let target_path = target_directory.join(filename);

    // Check if file already exists and create a unique name if necessary
    let mut final_target = target_path.clone();
    let mut counter = 1;

    while final_target.exists() {
        if let Some(stem) = target_path.file_stem() {
            if let Some(extension) = target_path.extension() {
                let new_name = format!(
                    "{}_{}.{}",
                    stem.to_string_lossy(),
                    counter,
                    extension.to_string_lossy()
                );
                final_target = target_directory.join(new_name);
            } else {
                let new_name = format!("{}_{}", stem.to_string_lossy(), counter);
                final_target = target_directory.join(new_name);
            }
        } else {
            return Err("Could not process filename".to_string());
        }
        counter += 1;
    }

    // Copy the file
    match fs::copy(source, &final_target) {
        Ok(_) => Ok(final_target.to_string_lossy().to_string()),
        Err(e) => Err(format!("Failed to copy file: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            load_photos_from_directory,
            copy_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
