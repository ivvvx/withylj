use std::io::Read;
use std::net::TcpListener;
use std::path::PathBuf;
use std::sync::{Arc, mpsc};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let dist_dir: Arc<PathBuf> = Arc::new(
        std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("dist"),
    );

    let dist = dist_dir.clone();
    let canonical_dist = dist.canonicalize().ok();
    let (tx, rx) = mpsc::channel::<u16>();

    std::thread::spawn(move || {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        tx.send(port).unwrap();

        for stream in listener.incoming() {
            let dist = dist.clone();
            let canonical_dist = canonical_dist.clone();
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
                let path = path.split('?').next().unwrap_or(path);
                let path = if path.is_empty() { "index.html" } else { path };

                let file_path = dist.join(path);

                // Resolve candidate, applying path traversal guard
                let serve_path = {
                    let resolved = file_path.canonicalize().ok();
                    match (&resolved, &canonical_dist) {
                        (Some(r), Some(d)) if r.starts_with(d) && r.is_file() => Some(r.clone()),
                        _ if file_path.is_file() && !path.contains("..") => Some(file_path),
                        _ => None,
                    }
                };

                let (status, body) = match serve_path {
                    Some(p) if p.is_file() => {
                        let content_type = match p.extension().and_then(|e| e.to_str()) {
                            Some("html") => "text/html; charset=utf-8",
                            Some("css") => "text/css",
                            Some("js") => "application/javascript",
                            Some("json") => "application/json",
                            Some("png") => "image/png",
                            Some("jpg") | Some("jpeg") => "image/jpeg",
                            Some("webp") => "image/webp",
                            Some("svg") => "image/svg+xml",
                            Some("ico") => "image/x-icon",
                            Some("woff") => "font/woff",
                            Some("woff2") => "font/woff2",
                            _ => "application/octet-stream",
                        };
                        match std::fs::read(&p) {
                            Ok(data) => (200, data),
                            Err(_) => (404, b"Not Found".to_vec()),
                        }
                    }
                    _ => {
                        // SPA fallback: serve index.html
                        let index_path = dist.join("index.html");
                        match std::fs::read(&index_path) {
                            Ok(data) => (200, data),
                            Err(_) => (404, b"Not Found".to_vec()),
                        }
                    }
                };

                let status_text = if status == 200 { "OK" } else { "Not Found" };
                let content_type = if status == 200 {
                    "text/html; charset=utf-8"
                } else {
                    "text/plain"
                };
                let resp = format!(
                    "HTTP/1.1 {} {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n",
                    status, status_text,
                    content_type,
                    body.len()
                );
                let _ = std::io::Write::write_all(&mut stream, resp.as_bytes());
                let _ = std::io::Write::write_all(&mut stream, &body);
            });
        }
    });

    let port = rx.recv().unwrap();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let window = app.get_webview_window("main").unwrap();
            let url = format!("http://127.0.0.1:{}", port);
            let _ = window.navigate(url.parse().unwrap());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
