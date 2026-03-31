import { useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Plus, X } from "lucide-react";
import { useMonthlyFocus } from "@/lib/store";

export default function MonthlyFocus() {
  const [monthly, setMonthly] = useMonthlyFocus();
  const [driftInput, setDriftInput] = useState("");

  const monthLabel = format(new Date(), "yyyy骞碝鏈?, { locale: zhCN });
  const update = (patch: Partial<typeof monthly>) => setMonthly((p) => ({ ...p, ...patch }));

  const updateAxis = (idx: number, val: string) => {
    const axes = [...monthly.axes] as [string, string, string];
    axes[idx] = val;
    update({ axes });
  };

  const addDrift = () => {
    if (!driftInput.trim()) return;
    update({ riskDrift: [...monthly.riskDrift, driftInput.trim()] });
    setDriftInput("");
  };

  const removeDrift = (idx: number) => {
    update({ riskDrift: monthly.riskDrift.filter((_, i) => i !== idx) });
  };

  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <div className="mb-6 fade-in">
          <h1 className="text-2xl font-bold tracking-tight">鏈湀涓荤嚎</h1>
          <p className="text-sm text-muted-foreground">{monthLabel}</p>
        </div>

        {/* 3 Axes */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">馃幆 涓夊ぇ鎺ㄨ繘杞?/h2>
          <div className="space-y-2">
            {monthly.axes.map((axis, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border bg-card p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={axis}
                  onChange={(e) => updateAxis(i, e.target.value)}
                  placeholder={`鎺ㄨ繘杞?${i + 1}`}
                  className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/30"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Resource Focus */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">馃挵 璧勬簮鐒︾偣</h2>
          <div className="rounded-xl border bg-card p-4 space-y-3">
            {([
              { key: "money" as const, label: "馃挼 涓昏鎶曢挶", placeholder: "杩欎釜鏈堥挶鑺卞湪鍝紵" },
              { key: "time" as const, label: "鈴?涓昏鎶曟椂闂?, placeholder: "杩欎釜鏈堟椂闂磋姳鍦ㄥ摢锛? },
              { key: "attention" as const, label: "馃 涓昏鎶曟敞鎰忓姏", placeholder: "杩欎釜鏈堟敞鎰忓姏鏀惧湪鍝紵" },
            ]).map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs text-muted-foreground">{field.label}</label>
                <input
                  type="text"
                  value={monthly.resourceFocus[field.key]}
                  onChange={(e) =>
                    update({
                      resourceFocus: { ...monthly.resourceFocus, [field.key]: e.target.value },
                    })
                  }
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Risk Drift */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">鈿狅笍 鍗遍櫓鍋忕Щ</h2>
          <p className="text-xs text-muted-foreground mb-2">杩欎釜鏈堟渶瀹规槗鎺夎繘浠€涔堝潙锛?/p>
          <div className="space-y-1.5">
            {monthly.riskDrift.map((item, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                <span className="text-xs text-destructive">鈿?/span>
                <span className="flex-1 text-sm">{item}</span>
                <button onClick={() => removeDrift(i)} className="text-muted-foreground/40 hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={driftInput}
              onChange={(e) => setDriftInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDrift()}
              placeholder="渚嬪锛氳繃搴﹀彂鏁ｃ€佹儏缁€ф帴娲?.."
              className="flex-1 rounded-lg border bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
            />
            <button onClick={addDrift} className="rounded-lg bg-primary p-2 text-primary-foreground">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
