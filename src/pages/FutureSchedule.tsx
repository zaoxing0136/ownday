import { useEffect, useMemo, useState } from "react";
import { Clock3, Trash2 } from "lucide-react";
import HeaderActionLink from "@/components/HeaderActionLink";
import PilotBadge from "@/components/PilotBadge";
import { toast } from "@/hooks/use-toast";
import { parseFutureQuickInput } from "@/lib/futureInputParser";
import {
  appendSupportTask,
  createDraftItem,
  createFutureItem,
  getMonthKey,
  insertIntoWeeklyBattles,
  useDailyEntry,
  useDraftBox,
  useFutureSchedule,
  useWeeklyFocus,
  type FuturePriority,
} from "@/lib/store";

const PRIORITY_META: Record<FuturePriority, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

export default function FutureSchedule() {
  const [items, setItems] = useFutureSchedule();
  const [, setEntry] = useDailyEntry();
  const [weekly, setWeekly] = useWeeklyFocus();
  const [, setDrafts] = useDraftBox();

  const [quickInput, setQuickInput] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<FuturePriority>("medium");
  const [showFallback, setShowFallback] = useState(false);

  const parsed = useMemo(() => parseFutureQuickInput(quickInput), [quickInput]);

  useEffect(() => {
    setTitle(parsed.title);
    setDate(parsed.date);
    setTime(parsed.time);
  }, [parsed.date, parsed.time, parsed.title]);

  const hasInput = quickInput.trim().length > 0;
  const missingCritical = hasInput && (!title.trim() || !date);
  const showManual = showFallback || missingCritical;

  const saveFutureItem = () => {
    if (!title.trim() || !date) {
      toast({ title: "还没法保存", description: "至少补上日期和事项。" });
      return;
    }

    setItems((prev) => [
      createFutureItem({
        title,
        date,
        time,
        rawInput: quickInput,
        priority,
      }),
      ...prev,
    ]);

    setQuickInput("");
    setTitle("");
    setDate("");
    setTime("");
    setPriority("medium");
    setShowFallback(false);
    toast({ title: "已记下", description: "这件未来的事已经放好了。" });
  };

  const removeItem = (id: string, silent = false) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (!silent) {
      toast({ title: "已删除", description: "这条未来安排已移除。" });
    }
  };

  const moveToToday = (id: string) => {
    const item = items.find((future) => future.id === id);
    if (!item) return;

    const titleForToday = item.time ? `${item.time} ${item.title}` : item.title;
    setEntry((prev) => appendSupportTask(prev, titleForToday));
    removeItem(id, true);
    toast({ title: "已转入今天", description: "它已经进入今天的支撑任务。" });
  };

  const moveToWeek = (id: string) => {
    const item = items.find((future) => future.id === id);
    if (!item) return;

    let inserted = false;
    setWeekly((prev) => {
      const result = insertIntoWeeklyBattles(prev, {
        title: item.title,
      });
      inserted = result.inserted;
      return result.nextWeekly;
    });

    if (!inserted) {
      const scheduleText = [item.date, item.time].filter(Boolean).join(" ");
      setDrafts((prev) => [
        createDraftItem({
          title: item.title,
          notes: scheduleText ? `原计划：${scheduleText}` : "",
          status: "pending",
          source: "future->week",
          relatedWeek: weekly.weekStart,
          relatedMonth: getMonthKey(),
        }),
        ...prev,
      ]);
      toast({ title: "已转入待处理", description: "本周三件事已满，先放到池子里。" });
    } else {
      toast({ title: "已转入本周", description: "它已经进入本周三件关键事。" });
    }

    removeItem(id, true);
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.time || "99:99").localeCompare(b.time || "99:99");
  });

  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <header className="page-header fade-in">
          <div>
            <p className="page-caption mt-0">一句话先记下，剩下的交给它拆。</p>
            <h1 className="page-title mt-2">未来</h1>
            <div className="page-badges">
              <PilotBadge />
            </div>
          </div>
          <HeaderActionLink />
        </header>

        <section className="section-block fade-in">
          <div className="hero-panel px-4 py-4 sm:px-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="soft-kicker">快速录入</p>
              <span className="glass-chip text-muted-foreground">一句话录入</span>
            </div>
            <textarea
              value={quickInput}
              onChange={(event) => setQuickInput(event.target.value)}
              placeholder="例如：明天下午两点给金老师发合作方案"
              className="min-h-28 w-full resize-none border-none bg-transparent px-0 py-0 text-[15px] leading-7 shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
            />

            {hasInput && (
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="glass-chip">{date || "日期未识别"}</span>
                <span className="glass-chip">{time || parsed.timeHint || "时间可留空"}</span>
                <span className="glass-chip max-w-full truncate">
                  {title || "事项未识别"}
                </span>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowFallback((prev) => !prev)}
                className="text-button"
              >
                {showManual ? "收起补充" : "手动补充"}
              </button>

              <button
                onClick={saveFutureItem}
                className="rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_14px_20px_-16px_hsl(var(--primary)/0.35)]"
              >
                保存
              </button>
            </div>

            {showManual && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="事项"
                  className="input-surface rounded-xl px-3 py-2.5 text-sm"
                />
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="input-surface rounded-xl px-3 py-2.5 text-sm"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="input-surface rounded-xl px-3 py-2.5 text-sm"
                />
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as FuturePriority)}
                  className="input-surface rounded-xl px-3 py-2.5 text-sm"
                >
                  <option value="low">低优先级</option>
                  <option value="medium">中优先级</option>
                  <option value="high">高优先级</option>
                </select>
              </div>
            )}
          </div>
        </section>

        <section className="fade-in">
          <div className="section-bar">
            <h2 className="section-title">已记下的未来事项</h2>
          </div>
          <div className="space-y-2">
          {sortedItems.length === 0 ? (
            <div className="stack-card border-dashed bg-white/55 text-sm text-muted-foreground">
              还没有未来事项。
            </div>
          ) : (
            sortedItems.map((item) => (
              <div key={item.id} className="stack-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="glass-chip">{item.date}</span>
                      {item.time && <span className="glass-chip">{item.time}</span>}
                      <span className="glass-chip">优先级 {PRIORITY_META[item.priority]}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground/70 transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => moveToToday(item.id)}
                    className="subtle-button"
                  >
                    拉入今天
                  </button>
                  <button
                    onClick={() => moveToWeek(item.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-[0_14px_20px_-16px_hsl(var(--primary)/0.35)]"
                  >
                    <Clock3 className="h-3.5 w-3.5" />
                    拉入本周
                  </button>
                </div>
              </div>
            ))
          )}
          </div>
        </section>
      </div>
    </div>
  );
}
