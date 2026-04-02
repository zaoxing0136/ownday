import { useState } from "react";
import { addMonths, addWeeks, format, startOfWeek } from "date-fns";
import HeaderActionLink from "@/components/HeaderActionLink";
import PilotBadge from "@/components/PilotBadge";
import { cn } from "@/lib/utils";
import {
  getMonthKey,
  getSavedMonthKeys,
  getSavedWeekStarts,
  getWeekStartKey,
  useMonthlyFocus,
  useWeeklyFocus,
  type TaskStatus,
} from "@/lib/store";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "未开始",
  doing: "推进中",
  done: "完成",
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: "doing",
  doing: "done",
  done: "todo",
};

export default function Mainline() {
  const currentMonthKey = getMonthKey();
  const currentWeekStart = getWeekStartKey();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [selectedWeekStart, setSelectedWeekStart] = useState(currentWeekStart);
  const [monthly, setMonthly] = useMonthlyFocus(selectedMonth);
  const [weekly, setWeekly] = useWeeklyFocus(selectedWeekStart);
  const recentMonths = Array.from(new Set([currentMonthKey, selectedMonth, ...getSavedMonthKeys()]))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 6);
  const recentWeeks = Array.from(new Set([currentWeekStart, selectedWeekStart, ...getSavedWeekStarts()]))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 6);

  const updateMonthly = (patch: Partial<typeof monthly>) => {
    setMonthly((prev) => ({ ...prev, ...patch }));
  };

  const updateWeekly = (patch: Partial<typeof weekly>) => {
    setWeekly((prev) => ({ ...prev, ...patch }));
  };

  const updateAxis = (index: number, value: string) => {
    const axes = [...monthly.axes] as typeof monthly.axes;
    axes[index] = value;
    updateMonthly({ axes });
  };

  const updateBattle = (index: number, patch: Partial<typeof weekly.battles[0]>) => {
    const battles = [...weekly.battles] as typeof weekly.battles;
    battles[index] = { ...battles[index], ...patch };
    updateWeekly({ battles });
  };

  const jumpMonth = (offset: number) => {
    const next = format(addMonths(new Date(`${selectedMonth}-01T12:00:00`), offset), "yyyy-MM");
    setSelectedMonth(next);
  };

  const jumpWeek = (offset: number) => {
    const next = format(addWeeks(new Date(`${selectedWeekStart}T12:00:00`), offset), "yyyy-MM-dd");
    setSelectedWeekStart(next);
  };

  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <header className="page-header fade-in">
          <div>
            <p className="page-caption mt-0">只看这段时间真正该往前推的东西。</p>
            <h1 className="page-title mt-2">主线</h1>
            <div className="page-badges">
              <PilotBadge />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="surface-card px-3 py-3">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <button onClick={() => jumpMonth(-1)} className="glass-chip text-foreground">
                    上月
                  </button>
                  <span>本月</span>
                  <button onClick={() => jumpMonth(1)} className="glass-chip text-foreground">
                    下月
                  </button>
                </div>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => {
                    if (event.target.value) setSelectedMonth(event.target.value);
                  }}
                  className="w-full rounded-xl border border-border/60 bg-white/80 px-3 py-2 text-sm text-foreground outline-none"
                />
              </div>

              <div className="surface-card px-3 py-3">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <button onClick={() => jumpWeek(-1)} className="glass-chip text-foreground">
                    上周
                  </button>
                  <span>本周</span>
                  <button onClick={() => jumpWeek(1)} className="glass-chip text-foreground">
                    下周
                  </button>
                </div>
                <input
                  type="date"
                  value={selectedWeekStart}
                  onChange={(event) => {
                    if (!event.target.value) return;
                    setSelectedWeekStart(
                      format(
                        startOfWeek(new Date(`${event.target.value}T12:00:00`), { weekStartsOn: 1 }),
                        "yyyy-MM-dd"
                      )
                    );
                  }}
                  className="w-full rounded-xl border border-border/60 bg-white/80 px-3 py-2 text-sm text-foreground outline-none"
                />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {recentMonths.map((month) => (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={cn(
                    "glass-chip text-[11px]",
                    selectedMonth === month && "border-primary/25 bg-primary/10 text-primary"
                  )}
                >
                  {month}
                </button>
              ))}
              {recentWeeks.map((week) => (
                <button
                  key={week}
                  onClick={() => setSelectedWeekStart(week)}
                  className={cn(
                    "glass-chip text-[11px]",
                    selectedWeekStart === week && "border-primary/25 bg-primary/10 text-primary"
                  )}
                >
                  周 {format(new Date(`${week}T12:00:00`), "M/d")}
                </button>
              ))}
            </div>
          </div>
          <HeaderActionLink />
        </header>

        <section className="section-block fade-in">
          <div className="section-bar">
            <h2 className="section-title">本月三条主线</h2>
          </div>
          <div className="space-y-2">
            {monthly.axes.map((axis, index) => (
              <div key={index} className="stack-card">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={axis}
                    onChange={(event) => updateAxis(index, event.target.value)}
                    placeholder={`主线 ${index + 1}`}
                    className="w-full border-none bg-transparent px-0 py-0 text-sm font-medium shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section-block fade-in">
          <div className="section-bar">
            <h2 className="section-title">本周唯一主题</h2>
          </div>
          <div className="hero-panel px-4 py-4">
            <input
              type="text"
              value={weekly.theme}
              onChange={(event) => updateWeekly({ theme: event.target.value })}
              placeholder="这周到底在抓什么"
              className="w-full border-none bg-transparent px-0 py-0 text-[1.2rem] font-semibold shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
            />
          </div>
        </section>

        <section className="fade-in">
          <div className="section-bar">
            <h2 className="section-title">本周三件关键事</h2>
          </div>
          <div className="space-y-2">
            {weekly.battles.map((battle, index) => (
              <div key={index} className="stack-card">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateBattle(index, { status: NEXT_STATUS[battle.status] })}
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
                      battle.status === "done"
                        ? "bg-success/15 text-success"
                        : battle.status === "doing"
                          ? "bg-primary/12 text-primary"
                          : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {STATUS_LABELS[battle.status]}
                  </button>
                  <input
                    type="text"
                    value={battle.name}
                    onChange={(event) => updateBattle(index, { name: event.target.value })}
                    placeholder={`关键事 ${index + 1}`}
                    className="w-full border-none bg-transparent px-0 py-0 text-sm font-medium shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
