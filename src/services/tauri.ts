import { invoke as tauriInvoke } from "@tauri-apps/api/core";

const desktop = typeof window !== "undefined" && Boolean((window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
const store: Record<string, unknown[]> = {};
const list = <T>(key: string): T[] => (store[key] ?? []) as T[];
const set = (key: string, value: unknown[]) => { store[key] = value; };
const id = (items: unknown[]) => items.length ? Math.max(...items.map(item => Number((item as { id?: number }).id ?? 0))) + 1 : 1;

const previewPayrollRules = [
  { id:1,name:"Basic Salary",code:"BASIC",component_type:"earning",calc_type:"fixed",side:"employee",rate:null,formula_expression:null,base_reference:null,is_taxable:false,is_pensionable:false,sort_order:1,effective_date:"2026-01-01",is_active:true,version:1 },
  { id:2,name:"Transport",code:"TRANSPORT",component_type:"earning",calc_type:"percentage",side:"employee",rate:10,formula_expression:null,base_reference:"BASIC",is_taxable:true,is_pensionable:false,sort_order:2,effective_date:"2026-01-01",is_active:true,version:1 },
  { id:3,name:"Accommodation",code:"ACCOMMODATION",component_type:"earning",calc_type:"percentage",side:"employee",rate:15,formula_expression:null,base_reference:"BASIC",is_taxable:true,is_pensionable:false,sort_order:3,effective_date:"2026-01-01",is_active:true,version:1 },
  { id:4,name:"Taxable Base",code:"TAXABLE_BASE",component_type:"earning",calc_type:"formula",side:"employee",rate:null,formula_expression:"BASIC + TRANSPORT + ACCOMMODATION",base_reference:null,is_taxable:false,is_pensionable:false,sort_order:4,effective_date:"2026-01-01",is_active:true,version:1 },
  { id:5,name:"PAYE",code:"PAYE",component_type:"tax",calc_type:"formula",side:"employee",rate:null,formula_expression:"max(0, min((TAXABLE_BASE - 80000) * 0.2, 24000) + max(0, TAXABLE_BASE - 200000) * 0.3)",base_reference:null,is_taxable:false,is_pensionable:false,sort_order:5,effective_date:"2026-01-01",is_active:true,version:1 },
  { id:6,name:"Employee Pension",code:"PENSION_EMP",component_type:"contribution",calc_type:"percentage",side:"employee",rate:6,formula_expression:null,base_reference:"TAXABLE_BASE",is_taxable:false,is_pensionable:false,sort_order:6,effective_date:"2026-01-01",is_active:true,version:1 },
  { id:7,name:"Employer Pension",code:"PENSION_ER",component_type:"contribution",calc_type:"percentage",side:"employer",rate:6,formula_expression:null,base_reference:"TAXABLE_BASE",is_taxable:false,is_pensionable:false,sort_order:7,effective_date:"2026-01-01",is_active:true,version:1 },
  { id:8,name:"Pension 2%",code:"PENSION_2",component_type:"contribution",calc_type:"percentage",side:"employer",rate:2,formula_expression:null,base_reference:"TAXABLE_BASE",is_taxable:false,is_pensionable:false,sort_order:8,effective_date:"2026-01-01",is_active:true,version:1 },
  { id:9,name:"Maternity Employee",code:"MATERNITY_EMP",component_type:"contribution",calc_type:"percentage",side:"employee",rate:0.3,formula_expression:null,base_reference:"TAXABLE_BASE",is_taxable:false,is_pensionable:false,sort_order:9,effective_date:"2026-01-01",is_active:true,version:1 },
  { id:10,name:"Maternity Employer",code:"MATERNITY_ER",component_type:"contribution",calc_type:"percentage",side:"employer",rate:0.3,formula_expression:null,base_reference:"TAXABLE_BASE",is_taxable:false,is_pensionable:false,sort_order:10,effective_date:"2026-01-01",is_active:true,version:1 },
  { id:11,name:"CHBI",code:"CHBI",component_type:"contribution",calc_type:"percentage",side:"employer",rate:0.5,formula_expression:null,base_reference:"NET_SALARY",is_taxable:false,is_pensionable:false,sort_order:11,effective_date:"2026-01-01",is_active:true,version:1 },
  { id:12,name:"Loan / Advance Deduction",code:"LOAN_DED",component_type:"deduction",calc_type:"fixed",side:"employee",rate:null,formula_expression:null,base_reference:null,is_taxable:false,is_pensionable:false,sort_order:12,effective_date:"2026-01-01",is_active:true,version:1 },
  { id:13,name:"Other Deductions",code:"OTHER_DED",component_type:"deduction",calc_type:"fixed",side:"employee",rate:0,formula_expression:null,base_reference:null,is_taxable:false,is_pensionable:false,sort_order:13,effective_date:"2026-01-01",is_active:true,version:1 },
  { id:14,name:"Total Deductions",code:"TOTAL_DED",component_type:"deduction",calc_type:"formula",side:"employee",rate:null,formula_expression:"PAYE + PENSION_EMP + MATERNITY_EMP + OTHER_DED + LOAN_DED",base_reference:null,is_taxable:false,is_pensionable:false,sort_order:14,effective_date:"2026-01-01",is_active:true,version:1 },
  { id:15,name:"Net Salary",code:"NET_SALARY",component_type:"earning",calc_type:"formula",side:"employee",rate:null,formula_expression:"TAXABLE_BASE - TOTAL_DED",base_reference:null,is_taxable:false,is_pensionable:false,sort_order:15,effective_date:"2026-01-01",is_active:true,version:1 },
];

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const previewPayrollCalc = (basic: number, loanDed = 0) => {
  const transport = round2(basic * 0.10);
  const accommodation = round2(basic * 0.15);
  const taxable = round2(basic + transport + accommodation);
  const paye = round2(Math.max(0, Math.min((taxable - 80000) * 0.20, 24000) + Math.max(0, taxable - 200000) * 0.30));
  const pensionEmp = round2(taxable * 0.06);
  const pensionEr = round2(taxable * 0.06);
  const pension2 = round2(taxable * 0.02);
  const maternityEmp = round2(taxable * 0.003);
  const maternityEr = round2(taxable * 0.003);
  const totalDed = round2(paye + pensionEmp + maternityEmp + loanDed);
  const net = round2(taxable - totalDed);
  const chbi = round2(net * 0.005);
  const employer = round2(pensionEr + pension2 + maternityEr + chbi);
  const items = [
    ["BASIC","Basic Salary","earning","fixed","employee",basic],
    ["TRANSPORT","Transport","earning","percentage","employee",transport],
    ["ACCOMMODATION","Accommodation","earning","percentage","employee",accommodation],
    ["TAXABLE_BASE","Taxable Base","earning","formula","employee",taxable],
    ["PAYE","PAYE","tax","formula","employee",paye],
    ["PENSION_EMP","Employee Pension","contribution","percentage","employee",pensionEmp],
    ["PENSION_ER","Employer Pension","contribution","percentage","employer",pensionEr],
    ["PENSION_2","Pension 2%","contribution","percentage","employer",pension2],
    ["MATERNITY_EMP","Maternity Employee","contribution","percentage","employee",maternityEmp],
    ["MATERNITY_ER","Maternity Employer","contribution","percentage","employer",maternityEr],
    ["CHBI","CHBI","contribution","percentage","employer",chbi],
    ["LOAN_DED","Loan / Advance Deduction","deduction","fixed","employee",loanDed],
    ["TOTAL_DED","Total Deductions","deduction","formula","employee",totalDed],
    ["NET_SALARY","Net Salary","earning","formula","employee",net],
  ].map(([code,name,component_type,calc_type,side,amount]) => ({code,name,component_type,calc_type,side,rate:null,formula:null,base_reference:null,amount:String(amount)}));
  return { items, gross_earnings:String(taxable), total_deductions:String(totalDed), total_tax:String(paye), net_pay:String(net), employer_contributions:String(employer), errors:[] };
};

function previewInvoke<T>(command: string, args: Record<string, unknown> | undefined, fallback: T): T {
  const input = args ?? {};
  if (command === "get_backup_settings") return (JSON.parse(sessionStorage.getItem("payroll-preview-backup-settings") || JSON.stringify({enabled:true,frequency:"daily",time:"02:00",retention:7,location:"~/.payroll-system/backups"}))) as T;
  if (command === "update_backup_settings") { sessionStorage.setItem("payroll-preview-backup-settings", JSON.stringify(input.settings)); return {success:true,message:"Backup settings saved in preview"} as T; }
  if (command === "list_backups" || command === "get_backup_status") { const backups = list<T>("backups") as T[]; if (command === "get_backup_status") return {last_backup: backups[0] ?? null,next_backup:null,backup_count:backups.length,settings:JSON.parse(sessionStorage.getItem("payroll-preview-backup-settings") || JSON.stringify({enabled:true,frequency:"daily",time:"02:00",retention:7,location:"~/.payroll-system/backups"}))} as T; return backups as T; }
  if (command === "create_backup") { const items=list<Record<string,unknown>>("backups"); const backup={id:id(items),file_path:"preview://payroll-backup",file_size:0,backup_type:"manual",status:"completed",created_at:new Date().toISOString(),checksum:null,encrypted:true,database_version:"1",app_version:"1.0.0"}; set("backups",[backup,...items]); return {success:true,message:"Backup created in preview mode",backup} as T; }
  if (command === "verify_backup") return {success:true,message:"Backup verified in preview mode",backup:null} as T;
  if (command === "restore_backup" || command === "restore_backup_file") return {success:true,message:"Restore simulated in preview mode",backup:null} as T;
  if (command === "delete_backup") { set("backups",list<Record<string,unknown>>("backups").filter(x=>x.id!==input.backupId)); return {success:true,message:"Backup deleted in preview",backup:null} as T; }
  if (command === "get_employees") return list<T>("employees") as T;
  if (command === "get_employee") return (list<Record<string, unknown>>("employees").find(x => x.id === input.employeeId) ?? null) as T;
  if (command === "save_employee") { const request = input.request as Record<string, unknown>; const items = list<Record<string, unknown>>("employees"); const saved = { ...request, id: request.id ?? id(items), is_active: request.employment_status === "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), department_name: null, position_title: null }; set("employees", request.id ? items.map(x => x.id === request.id ? { ...x, ...saved } : x) : [saved, ...items]); return { success: true, message: "Saved in preview", id: saved.id } as T; }
  if (command === "delete_employee") { set("employees", list<Record<string, unknown>>("employees").filter(x => x.id !== input.employeeId)); return { success: true, message: "Deleted in preview", id: null } as T; }
  if (command === "get_salary_history") return list<T>("salaryHistory").filter(x => Number((x as any).employee_id) === Number(input.employeeId)).sort((a:any,b:any)=>String(b.effective_date).localeCompare(String(a.effective_date))) as T;
  if (command === "add_salary_record") { const request=input.request as Record<string,unknown>; const items=list<Record<string,unknown>>("salaryHistory"); const saved={...request,id:request.id??id(items),created_at:new Date().toISOString()}; set("salaryHistory",[saved,...items]); return {success:true,message:"Salary saved in preview",id:saved.id} as T; }
  if (command === "get_departments") return list<T>("departments") as T;
  if (command === "get_positions") { const dept = input.departmentId; return list<Record<string, unknown>>("positions").filter(x => !dept || x.department_id === dept) as T; }
  if (command === "save_department" || command === "save_position" || command === "save_company") { const key = command === "save_department" ? "departments" : command === "save_position" ? "positions" : "company"; const request = input.request as Record<string, unknown>; const items = list<Record<string, unknown>>(key); const saved = { ...request, id: request.id ?? id(items) }; set(key, request.id ? items.map(x => x.id === request.id ? { ...x, ...saved } : x) : [...items, saved]); return { success: true, message: "Saved in preview", id: saved.id } as T; }
  if (command === "delete_department" || command === "delete_position") { const key = command === "delete_department" ? "departments" : "positions"; set(key, list<Record<string, unknown>>(key).filter(x => x.id !== input.id)); return { success: true, message: "Deleted in preview", id: input.id } as T; }
  if (command === "get_company") return (list<T>("company")[0] ?? null) as T;
  if (command === "get_employee_payroll_overrides") return list<T>("employeePayrollOverrides").filter(x => Number((x as any).employee_id) === Number(input.employeeId)) as T;
  if (command === "save_employee_payroll_override") { const request=input.request as Record<string,unknown>; const items=list<Record<string,unknown>>("employeePayrollOverrides"); const saved={...request,id:request.id??id(items),is_active:true}; set("employeePayrollOverrides",request.id?items.map(x=>x.id===request.id?{...x,...saved}:x):[saved,...items]); return {success:true,message:"Employee payroll component saved in preview",id:saved.id} as T; }
  if (command === "delete_employee_payroll_override") { set("employeePayrollOverrides",list<Record<string,unknown>>("employeePayrollOverrides").filter(x=>x.id!==input.id)); return {success:true,message:"Employee payroll component removed",id:input.id} as T; }
  if (command === "get_contract_types") return list<T>("contractTypes") as T;
  if (command === "save_contract_type") {
    const request = input.request as Record<string, unknown>;
    const items = list<Record<string, unknown>>("contractTypes");
    const saved = {
      ...request,
      id: request.id ?? id(items),
      is_active: true,
    };
    set("contractTypes", request.id
      ? items.map(x => x.id === request.id ? { ...x, ...saved } : x)
      : [saved, ...items]);
    return { success: true, message: "Saved in preview", id: saved.id } as T;
  }
  if (command === "delete_contract_type") {
    set("contractTypes", list<Record<string, unknown>>("contractTypes").filter(x => x.id !== input.id));
    return { success: true, message: "Deleted in preview", id: input.id } as T;
  }
  if (command === "get_payroll_rules") return { rules: list<T>("payrollRules").length ? list<T>("payrollRules") : (previewPayrollRules as unknown as T[]), errors: [] } as T;
  if (command === "test_formula") {
    const request = input.request as { expression: string; inputs?: { code: string; value: number }[] };
    const values: Record<string, number> = Object.fromEntries((request.inputs ?? []).map(x => [x.code, Number(x.value)]));
    let expression = String(request.expression ?? "");
    for (const [code, value] of Object.entries(values)) expression = expression.replace(new RegExp(`\\b${code}\\b`, "g"), String(value));
    if (!/^[0-9+\-*/().,%\sA-Za-z_]+$/.test(expression)) return { success: false, result: null, error: "Formula contains unsupported characters in preview.", breakdown: [] } as T;
    try {
      const safe = expression.replace(/\bmax\s*\(/g, "Math.max(").replace(/\bmin\s*\(/g, "Math.min(");
      if (!/^[0-9+\-*/().,%\sMathmaxin]+$/.test(safe)) return { success: false, result: null, error: "Preview supports basic arithmetic, min and max.", breakdown: [] } as T;
      const result = Function(`"use strict"; return (${safe});`)();
      if (typeof result !== "number" || !Number.isFinite(result)) throw new Error("Formula did not return a finite number.");
      return { success: true, result: String(round2(result)), error: null, breakdown: [] } as T;
    } catch (e) {
      return { success: false, result: null, error: e instanceof Error ? e.message : "Invalid formula.", breakdown: [] } as T;
    }
  }
  if (command === "preview_calculation") {
    const request = input.request as { basic_salary?: number };
    const calc = previewPayrollCalc(Number(request.basic_salary ?? 0), 0);
    return { success: calc.errors.length === 0, ...calc } as T;
  }
  if (command === "save_payroll_rule") {
    const request = input.request as Record<string, unknown>;
    const items = list<Record<string, unknown>>("payrollRules");
    const source = items.length ? items : (previewPayrollRules as unknown as Record<string, unknown>[]);
    const saved = { ...request, id: request.id ?? id(source), effective_date: new Date().toISOString().slice(0,10), is_active: true, version: Number((request as any).version ?? 1) };
    set("payrollRules", request.id ? source.map(x => x.id === request.id ? { ...x, ...saved } : x) : [...source, saved]);
    return { success:true,message:"Saved in preview",rule_id:saved.id,errors:[] } as T;
  }
  if (command === "toggle_payroll_rule") { set("payrollRules", list<Record<string, unknown>>("payrollRules").map(x=>x.id===input.ruleId?{...x,is_active:input.isActive}:x)); return {success:true,message:"Updated in preview",rule_id:input.ruleId,errors:[]} as T; }
  if (command === "delete_payroll_rule") { set("payrollRules", list<Record<string, unknown>>("payrollRules").filter(x=>x.id!==input.ruleId)); return {success:true,message:"Deleted in preview",rule_id:null,errors:[]} as T; }
  if (command === "get_payroll_periods") return list<T>("payrollPeriods") as T;
  if (command === "save_payroll_period") { const request=input.request as Record<string,unknown>; const items=list<Record<string,unknown>>("payrollPeriods"); const saved={...request,id:request.id??id(items),status:"open",config_version:1,record_count:0,total_gross:0,total_deductions:0,total_tax:0,total_net:0,employer_contributions:0}; set("payrollPeriods",request.id?items.map(x=>x.id===request.id?{...x,...saved}:x):[saved,...items]); return {success:true,message:"Payroll period saved in preview",id:saved.id} as T; }
  if (command === "delete_payroll_period") { set("payrollPeriods", list<Record<string,unknown>>("payrollPeriods").filter(x=>x.id!==input.periodId)); return {success:true,message:"Deleted in preview",id:input.periodId} as T; }
  if (command === "get_payroll_records") return list<T>("payrollRecords").filter(x=>Number((x as any).period_id)===Number(input.periodId)) as T;
  if (command === "calculate_payroll_period") {
    const period=list<Record<string,unknown>>("payrollPeriods").find(x=>Number(x.id)===Number(input.periodId));
    if(!period) return {success:false,message:"Create/select a payroll period first.",period_id:input.periodId,records:[],errors:["No period selected"]} as T;
    const employees=list<Record<string,unknown>>("employees").filter(x=>x.is_active!==false && x.employment_status==="active");
    const loans=list<Record<string,unknown>>("loans");
    const records=employees.map(employee=>{
      const loanDed=loans.filter(l=>Number(l.employee_id)===Number(employee.id)&&l.status==="active").reduce((s,l)=>s+Number(l.installment_amount??0),0);
      const calc=previewPayrollCalc(Number(employee.base_salary??0),round2(loanDed));
      return {id:id(list("payrollRecords")),period_id:period.id,employee_id:employee.id,employee_code:employee.employee_code,employee_name:`${employee.first_name??""} ${employee.last_name??""}`.trim(),department_name:employee.department_name??null,position_title:employee.position_title??null,base_salary:Number(employee.base_salary??0),gross_earnings:Number(calc.gross_earnings),total_deductions:Number(calc.total_deductions),total_tax:Number(calc.total_tax),net_pay:Number(calc.net_pay),employer_contributions:Number(calc.employer_contributions),status:"calculated",config_version:1,calculation_snapshot:JSON.stringify({items:calc.items,totals:{gross_earnings:calc.gross_earnings,total_deductions:calc.total_deductions,total_tax:calc.total_tax,net_pay:calc.net_pay,employer_contributions:calc.employer_contributions}})};
    });
    set("payrollRecords", [...list<Record<string,unknown>>("payrollRecords").filter(x=>Number(x.period_id)!==Number(period.id)),...records]);
    const next={...period,status:"processing",record_count:records.length,total_gross:records.reduce((s,r)=>s+Number(r.gross_earnings),0),total_deductions:records.reduce((s,r)=>s+Number(r.total_deductions),0),total_tax:records.reduce((s,r)=>s+Number(r.total_tax),0),total_net:records.reduce((s,r)=>s+Number(r.net_pay),0),employer_contributions:records.reduce((s,r)=>s+Number(r.employer_contributions),0)};
    set("payrollPeriods",list<Record<string,unknown>>("payrollPeriods").map(x=>x.id===period.id?next:x));
    return {success:true,message:"Payroll calculated in preview. Review before finalizing.",period_id:period.id,records,errors:[]} as T;
  }
  if (command === "finalize_payroll_period") {
    const period=list<Record<string,unknown>>("payrollPeriods").find(x=>Number(x.id)===Number(input.periodId));
    const records: Record<string,unknown>[] = list<Record<string,unknown>>("payrollRecords").filter(x=>Number(x.period_id)===Number(input.periodId));
    if(!period||!records.length) return {success:false,message:"Calculate payroll before finalizing.",period_id:input.periodId,records,errors:["No payroll records"]} as T;
    const finalized: Record<string,unknown>[] = records.map(r=>({...r,status:"finalized"}));
    set("payrollRecords",[...list<Record<string,unknown>>("payrollRecords").filter(x=>Number(x.period_id)!==Number(input.periodId)),...finalized]);
    const next={...period,status:"closed"}; set("payrollPeriods",list<Record<string,unknown>>("payrollPeriods").map(x=>x.id===period.id?next:x));
    const slips=finalized.map(r=>({id:id(list("payslips")),payroll_record_id:r.id,employee_id:r.employee_id,employee_name:r.employee_name,employee_code:r.employee_code,period_name:period.period_name,payslip_number:`PS-${period.id}-${r.employee_code}`,net_pay:r.net_pay,generated_at:new Date().toISOString(),calculation_snapshot:r.calculation_snapshot}));
    set("payslips",[...list<Record<string,unknown>>("payslips").filter(x=>Number(x.period_id)!==Number(input.periodId)),...slips]);
    return {success:true,message:"Payroll finalized and payslips prepared in preview.",period_id:period.id,records:finalized,errors:[]} as T;
  }
  if (command === "get_loans") return list<T>("loans") as T;
  if (command === "save_loan") { const request=input.request as Record<string,unknown>; const items=list<Record<string,unknown>>("loans"); const saved={...request,id:request.id??id(items),status:"active",paid_installments:0,remaining_amount:Number(request.total_amount??request.principal??0)}; set("loans",request.id?items.map(x=>x.id===request.id?{...x,...saved}:x):[saved,...items]); return {success:true,message:"Loan saved in preview",id:saved.id} as T; }
  if (command === "get_payslips") return list<T>("payslips") as T;
  if (command === "get_leave_types") return list<T>("leaveTypes").filter(x => (x as Record<string, unknown>).is_active !== false) as T;
  if (command === "delete_leave_type") { set("leaveTypes", list<Record<string, unknown>>("leaveTypes").map(x => x.id === input.id ? { ...x, is_active: false } : x)); return { success: true, message: "Leave type removed", id: input.id } as T; }
  if (command === "save_leave_type") { const request = input.request as Record<string, unknown>; const items = list<Record<string, unknown>>("leaveTypes"); const saved = { ...request, id: request.id ?? id(items), is_active: true }; set("leaveTypes", request.id ? items.map(x => x.id === request.id ? { ...x, ...saved } : x) : [...items, saved]); return { success: true, message: "Leave type saved", id: saved.id } as T; }
  if (command === "get_leave_records") { const selectedYear = Number(input.year ?? 0); return list<Record<string, unknown>>("leaveRecords").filter(record => !selectedYear || String(record.start_date ?? "").startsWith(String(selectedYear))) as T; }
  if (command === "save_leave_record") {
    const request = input.request as Record<string, unknown>;
    const items = list<Record<string, unknown>>("leaveRecords");
    const employees = list<Record<string, unknown>>("employees");
    const leaveTypes = list<Record<string, unknown>>("leaveTypes");
    const employee = employees.find(x => Number(x.id) === Number(request.employee_id));
    const leaveType = leaveTypes.find(x => Number(x.id) === Number(request.leave_type_id));
    const saved = {
      ...request,
      id: request.id ?? id(items),
      status: request.status ?? "pending",
      employee_name: employee ? `${String(employee.first_name ?? "")} ${String(employee.last_name ?? "")}`.trim() : "Unknown employee",
      leave_type_name: leaveType?.name ?? "Unknown leave type",
      created_at: request.id ? (items.find(x => x.id === request.id)?.created_at ?? new Date().toISOString()) : new Date().toISOString(),
    };
    set("leaveRecords", request.id ? items.map(x => x.id === request.id ? { ...x, ...saved } : x) : [saved, ...items]);
    return { success: true, message: "Leave saved", id: saved.id } as T;
  }
  if (command === "update_leave_status") { set("leaveRecords", list<Record<string, unknown>>("leaveRecords").map(x => x.id === input.leaveId ? { ...x, status: input.status } : x)); return { success: true, message: "Leave status updated", id: input.leaveId } as T; }
  if (command === "get_leave_balances") {
    const year = Number(input.year ?? new Date().getFullYear());
    const employees = list<Record<string, unknown>>("employees").filter(x => x.is_active !== false);
    const leaveTypes = list<Record<string, unknown>>("leaveTypes").filter(x => x.is_active !== false);
    const records = list<Record<string, unknown>>("leaveRecords");
    const balances = [];
    for (const employee of employees) {
      for (const leaveType of leaveTypes) {
        const used = records.reduce((sum, record) => {
          const approved = record.status === "approved";
          const sameEmployee = Number(record.employee_id) === Number(employee.id);
          const sameType = Number(record.leave_type_id) === Number(leaveType.id);
          const sameYear = String(record.start_date ?? "").startsWith(String(year));
          return sum + (approved && sameEmployee && sameType && sameYear ? Number(record.days ?? 0) : 0);
        }, 0);
        balances.push({
          employee_id: employee.id,
          employee_name: `${String(employee.first_name ?? "")} ${String(employee.last_name ?? "")}`.trim(),
          leave_type_id: leaveType.id,
          leave_type_name: leaveType.name,
          year,
          entitled: Number(leaveType.default_days ?? 0),
          used,
          remaining: Math.max(0, Number(leaveType.default_days ?? 0) - used),
        });
      }
    }
    return balances as T;
  }
  if (command === "get_reminders" || command === "get_due_reminders" || command === "get_unread_due_reminders") {
    const reminders = list<Record<string, unknown>>("reminders");
    const due = reminders.filter(r => r.is_completed !== true && new Date(String(r.due_date)).getTime() <= Date.now() && (!r.snoozed_until || new Date(String(r.snoozed_until)).getTime() <= Date.now()));
    if (command === "get_unread_due_reminders") return due.filter(r => !r.read_at) as T;
    return (command === "get_due_reminders" ? due : reminders) as T;
  }
  if (command === "save_reminder") {
    const r = input.reminder as Record<string, unknown>;
    const items = list<Record<string, unknown>>("reminders");
    const saved = { ...r, id: r.id ?? id(items), reminder_type: r.reminderType, due_date: r.dueDate, recurrence: r.recurrence, is_completed: false, snoozed_until: null, completed_at: null, read_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    set("reminders", r.id ? items.map(x => x.id === r.id ? { ...x, ...saved } : x) : [saved, ...items]);
    return saved as T;
  }
  if (command === "complete_reminder") {
    const items = list<Record<string, unknown>>("reminders");
    const r = items.find(x => Number(x.id) === Number(input.reminderId));
    if (!r) return fallback;
    const next = r.recurrence && r.recurrence !== "none" ? { ...r, due_date: new Date(new Date(String(r.due_date)).getTime() + (r.recurrence === "daily" ? 86400000 : r.recurrence === "weekly" ? 604800000 : 2592000000)).toISOString() } : { ...r, is_completed: true, completed_at: new Date().toISOString() };
    set("reminders", items.map(x => x.id === r.id ? next : x)); return next as T;
  }
  if (command === "snooze_reminder") { const items=list<Record<string,unknown>>("reminders"); const next=items.find(x=>Number(x.id)===Number(input.reminderId)); if(!next)return fallback; const saved={...next,snoozed_until:new Date(Date.now()+Number(input.minutes)*60000).toISOString(),read_at:null}; set("reminders",items.map(x=>x.id===next.id?saved:x)); return saved as T; }
  if (command === "mark_reminder_read") { const items=list<Record<string,unknown>>("reminders"); const next=items.find(x=>Number(x.id)===Number(input.reminderId)); if(!next)return fallback; const saved={...next,read_at:new Date().toISOString()}; set("reminders",items.map(x=>x.id===next.id?saved:x)); return saved as T; }
  if (command === "delete_reminder") { set("reminders",list<Record<string,unknown>>("reminders").filter(x=>Number(x.id)!==Number(input.reminderId))); return undefined as T; }
  return fallback;
}

export function invokeCommand<T>(command: string, args: Record<string, unknown> | undefined, fallback: T): Promise<T> {
  if (desktop && typeof tauriInvoke === "function") return tauriInvoke<T>(command, args);
  return Promise.resolve(previewInvoke(command, args, fallback));
}
