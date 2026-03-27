import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useDailyEntry, DEFAULT_ROLES, type DailyReview } from "@/lib/store";
import { Check } from "lucide-react";

const FAIL_REASONS = [
  { value: "too_big", label: "目标定太大" },
  { value: "interrupted", label: "被突发打断" },
  { value: "avoided", label: "自己逃避" },
  { value: "dependency", label: "依赖别人未完成" },
];

const DRIFT_OPTIONS = [
  { value: "no" as const, label: "没有" },
  { value: "slight" as const, label: "有一点" },
  { value: "major" as const, label: "明显偏了" },
];

const ENERGY_ACCURACY = [
  { value: "accurate" as const, label: "很准" },
  { value: "ok" as const, label: "一般" },
  { value: "wrong" as const, label: "不准" },
];

export default function Review() {
  const [entry, setEntry] = useDailyEntry();
  const dateStr = format(new Date(), "M月d日 EEEE", { locale: zhCN });

  const review: DailyReview = entry.review || {
    sacredDone: entry.sacredTask.done,
    failReason: "",
    drifted: "no",
    energyAccurate: "accurate",
    bestProgress: "",
    tomorrowRole: "",
    tomorrowSacred: "",
    completed: false,
  };

  const updateReview = (patch: Partial<DailyReview>) => {
    setEntry((p) => ({ ...p, review: { ...review, ...patch } }));
  };

  const RadioGroup = ({
    options,
    value,
    onChange,
  }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all card-press ${
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <div className="mb-6 fade-in">
          <h1 className="text-2xl font-bold tracking-tight">🌙 晚间复盘</h1>
          <p className="text-sm text-muted-foreground">{dateStr}</p>
        </div>

        {/* Sacred task completion */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">神圣任务完成了吗？</h2>
          {entry.sacredTask.title ? (
            <div className="rounded-xl border-2 border-sacred-border bg-sacred-bg p-4 mb-3">
              <p className="text-sm font-semibold">{entry.sacredTask.title}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">今天没有设定神圣任务</p>
          )}
          <RadioGroup
            options={[
              { value: "true", label: "✅ 完成了" },
              { value: "false", label: "❌ 没完成" },
            ]}
            value={String(review.sacredDone)}
            onChange={(v) => updateReview({ sacredDone: v === "true" })}
          />
        </section>

        {/* Fail reason */}
        {!review.sacredDone && (
          <section className="mb-6 fade-in">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">未完成原因</h2>
            <RadioGroup
              options={FAIL_REASONS}
              value={review.failReason}
              onChange={(v) => updateReview({ failReason: v })}
            />
          </section>
        )}

        {/* Drift check */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">今天有没有掉出主线？</h2>
          <RadioGroup
            options={DRIFT_OPTIONS}
            value={review.drifted}
            onChange={(v) => updateReview({ drifted: v as DailyReview["drifted"] })}
          />
        </section>

        {/* Energy accuracy */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">今天能量判断准不准？</h2>
          <RadioGroup
            options={ENERGY_ACCURACY}
            value={review.energyAccurate}
            onChange={(v) => updateReview({ energyAccurate: v as DailyReview["energyAccurate"] })}
          />
        </section>

        {/* Best progress */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">今天最值得记录的一件推进</h2>
          <input
            type="text"
            value={review.bestProgress}
            onChange={(e) => updateReview({ bestProgress: e.target.value })}
            placeholder="一句话记录..."
            className="w-full rounded-xl border bg-card p-3 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
          />
        </section>

        {/* Tomorrow preview */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">明天预设</h2>
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">明天的主角色</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {DEFAULT_ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => updateReview({ tomorrowRole: role.id })}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                      review.tomorrowRole === role.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {role.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">明天的神圣任务</label>
              <input
                type="text"
                value={review.tomorrowSacred}
                onChange={(e) => updateReview({ tomorrowSacred: e.target.value })}
                placeholder="明天最重要的一件事..."
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
        </section>

        {/* Save */}
        <button
          onClick={() => updateReview({ completed: true })}
          className={`w-full rounded-xl p-4 text-sm font-semibold transition-all card-press ${
            review.completed
              ? "bg-success text-success-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {review.completed ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4" /> 复盘已完成
            </span>
          ) : (
            "完成今日复盘"
          )}
        </button>
      </div>
    </div>
  );
}
