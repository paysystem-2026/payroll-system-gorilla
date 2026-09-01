import { Printer } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { PayrollPeriod, PayrollRecord } from "@/types/payroll";

const fmt = (value: number) => new Intl.NumberFormat("en-RW", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(Number.isFinite(value) ? value : 0);

const CORE_ORDER = [
  "BASIC", "TRANSPORT", "ACCOMMODATION", "OTHER_EARNINGS", "TAXABLE_BASE", "PAYE",
  "RSSB_BASE", "PENSION_EMP", "PENSION_ER", "PENSION_2", "PENSION_TOTAL",
  "MATERNITY_EMP", "MATERNITY_ER", "MATERNITY_TOTAL", "CHBI", "LOAN_DED",
  "TOTAL_DED", "NET_SALARY",
];

function snapshotOf(record: PayrollRecord): any {
  try { return record.calculation_snapshot ? JSON.parse(record.calculation_snapshot) : null; }
  catch { return null; }
}

function itemMap(record: PayrollRecord): Map<string, { amount: number; name: string }> {
  const snapshot = snapshotOf(record);
  return new Map((snapshot?.items ?? []).map((item: any) => [
    String(item.code ?? "").toUpperCase(),
    { amount: Number(item.amount) || 0, name: String(item.name ?? item.code ?? "") },
  ]));
}


function displayName(code: string, name?: string) {
  if (code === "TAXABLE_BASE") return "Taxable Base";
  if (code === "NET_SALARY") return "Net Salary";
  if (code === "TOTAL_DED") return "Total Deductions";
  return name || code.replace(/_/g, " ");
}

function componentColumns(records: PayrollRecord[]) {
  const map = new Map<string, string>();
  for (const record of records) {
    for (const [code, item] of itemMap(record)) {
      if (code !== "TOTAL_DED" && code !== "NET_SALARY") map.set(code, item.name);
    }
  }
  return [...map.keys()].sort((a, b) => {
    const ai = CORE_ORDER.indexOf(a), bi = CORE_ORDER.indexOf(b);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.localeCompare(b);
  }).map(code => ({ code, name: displayName(code, map.get(code)) }));
}

interface Props {
  period: PayrollPeriod | null;
  records: PayrollRecord[];
}

export function PayrollReportPanel({ period, records }: Props) {
  const columns = componentColumns(records);
  const rows = records.map(record => ({ record, items: itemMap(record) }));

  const totals = new Map<string, number>();
  for (const { record, items } of rows) {
    for (const column of columns) {
      const value = column.code === "NET_SALARY"
        ? record.net_pay
        : column.code === "TOTAL_DED"
          ? record.total_deductions
          : items.get(column.code)?.amount ?? 0;
      totals.set(column.code, (totals.get(column.code) ?? 0) + value);
    }
  }

  const print = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print-hide">
        <div>
          <h3 className="text-lg font-semibold text-white">Payroll Report</h3>
          <p className="text-sm text-[#8f8f8f]">Complete payroll register from the frozen calculation snapshots.</p>
        </div>
        <Button onClick={print} disabled={!rows.length}>
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      <Card className="payroll-report-print print-target overflow-hidden border-[#2b2b2b] bg-[#121212] p-0 shadow-[0_18px_50px_rgba(0,0,0,.25)]">
        <div className="border-b border-[#2b2b2b] px-5 py-4">
          <div className="flex items-start justify-between gap-5">
            <div className="flex items-center gap-3">
              <img src="/gorilla-doctors.jpeg" alt="Gorilla Doctors" className="h-12 w-12 object-contain" />
              <div>
                <div className="text-sm font-bold tracking-wide text-white print:text-black">GORILLA DOCTORS</div>
                <div className="text-xs text-[#8f8f8f] print:text-black/60">PAYROLL REGISTER / MONTHLY PAYROLL REPORT</div>
              </div>
            </div>
            <div className="text-right text-[11px] text-[#9c9c9c] print:text-black">
              <div className="font-semibold text-white print:text-black">{period?.period_name ?? "No period selected"}</div>
              {period && <>
                <div>{period.start_date} → {period.end_date}</div>
                <div>Pay date: {period.pay_date || "—"}</div>
                <div>Employees: {records.length}</div>
              </>}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse text-[8px] leading-tight">
            <thead className="bg-[#181818] text-[#b0b0b0] print:bg-white print:text-black">
              <tr className="border-b border-[#444] print:border-black">
                <th className="whitespace-nowrap border-r border-[#333] px-1.5 py-2 text-left print:border-black">No.</th>
                <th className="whitespace-nowrap border-r border-[#333] px-1.5 py-2 text-left print:border-black">Employee</th>
                <th className="whitespace-nowrap border-r border-[#333] px-1.5 py-2 text-left print:border-black">Department</th>
                <th className="whitespace-nowrap border-r border-[#333] px-1.5 py-2 text-left print:border-black">Position</th>
                {columns.map(column => (
                  <th key={column.code} title={column.name} className="min-w-[18mm] border-r border-[#333] px-1.5 py-2 text-right print:border-black">
                    <span className="block font-bold">{column.code}</span>
                    <span className="block font-normal opacity-70">{column.name}</span>
                  </th>
                ))}
                <th className="min-w-[20mm] border-r border-[#333] px-1.5 py-2 text-right print:border-black">GROSS</th>
                <th className="min-w-[20mm] border-r border-[#333] px-1.5 py-2 text-right print:border-black">DEDUCTIONS</th>
                <th className="min-w-[20mm] border-r border-[#333] px-1.5 py-2 text-right print:border-black">NET PAY</th>
                <th className="min-w-[20mm] px-1.5 py-2 text-right">EMPLOYER</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ record, items }, index) => (
                <tr key={record.id} className="border-b border-[#252525] print:border-gray-300">
                  <td className="whitespace-nowrap border-r border-[#333] px-1.5 py-2 print:border-gray-300">{index + 1}</td>
                  <td className="min-w-[38mm] border-r border-[#333] px-1.5 py-2 print:border-gray-300">
                    <div className="font-semibold">{record.employee_code}</div>
                    <div>{record.employee_name}</div>
                  </td>
                  <td className="min-w-[30mm] border-r border-[#333] px-1.5 py-2 print:border-gray-300">{record.department_name || "—"}</td>
                  <td className="min-w-[30mm] border-r border-[#333] px-1.5 py-2 print:border-gray-300">{record.position_title || "—"}</td>
                  {columns.map(column => {
                    const value = column.code === "NET_SALARY"
                      ? record.net_pay
                      : column.code === "TOTAL_DED"
                        ? record.total_deductions
                        : items.get(column.code)?.amount ?? 0;
                    return <td key={column.code} className="border-r border-[#333] px-1.5 py-2 text-right tabular-nums print:border-gray-300">{fmt(value)}</td>;
                  })}
                  <td className="border-r border-[#333] px-1.5 py-2 text-right font-semibold tabular-nums print:border-gray-300">{fmt(record.gross_earnings)}</td>
                  <td className="border-r border-[#333] px-1.5 py-2 text-right font-semibold tabular-nums print:border-gray-300">{fmt(record.total_deductions)}</td>
                  <td className="border-r border-[#333] px-1.5 py-2 text-right font-bold tabular-nums print:border-gray-300">{fmt(record.net_pay)}</td>
                  <td className="px-1.5 py-2 text-right font-semibold tabular-nums">{fmt(record.employer_contributions)}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={columns.length + 8} className="px-5 py-14 text-center text-[#7f7f7f]">Calculate a payroll period to generate the report.</td></tr>
              )}
              {rows.length > 0 && (
                <tr className="border-t-2 border-black bg-[#1a1a1a] font-bold print:bg-white">
                  <td colSpan={4} className="border-r border-[#333] px-1.5 py-2 print:border-gray-300">TOTAL</td>
                  {columns.map(column => <td key={column.code} className="border-r border-[#333] px-1.5 py-2 text-right tabular-nums print:border-gray-300">{fmt(totals.get(column.code) ?? 0)}</td>)}
                  <td className="border-r border-[#333] px-1.5 py-2 text-right tabular-nums print:border-gray-300">{fmt(rows.reduce((s, r) => s + r.record.gross_earnings, 0))}</td>
                  <td className="border-r border-[#333] px-1.5 py-2 text-right tabular-nums print:border-gray-300">{fmt(rows.reduce((s, r) => s + r.record.total_deductions, 0))}</td>
                  <td className="border-r border-[#333] px-1.5 py-2 text-right tabular-nums print:border-gray-300">{fmt(rows.reduce((s, r) => s + r.record.net_pay, 0))}</td>
                  <td className="px-1.5 py-2 text-right tabular-nums">{fmt(rows.reduce((s, r) => s + r.record.employer_contributions, 0))}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
