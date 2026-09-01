import { useState } from "react";
import type { PayrollRule, CalcResult } from "@/types/payroll";
import { payrollService } from "@/services/payroll";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calculator, AlertCircle } from "lucide-react";

interface PreviewPanelProps {
  rules: PayrollRule[];
}

export function PreviewPanel({ rules }: PreviewPanelProps) {
  const [basicSalary, setBasicSalary] = useState("100000");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePreview = async () => {
    setLoading(true);
    try {
      const res = await payrollService.previewCalculation(Number(basicSalary) || 0);
      setResult(res);
    } catch (e) {
      setResult({
        items: [],
        gross_earnings: "0",
        total_deductions: "0",
        total_tax: "0",
        net_pay: "0",
        employer_contributions: "0",
        errors: [String(e)],
      });
    } finally {
      setLoading(false);
    }
  };

  const fmt = (s: string) => {
    const n = Number(s);
    if (isNaN(n)) return s;
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-[#4a8b3f]" />
          <h3 className="text-[15px] font-semibold text-[#e8e8e8]">Calculation Preview</h3>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-[12px] font-medium text-[#e8e8e8]">Basic Salary</label>
            <input
              type="number"
              value={basicSalary}
              onChange={(e) => setBasicSalary(e.target.value)}
              className="w-full rounded-lg border border-[#2e2e2e] bg-[#0d0d0d] px-3 py-2 text-[13px] text-[#e8e8e8] focus:outline-none focus:border-[#4a8b3f]"
              placeholder="Enter basic salary"
            />
          </div>
          <Button onClick={handlePreview} disabled={loading || !basicSalary}>
            {loading ? "Calculating..." : "Preview"}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-[#888888]">
          Uses all {rules.filter((r) => r.is_active).length} active rules. Calculation runs in Rust with decimal precision.
        </p>
      </Card>

      {result && (
        <>
          {result.errors.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-[#5a3a1e] bg-[#2a2018] px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#e8a44c]" />
              <div className="space-y-1">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-[13px] text-[#e8a44c]">{e}</p>
                ))}
              </div>
            </div>
          )}

          <Card>
            <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-[#888888]">Breakdown</h4>
            <div className="space-y-1">
              {result.items.map((item) => {
                const isEmployer = item.side === "employer";
                return (
                  <div
                    key={item.code}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                      item.code === "NET_SALARY"
                        ? "border border-[#4a8b3f] bg-[#1e3a1a]"
                        : "bg-[#242424]"
                    }`}
                  >
                    <div>
                      <span className="font-mono text-[13px] font-medium text-[#e8e8e8]">{item.code}</span>
                      <span className="ml-2 text-[12px] text-[#888888]">{item.name}</span>
                      {isEmployer && (
                        <span className="ml-2 rounded bg-[#4a8b3f]/12 px-1.5 py-0.5 text-[10px] text-[#86b67c]">employer</span>
                      )}
                    </div>
                    <span className={`text-[13px] font-medium ${
                      item.code === "NET_SALARY" ? "text-[#4a8b3f]" : "text-[#e8e8e8]"
                    }`}>
                      {fmt(item.amount)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#2e2e2e] pt-4">
              <SummaryRow label="Gross Earnings" value={fmt(result.gross_earnings)} />
              <SummaryRow label="Total Deductions" value={fmt(result.total_deductions)} />
              <SummaryRow label="Total Tax" value={fmt(result.total_tax)} />
              <SummaryRow label="Employer Contributions" value={fmt(result.employer_contributions)} />
              <div className="col-span-2 mt-2 flex items-center justify-between rounded-lg border border-[#4a8b3f] bg-[#1e3a1a] px-4 py-3">
                <span className="text-[14px] font-semibold text-[#e8e8e8]">Net Pay</span>
                <span className="text-[16px] font-bold text-[#4a8b3f]">{fmt(result.net_pay)}</span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#242424] px-3 py-2">
      <span className="text-[12px] text-[#888888]">{label}</span>
      <span className="text-[13px] font-medium text-[#e8e8e8]">{value}</span>
    </div>
  );
}
