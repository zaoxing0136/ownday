import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Clock3, Sparkles, Trash2 } from "lucide-react";
import HeaderActionLink from "@/components/HeaderActionLink";
import PilotBadge from "@/components/PilotBadge";
import { toast } from "@/hooks/use-toast";
import { parseFutureQuickInput } from "@/lib/futureInputParser";
import {
  appendSupportTask,
  createDraftItem,
  createFutureItem,
  getActiveRoles,
  getMonthKey,
  insertIntoWeeklyBattles,
  useDailyEntry,
  useDraftBox,
  useFutureSchedule,
  useRoles,
  useWeeklyFocus,
  type FuturePriority,
} from "@/lib/store";

const PRIORITY_META: Record<FuturePriority, { label: string; tone: string }> = {
  low: { label: "低优先级", tone: "bg-secondary text-secondary-foreground" },
  medium: { label: "中优先级", tone: "bg-primary/10 text-primary" },
  high: { label: "高优先级", tone: "bg-destructive/10 text-destructive" },
};

export default function FutureSchedule() {
  const [items, setItems] = useFutureSchedule();
  const [, setEntry] = useDailyEntry();
  const [weekly, setWeekly] = useWeeklyFocus();
  const [, setDrafts] = useDraftBox();
  const [roles] = useRoles();
  const activeRoles = getActiveRoles(roles);

  const [quickInput, setQuickInput] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<FuturePriority>("medium");
  const [roleId, setRoleId] = useState("");

  const parsedInput = useMemo(() => parseFutureQuickInput(quickInput), [quickInput]);

  useEffect(() => {
    setTitle(parsedInput.title);
    setDate(parsedInput.date);
    setTime(parsedInput.time);
  }, [parsedInput.date, parsedInput.time, parsedInput.title]);

  const addFutureItem = () => {
    if (!title.trim() || !date) return;

    setItems((prev) => [
      createFutureItem({
        title,
        notes,
        date,
        time,
        rawInput: quickInput,
        priority,
        relatedRoleId: roleId || undefined,
      }),
      ...prev,
    ]);

    setQuickInput("");
    setTitle("");
    setNotes("");
    setDate("");
    setTime("");
    setPriority("medium");
    setRoleId("");
    toast({ title: "已保存到未来安排", description: "这条未来事项已经进入列表。" });
  };

  const removeItem = (id: string, silent = false) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (!silent) {
      toast({ title: "已删除", description: "这条未来事项已移出列表。" });
    }
  };

  const moveToToday = (id: string) => {
    const item = items.find((future) => future.id === id);
    if (!item) return;

    const scheduledTitle = item.time ? `${item.time} ${item.title}` : item.title;
    const taskTitle = item.notes ? `${scheduledTitle}｜${item.notes}` : scheduledTitle;
    setEntry((prev) => appendSupportTask(prev, taskTitle));
    removeItem(id, true);
    toast({ title: "已拉入今天", description: "这条未来事项已经进入今日支撑任务。" });
  };

  const moveToWeek = (id: string) => {
    const item = items.find((future) => future.id === id);
    if (!item) return;

    const scheduleText = [item.date, item.time].filter(Boolean).join(" ");

    let inserted = false;
    setWeekly((prev) => {
      const result = insertIntoWeeklyBattles(prev, {
        title: item.title,
        why: item.notes || `来自未来安排：${scheduleText || item.date}`,
      });
      inserted = result.inserted;
      return result.nextWeekly;
    });

    if (!inserted) {
      setDrafts((prev) => [
        createDraftItem({
          title: item.title,
          notes: item.notes || `原计划时间：${scheduleText || item.date}`,
          status: "pending",
          source: "future->week",
          relatedRoleId: item.relatedRoleId,
          relatedWeek: weekly.weekStart,
          relatedMonth: getMonthKey(),
        }),
        ...prev,
      ]);
      toast({ title: "已转入本周待处理", description: "本周战役已满，先放进待处理池。" });
    } else {
      toast({ title: "已拉入本周", description: "这条未来事项已经进入本周主线。" });
    }

    removeItem(id, true);
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if ((a.time || "") !== (b.time || "")) return (a.time || "99:99").localeCompare(b.time || "99:99");
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  const hasQuickInput = quickInput.trim().length > 0;
  const timePreview = parsedInput.time
    ? parsedInput.time
    : parsedInput.timeHint
      ? `${parsedInput.timeHint}（未给具体时分）`
      : hasQuickInput
        ? "未识别，可留空"
        : "等你输入后自动解析";

  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <div className="mb-6 flex items-start justify-between gap-3 fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">未来安排</h1>
            <p className="text-sm text-muted-foreground">不是日历，只是把带日期的未来事项先放好。</p>
            <div className="mt-2">
              <PilotBadge />
            </div>
          </div>
          <HeaderActionLink />
        </div>

        <section className="mb-6 fade-in">
          <div className="rounded-2xl border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">自然语言快速录入</h2>
            </div>
            <div className="space-y-2">
              <textarea
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="例如：明天下午两点给金老师发合作方案"
                className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
              />
              <p className="text-xs leading-5 text-muted-foreground">
                可以直接打一整句话，也可以直接用系统语音输入法说一句。
              </p>
              <div className="rounded-xl bg-secondary/50 p-3">
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">日期</span>
                    <span className="text-right font-medium text-foreground">
                      {date || (hasQuickInput ? "未识别，可手动补" : "等你输入后自动解析")}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">时间</span>
                    <span className="text-right font-medium text-foreground">{timePreview}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">事项</span>
                    <span className="text-right font-medium text-foreground">
                      {title || (hasQuickInput ? "未识别，请手动补正文" : "等你输入后自动解析")}
                    </span>
                  </div>
                </div>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="补充说明（可选）"
                className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="事项正文"
                  className="rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as FuturePriority)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="low">低优先级</option>
                  <option value="medium">中优先级</option>
                  <option value="high">高优先级</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="">关联角色（可选）</option>
                  {activeRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addFutureItem}
                  disabled={!title.trim() || !date}
                  className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground sm:w-auto"
                >
                  保存到未来安排
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3 fade-in">
          {sortedItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card/60 p-6 text-center">
              <CalendarRange className="mx-auto h-6 w-6 text-muted-foreground/60" />
              <p className="mt-2 text-sm text-muted-foreground">想到有日期的事，就先放这里，别让它蒸发。</p>
            </div>
          ) : (
            sortedItems.map((item) => {
              const relatedRole = roles.find((role) => role.id === item.relatedRoleId);
              return (
                <div key={item.id} className="rounded-2xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      {item.notes && (
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.notes}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">
                          {item.date}
                        </span>
                        {item.time && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
                            {item.time}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_META[item.priority].tone}`}
                        >
                          {PRIORITY_META[item.priority].label}
                        </span>
                        {relatedRole && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                            {relatedRole.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded-full p-2 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => moveToToday(item.id)}
                      className="rounded-lg border px-3 py-2 text-xs font-medium text-foreground"
                    >
                      拉入今天
                    </button>
                    <button
                      onClick={() => moveToWeek(item.id)}
                      className="flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                    >
                      <Clock3 className="h-3.5 w-3.5" />
                      拉入本周
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
