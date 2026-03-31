import { useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Plus, X } from "lucide-react";
import { useMonthlyFocus } from "@/lib/store";

export default function MonthlyFocus() {
  const [monthly, setMonthly] = useMonthlyFocus();
  const [driftInput, setDriftInput] = useState("");

  const monthLabel = format(new Date(), "yyyy年M月", { locale: zhCN });
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
          <h1 className="text-2xl font-bold tracking-tight">本月主线</h1>
          <p className="text-sm text-muted-foreground">{monthLabel}</p>
        </div>

        {/* 3 Axes */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">🎯 三大推进轴</h2>
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
                  placeholder={`推进轴 ${i + 1}`}
                  className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/30"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Resource Focus */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">💰 资源焦点</h2>
          <div className="rounded-xl border bg-card p-4 space-y-3">
            {([
              { key: "money" as const, label: "💵 主要投钱", placeholder: "这个月钱花在哪？" },
              { key: "time" as const, label: "⏰ 主要投时间", placeholder: "这个月时间花在哪？" },
              { key: "attention" as const, label: "🧠 主要投注意力", placeholder: "这个月注意力放在哪？" },
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
          <h2 className="text-sm font-medium text-muted-foreground mb-2">⚠️ 危险偏移</h2>
          <p className="text-xs text-muted-foreground mb-2">这个月最容易掉进什么坑？</p>
          <div className="space-y-1.5">
            {monthly.riskDrift.map((item, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                <span className="text-xs text-destructive">⚠</span>
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
              placeholder="例如：过度发散、情绪性接活..."
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
