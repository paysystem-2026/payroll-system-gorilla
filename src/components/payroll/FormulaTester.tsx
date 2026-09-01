import { useState } from "react";
import type { PayrollRule, FormulaTestResult, TestInput } from "@/types/payroll";
import { payrollService } from "@/services/payroll";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FlaskConical, Plus, X, CheckCircle, XCircle } from "lucide-react";

interface FormulaTesterProps {
  rules: PayrollRule[];
}

export function FormulaTester({ rules }: FormulaTesterProps) {
  const [expression, setExpression] = useState("");
  const [inputs, setInputs] = useState<TestInput[]>([{ code: "BASIC", value: 100000 }]);
  const [result, setResult] = useState<FormulaTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const addInput = () => setInputs([...inputs, { code: "", value: 0 }]);
  const removeInput = (idx: number) => setInputs(inputs.filter((_, i) => i !== idx));
  const updateInput = (idx: number, field: "code" | "value", val: string) => {
    setInputs(inputs.map((inp, i) =>
      i === idx
        ? field === "code"
          ? { ...inp, code: val.toUpperCase() }
          : { ...inp, value: Number(val) || 0 }
        : inp
    ));
  };

  const handleTest = async () => {
    if (!expression.trim()) return;
    setTesting(true);
    try {
      const res = await payrollService.testFormula({
        expression: expression.trim(),
        inputs: inputs.filter((i) => i.code.trim()),
      });
      setResult(res);
    } catch (e) {
      setResult({ success: false, result: null, error: String(e), breakdown: [] });
    } finally {
      setTesting(false);
    }
  };

  const insertCode = (code: string) => {
    setExpression(expression + (expression && !expression.endsWith(" ") ? " " : "") + code);
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-[#4a8b3f]" />
          <h3 className="text-[15px] font-semibold text-[#e8e8e8]">Formula Tester</h3>
        </div>

        <div className="mb-3">
          <label className="mb-1.5 block text-[12px] font-medium text-[#e8e8e8]">Expression</label>
          <textarea
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            className="min-h-[60px] w-full resize-y rounded-lg border border-[#2e2e2e] bg-[#0d0d0d] px-3 py-2 font-mono text-[13px] text-[#e8e8e8] placeholder:text-[#888888] focus:outline-none focus:border-[#4a8b3f]"
            placeholder="e.g. BASIC + TRANSPORT + ACCOMMODATION"
          />
        </div>

        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[12px] font-medium text-[#e8e8e8]">Input Variables</label>
            <button onClick={addInput} className="text-[#4a8b3f] hover:text-[#3d7a35]">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {inputs.map((inp, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={inp.code}
                  onChange={(e) => updateInput(idx, "code", e.target.value)}
                  placeholder="CODE"
                  className="w-32 rounded-lg border border-[#2e2e2e] bg-[#0d0d0d] px-3 py-1.5 font-mono text-[13px] text-[#e8e8e8] placeholder:text-[#888888] focus:outline-none focus:border-[#4a8b3f]"
                />
                <input
                  type="number"
                  value={inp.value}
                  onChange={(e) => updateInput(idx, "value", e.target.value)}
                  className="flex-1 rounded-lg border border-[#2e2e2e] bg-[#0d0d0d] px-3 py-1.5 text-[13px] text-[#e8e8e8] focus:outline-none focus:border-[#4a8b3f]"
                />
                <button onClick={() => removeInput(idx)} className="text-[#888888] hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-medium text-[#888888]">Quick Insert (component codes)</label>
          <div className="flex flex-wrap gap-1.5">
            {rules.map((r) => (
              <button
                key={r.id}
                onClick={() => insertCode(r.code)}
                className="rounded-md border border-[#2e2e2e] bg-[#242424] px-2 py-1 font-mono text-[11px] text-[#888888] hover:border-[#4a8b3f] hover:text-[#e8e8e8]"
              >
                {r.code}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleTest} disabled={testing || !expression.trim()}>
          {testing ? "Testing..." : "Test Formula"}
        </Button>
      </Card>

      {result && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-[#4a8b3f]" />
            ) : (
              <XCircle className="h-5 w-5 text-white" />
            )}
            <span className={`text-[15px] font-semibold ${result.success ? "text-[#4a8b3f]" : "text-white"}`}>
              {result.success ? `Result: ${result.result}` : "Error"}
            </span>
          </div>
          {result.error && (
            <p className="rounded-lg border border-[#5a3a1e] bg-[#2a2018] px-3 py-2 text-[13px] text-[#e8a44c]">
              {result.error}
            </p>
          )}
          {result.breakdown.length > 0 && (
            <div className="mt-3 space-y-1">
              {result.breakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-[#242424] px-3 py-2">
                  <span className="font-mono text-[13px] text-[#888888]">{item.code}</span>
                  <span className="text-[13px] font-medium text-[#e8e8e8]">{item.amount}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
