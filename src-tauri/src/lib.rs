use std::io::Read;
use std::net::TcpListener;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let dist_dir: Arc<PathBuf> = Arc::new(
        std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("dist"),
    );

    let dist = dist_dir.clone();
    std::thread::spawn(move || {
        let listener = TcpListener::bind("127.0.0.1:14876").unwrap();
        for stream in listener.incoming() {
            let dist = dist.clone();
            std::thread::spawn(move || {
                let mut stream = stream.unwrap();
                let mut buf = [0u8; 4096];
                let n = stream.read(&mut buf).unwrap_or(0);
                let req = String::from_utf8_lossy(&buf[..n]);
                let path = req
                    .lines()
                    .next()
                    .and_then(|l| l.split_whitespace().nth(1))
                    .unwrap_or("/");
                let path = path.trim_start_matches('/');
                let path = if path.is_empty() { "index.html" } else { path };

                let file_path = dist.join(path);
                let serve_path = if file_path.is_file() {
                    file_path
                } else {
                    dist.join("index.html") // SPA fallback
                };

                let content_type = match serve_path.extension().and_then(|e| e.to_str()) {
                    Some("html") => "text/html; charset=utf-8",
                    Some("css") => "text/css",
                    Some("js") => "application/javascript",
                    Some("json") => "application/json",
                    Some("png") => "image/png",
                    Some("jpg") | Some("jpeg") => "image/jpeg",
                    Some("webp") => "image/webp",
                    Some("svg") => "image/svg+xml",
                    Some("ico") => "image/x-icon",
                    _ => "application/octet-stream",
                };

                if let Ok(data) = std::fs::read(&serve_path) {
                    let resp = format!(
                        "HTTP/1.1 200 OK\r\nContent-Type: {}\r\nContent-Length: {}\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n",
                        content_type,
                        data.len()
                    );
                    let _ = std::io::Write::write_all(&mut stream, resp.as_bytes());
                    let _ = std::io::Write::write_all(&mut stream, &data);
                }
            });
        }
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let window = app.get_webview_window("main").unwrap();
            let _ = window.navigate("http://127.0.0.1:14876".parse().unwrap());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
