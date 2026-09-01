use serde::Serialize;
use tauri::State;
use crate::database::connection::Database;
use crate::security::session;

#[derive(Serialize)]
pub struct AuditEntry {
    pub id: i64,
    pub action: String,
    pub entity_type: Option<String>,
    pub entity_id: Option<i64>,
    pub details: Option<String>,
    pub created_at: String,
}

#[derive(Serialize)]
pub struct SystemInfo {
    pub app_version: String,
    pub database_version: String,
    pub database_path: String,
    pub database_size_bytes: u64,
    pub employee_count: i64,
    pub department_count: i64,
    pub backup_count: i64,
    pub paired_device_count: i64,
    pub audit_count: i64,
    pub platform: String,
    pub architecture: String,
}

fn require_admin(conn: &rusqlite::Connection, token: &str) -> Result<i64, String> {
    if token.trim().is_empty() { return Err("Authentication required".into()); }
    let mut stmt = conn.prepare("SELECT admin_id, session_token, is_locked FROM admin_sessions WHERE expires_at > datetime('now') ORDER BY id DESC")
        .map_err(|e| format!("Unable to validate session: {e}"))?;
    let rows = stmt.query_map([], |r| Ok((r.get::<_,i64>(0)?, r.get::<_,String>(1)?, r.get::<_,i64>(2)?)))
        .map_err(|e| format!("Unable to validate session: {e}"))?;
    for row in rows.flatten() {
        if let Ok(stored) = session::decrypt_token(&row.1) {
            if stored == token {
                if row.2 == 1 { return Err("Session is locked".into()); }
                return Ok(row.0);
            }
        }
    }
    Err("Session expired or not found".into())
}

#[tauri::command]
pub fn get_audit_logs(db: State<Database>, token: String, search: Option<String>, limit: Option<i64>) -> Result<Vec<AuditEntry>, String> {
    let conn = db.conn.lock().map_err(|_| "Database lock unavailable".to_string())?;
    let _ = require_admin(&conn, &token)?;
    let limit = limit.unwrap_or(100).clamp(1, 500);
    let search = search.unwrap_or_default().trim().to_string();
    let like = format!("%{}%", search);
    let mut stmt = conn.prepare(
        "SELECT id, action, entity_type, entity_id, details, created_at
         FROM audit_logs
         WHERE ?1 = '' OR action LIKE ?2 OR COALESCE(entity_type,'') LIKE ?2 OR COALESCE(details,'') LIKE ?2
         ORDER BY id DESC LIMIT ?3"
    ).map_err(|e| format!("Unable to load audit logs: {e}"))?;
    let rows = stmt.query_map(rusqlite::params![search, like, limit], |r| Ok(AuditEntry {
        id: r.get(0)?, action: r.get(1)?, entity_type: r.get(2)?, entity_id: r.get(3)?, details: r.get(4)?, created_at: r.get(5)?,
    })).map_err(|e| format!("Unable to load audit logs: {e}"))?;
    rows.map(|r| r.map_err(|e| format!("Unable to read audit log: {e}"))).collect()
}

#[tauri::command]
pub fn get_system_info(db: State<Database>, token: String) -> Result<SystemInfo, String> {
    let conn = db.conn.lock().map_err(|_| "Database lock unavailable".to_string())?;
    let _ = require_admin(&conn, &token)?;
    let app_dir = std::path::PathBuf::from(std::env::var("HOME").unwrap_or_else(|_| ".".into())).join(".payroll-system");
    let db_path = app_dir.join("payroll.db");
    let db_size = std::fs::metadata(&db_path).map(|m| m.len()).unwrap_or(0);
    let count = |sql: &str| -> i64 { conn.query_row(sql, [], |r| r.get::<_,i64>(0)).unwrap_or(0) };
    let db_version = conn.query_row("PRAGMA user_version", [], |r| r.get::<_,i64>(0)).unwrap_or(0);
    Ok(SystemInfo {
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        database_version: db_version.to_string(),
        database_path: db_path.to_string_lossy().to_string(),
        database_size_bytes: db_size,
        employee_count: count("SELECT COUNT(*) FROM employees"),
        department_count: count("SELECT COUNT(*) FROM departments"),
        backup_count: count("SELECT COUNT(*) FROM backups"),
        paired_device_count: count("SELECT COUNT(*) FROM devices WHERE status='paired'"),
        audit_count: count("SELECT COUNT(*) FROM audit_logs"),
        platform: std::env::consts::OS.to_string(),
        architecture: std::env::consts::ARCH.to_string(),
    })
}
