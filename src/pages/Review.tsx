import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Check } from "lucide-react";
import HeaderActionLink from "@/components/HeaderActionLink";
import PilotBadge from "@/components/PilotBadge";
import { toast } from "@/hooks/use-toast";
import {
  createDraftItem,
  getActiveRoles,
  getMonthKey,
  getWeekStartKey,
  useDailyEntry,
  useDraftBox,
  useRoles,
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
  const [entry, setEntry] = useDailyEntry();
  const [drafts, setDrafts] = useDraftBox();
  const [roles] = useRoles();
  const activeRoles = getActiveRoles(roles);
  const review = makeReview(entry.review);
  const dateLabel = format(new Date(), "M月d日 EEEE", { locale: zhCN });

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
