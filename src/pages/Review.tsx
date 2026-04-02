import { useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import HeaderActionLink from "@/components/HeaderActionLink";
import PilotBadge from "@/components/PilotBadge";
import { toast } from "@/hooks/use-toast";
import {
  createDraftItem,
  getActiveRoles,
  getMonthKey,
  getSavedMonthKeys,
  getSavedDailyDates,
  getSavedWeekStarts,
  getWeekStartKey,
  useDailyEntry,
  useDraftBox,
  useMonthlyFocus,
  useRoles,
  useWeeklyFocus,
  type DailyReview,
  type DraftStatus,
} from "@/lib/store";
import { cn } from "@/lib/utils";

function makeReview(review?: DailyReview): DailyReview {
  return {
    sacredDone: review?.sacredDone ?? false,
    failReason: review?.failReason ?? "",
    bestProgress: review?.bestProgress ?? "",
    stuckPoint: review?.stuckPoint ?? "",
    mood: review?.mood ?? "",
    loopingThought: review?.loopingThought ?? "",
    tomorrowRole: review?.tomorrowRole ?? "",
    tomorrowSacred: review?.tomorrowSacred ?? "",
    completed: review?.completed ?? false,
    drifted: review?.drifted ?? "no",
    energyAccurate: review?.energyAccurate ?? "accurate",
  };
}

export default function Review() {
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [entry, setEntry] = useDailyEntry(selectedDate);
  const [drafts, setDrafts] = useDraftBox();
  const [roles] = useRoles();
  const selectedWeekStart = format(
    startOfWeek(new Date(`${selectedDate}T12:00:00`), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );
  const selectedMonthKey = format(new Date(`${selectedDate}T12:00:00`), "yyyy-MM");
  const [weekly] = useWeeklyFocus(selectedWeekStart);
  const [monthly] = useMonthlyFocus(selectedMonthKey);
  const activeRoles = getActiveRoles(roles);
  const review = makeReview(entry.review);
  const dateLabel = format(new Date(`${selectedDate}T12:00:00`), "M月d日 EEEE", { locale: zhCN });
  const recentDates = Array.from(new Set([todayKey, selectedDate, ...getSavedDailyDates()]))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 6);
  const recentWeeks = Array.from(new Set([selectedWeekStart, getWeekStartKey(), ...getSavedWeekStarts()]))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 4);
  const recentMonths = Array.from(new Set([selectedMonthKey, getMonthKey(), ...getSavedMonthKeys()]))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 4);
  const selectedRole = roles.find((role) => role.id === entry.mainRole);

  const updateReview = (patch: Partial<DailyReview>) => {
    setEntry((prev) => ({ ...prev, review: { ...review, ...patch } }));
  };

  const unresolvedItems = [
    ...(!review.sacredDone && entry.sacredTask.title.trim()
      ? [
          {
            id: "sacred",
            title: entry.sacredTask.title,
            notes: review.failReason,
            relatedRoleId: entry.sacredTask.role || entry.mainRole || undefined,
            source: `review:${entry.date}:sacred`,
          },
        ]
      : []),
    ...entry.keyResults
      .filter((item) => item.title.trim() && item.status !== "done")
      .map((item) => ({
        id: item.id,
        title: item.title,
        notes: item.status === "doing" ? "今天已经开始了" : "",
        relatedRoleId: item.role || entry.mainRole || undefined,
        source: `review:${entry.date}:kr:${item.id}`,
      })),
    ...entry.supportTasks
      .filter((item) => item.title.trim() && !item.done)
      .map((item) => ({
        id: item.id,
        title: item.title,
        notes: "",
        relatedRoleId: entry.mainRole || undefined,
        source: `review:${entry.date}:support:${item.id}`,
      })),
  ];

  const moveToDraftBox = (
    item: (typeof unresolvedItems)[number],
    status: DraftStatus
  ) => {
    const exists = drafts.some((draft) => draft.source === item.source && draft.status === status);
    if (exists) return;

    setDrafts((prev) => [
      createDraftItem({
        title: item.title,
        notes: item.notes,
        source: item.source,
        status,
        relatedRoleId: item.relatedRoleId,
        relatedWeek: status === "pending" ? getWeekStartKey() : undefined,
        relatedMonth: getMonthKey(),
      }),
      ...prev,
    ]);

    toast({
      title: status === "pending" ? "已放进待处理" : "已放进草稿",
      description: "这条没做完的事已经收口。",
    });
  };

  const jumpDay = (offset: number) => {
    const next = format(addDays(new Date(`${selectedDate}T12:00:00`), offset), "yyyy-MM-dd");
    setSelectedDate(next);
  };

  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <header className="page-header fade-in">
          <div>
            <p className="page-caption mt-0 text-foreground">{dateLabel}</p>
            <h1 className="page-title mt-2">复盘</h1>
            <div className="page-badges">
              <PilotBadge />
            </div>
          </div>
          <HeaderActionLink />
        </header>

        <section className="section-block fade-in">
          <div className="hero-panel overflow-hidden px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="soft-kicker">回看入口</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">往回看这一天</h2>
              </div>
              <div className="glass-chip border-primary/15 bg-primary/6 text-primary">
                <CalendarDays className="h-3.5 w-3.5" />
                历史只放这里
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-border/55 bg-white/72 p-3 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.4)]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => jumpDay(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-white text-foreground transition-all hover:-translate-y-0.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    if (event.target.value) setSelectedDate(event.target.value);
                  }}
                  className="min-w-0 flex-1 rounded-full border border-border/60 bg-white/90 px-4 py-2.5 text-sm text-foreground outline-none"
                />
                <button
                  onClick={() => jumpDay(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-white text-foreground transition-all hover:-translate-y-0.5"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {recentDates.map((date) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[11px] font-medium transition-all",
                      selectedDate === date
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/80 text-secondary-foreground"
                    )}
                  >
                    {format(new Date(`${date}T12:00:00`), "M/d")}
                  </button>
                ))}
                {selectedDate !== todayKey && (
                  <button
                    onClick={() => setSelectedDate(todayKey)}
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-primary"
                  >
                    回今天
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[22px] border border-border/55 bg-white/68 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      那天在打什么
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {entry.sacredTask.title.trim() || "这天还没写神圣任务"}
                    </p>
                  </div>
                  {entry.energyState && (
                    <span className="glass-chip shrink-0">{entry.energyState}</span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedRole && <span className="glass-chip">{selectedRole.name}</span>}
                  <span className="glass-chip">{entry.keyResults.filter((item) => item.title.trim()).length} 条关键成果</span>
                  <span className="glass-chip">{entry.supportTasks.filter((item) => item.title.trim()).length} 条支撑任务</span>
                </div>
              </div>

              <div className="rounded-[22px] border border-border/55 bg-gradient-to-br from-primary/10 via-white/72 to-amber-50/70 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Compass className="h-4 w-4" />
                  <p className="text-xs font-medium uppercase tracking-[0.18em]">那段主线</p>
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {weekly.theme.trim() || "那周还没写周主题"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recentWeeks.map((week) => (
                    <span key={week} className="glass-chip text-[11px]">
                      周 {format(new Date(`${week}T12:00:00`), "M/d")}
                    </span>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  {monthly.axes.map((axis, index) => (
                    <div key={`${selectedMonthKey}-${index}`} className="rounded-2xl bg-white/72 px-3 py-2 text-sm text-foreground">
                      <span className="mr-2 text-xs text-muted-foreground">{index + 1}</span>
                      {axis.trim() || "这条主线还没写"}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recentMonths.map((month) => (
                    <span key={month} className="glass-chip text-[11px]">
                      {month}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block fade-in">
          <div className="section-bar">
            <h2 className="section-title">最重要的那件事</h2>
          </div>
          <div className="hero-panel px-4 py-4">
            <p className="text-sm font-semibold text-foreground">
              {entry.sacredTask.title.trim() || "今天还没写神圣任务"}
            </p>
            <div className="mt-3 flex gap-2">
              {[
                { value: true, label: "完成" },
                { value: false, label: "没完成" },
              ].map((option) => (
                <button
                  key={String(option.value)}
                  onClick={() => updateReview({ sacredDone: option.value })}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                    review.sacredDone === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={review.failReason}
              onChange={(event) => updateReview({ failReason: event.target.value })}
              placeholder="结果 / 原因"
              className="mt-3 w-full border-none bg-transparent px-0 py-0 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
            />
          </div>
        </section>

        <section className="section-block grid gap-4 fade-in">
          <div>
            <div className="section-bar">
              <h2 className="section-title">今天最值得记的一件推进</h2>
            </div>
            <div className="stack-card">
              <input
                type="text"
                value={review.bestProgress}
                onChange={(event) => updateReview({ bestProgress: event.target.value })}
                placeholder="记一条"
                className="w-full border-none bg-transparent px-0 py-0 text-sm shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
              />
            </div>
          </div>

          <div>
            <div className="section-bar">
              <h2 className="section-title">今天最卡的一件事</h2>
            </div>
            <div className="stack-card">
              <input
                type="text"
                value={review.stuckPoint}
                onChange={(event) => updateReview({ stuckPoint: event.target.value })}
                placeholder="卡点"
                className="w-full border-none bg-transparent px-0 py-0 text-sm shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
              />
            </div>
          </div>

          <div>
            <div className="section-bar">
              <h2 className="section-title">今天的情绪 / 状态</h2>
            </div>
            <div className="stack-card">
              <input
                type="text"
                value={review.mood}
                onChange={(event) => updateReview({ mood: event.target.value })}
                placeholder="比如：稳、烦、累、顺"
                className="w-full border-none bg-transparent px-0 py-0 text-sm shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
              />
            </div>
          </div>

          <div>
            <div className="section-bar">
              <h2 className="section-title">脑子里反复出现的念头</h2>
            </div>
            <div className="stack-card">
              <textarea
                value={review.loopingThought}
                onChange={(event) => updateReview({ loopingThought: event.target.value })}
                placeholder="写下来"
                className="min-h-24 w-full resize-none border-none bg-transparent px-0 py-0 text-sm leading-6 shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
              />
            </div>
          </div>
        </section>

        <section className="section-block fade-in">
          <div className="section-bar">
            <h2 className="section-title">明天先抓什么</h2>
          </div>
          <div className="surface-card px-4 py-4">
            <input
              type="text"
              value={review.tomorrowSacred}
              onChange={(event) => updateReview({ tomorrowSacred: event.target.value })}
              placeholder="明天最先抓的一件事"
              className="w-full border-none bg-transparent px-0 py-0 text-sm font-medium shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {activeRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => updateReview({ tomorrowRole: role.id })}
                  className={cn(
                    "rounded-full border px-3 py-2 text-xs font-medium transition-all",
                    review.tomorrowRole === role.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-white text-foreground"
                  )}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {unresolvedItems.length > 0 && (
          <section className="section-block fade-in">
            <div className="section-bar">
              <h2 className="section-title">没做完的，放哪</h2>
            </div>
            <div className="space-y-2">
              {unresolvedItems.map((item) => {
                const movedToPending = drafts.some(
                  (draft) => draft.source === item.source && draft.status === "pending"
                );
                const movedToDraft = drafts.some(
                  (draft) => draft.source === item.source && draft.status === "draft"
                );

                return (
                  <div key={item.source} className="stack-card">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {item.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => moveToDraftBox(item, "pending")}
                        disabled={movedToPending}
                        className="rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {movedToPending ? "已放待处理" : "放待处理"}
                      </button>
                      <button
                        onClick={() => moveToDraftBox(item, "draft")}
                        disabled={movedToDraft}
                        className="rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {movedToDraft ? "已放草稿" : "放草稿"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <button
          onClick={() => updateReview({ completed: true })}
          className={cn(
            "w-full rounded-full px-4 py-3 text-sm font-semibold transition-all",
            review.completed
              ? "bg-success text-success-foreground"
              : "bg-primary text-primary-foreground"
          )}
        >
          {review.completed ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              今天已经收口
            </span>
          ) : (
            "收口今天"
          )}
        </button>
      </div>
    </div>
  );
}
