mod database;
mod commands;
mod security;
mod payroll;
mod core;

use database::connection::Database;

pub fn run() {
    let db = Database::init().expect("Failed to initialize database");
    core::backup::start_scheduler();
    let _ = commands::lan::start_lan_discovery(&db);

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(db)
        .invoke_handler(tauri::generate_handler![
            commands::database::ping,
            commands::auth::get_auth_status,
            commands::auth::setup_admin,
            commands::auth::login,
            commands::auth::logout,
            commands::auth::lock_session,
            commands::auth::unlock_session,
            commands::auth::change_password,
            commands::auth::forgot_password,
            commands::auth::get_admin_profile,
            commands::auth::get_security_settings,
            commands::auth::update_security_settings,
            commands::administration::get_audit_logs,
            commands::administration::get_system_info,
            commands::payroll::get_payroll_rules,
            commands::payroll::save_payroll_rule,
            commands::payroll::toggle_payroll_rule,
            commands::payroll::delete_payroll_rule,
            commands::payroll::get_rule_versions,
            commands::payroll::test_formula,
            commands::payroll::preview_calculation,
            commands::payroll::validate_rules,
            commands::payroll::get_payroll_periods,
            commands::payroll::save_payroll_period,
            commands::payroll::delete_payroll_period,
            commands::payroll::calculate_payroll_period,
            commands::payroll::get_payroll_records,
            commands::payroll::finalize_payroll_period,
            commands::payroll::get_loans,
            commands::payroll::save_loan,
            commands::payroll::get_payslips,
            commands::staff::get_employees,
            commands::staff::get_employee,
            commands::staff::save_employee,
            commands::staff::delete_employee,
            commands::staff::get_salary_history,
            commands::staff::add_salary_record,
            commands::staff::get_employee_payroll_overrides,
            commands::staff::save_employee_payroll_override,
            commands::staff::delete_employee_payroll_override,
            commands::staff::get_departments,
            commands::staff::get_positions,
            commands::staff::get_company,
            commands::staff::save_company,
            commands::staff::save_department,
            commands::staff::delete_department,
            commands::staff::save_position,
            commands::staff::delete_position,
            commands::staff::get_contract_types,
            commands::staff::save_contract_type,
            commands::staff::delete_contract_type,
            commands::staff::generate_employee_code,
            commands::leaves::get_leave_types,
            commands::leaves::save_leave_type,
            commands::leaves::delete_leave_type,
            commands::leaves::get_leave_records,
            commands::leaves::save_leave_record,
            commands::leaves::update_leave_status,
            commands::leaves::get_leave_balances,
            commands::backup::get_backup_status,
            commands::backup::get_backup_settings,
            commands::backup::update_backup_settings,
            commands::backup::create_backup,
            commands::backup::list_backups,
            commands::backup::verify_backup,
            commands::backup::restore_backup,
            commands::backup::restore_backup_file,
            commands::backup::delete_backup,
            commands::lan::get_lan_device,
            commands::lan::discover_lan_devices,
            commands::lan::request_lan_pairing,
            commands::lan::get_lan_pairing_requests,
            commands::lan::approve_lan_pairing,
            commands::lan::get_paired_lan_devices,
            commands::lan::send_lan_backup,
            commands::lan::get_lan_transfer_history,
            commands::lan::test_lan_connection,
            commands::lan::revoke_lan_device,
            commands::lan::import_lan_backup,
            commands::reminders::get_reminders,
            commands::reminders::save_reminder,
            commands::reminders::complete_reminder,
            commands::reminders::snooze_reminder,
            commands::reminders::delete_reminder,
            commands::reminders::get_due_reminders,
            commands::reminders::get_unread_due_reminders,
            commands::reminders::mark_reminder_read,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
