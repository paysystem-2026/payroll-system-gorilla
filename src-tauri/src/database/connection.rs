use rusqlite::Connection;
use std::fs;
use std::sync::Mutex;
use std::time::Duration;

use super::migrations;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn init() -> Result<Self, Box<dyn std::error::Error>> {
        let app_dir = dirs_app_dir();
        fs::create_dir_all(&app_dir)?;

        let db_path = app_dir.join("payroll.db");
        let conn = Connection::open(db_path)?;

        conn.execute_batch("PRAGMA journal_mode=WAL;")?;
        conn.execute_batch("PRAGMA foreign_keys=ON;")?;
        conn.busy_timeout(Duration::from_secs(5))?;

        migrations::run(&conn)?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
}

fn dirs_app_dir() -> std::path::PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    std::path::PathBuf::from(home).join(".payroll-system")
}
