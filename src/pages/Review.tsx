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

const FAIL_REASONS = [
  { value: "too_big", label: "目标定得太大" },
  { value: "interrupted", label: "被突发事件打断" },
  { value: "avoided", label: "自己在回避" },
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
  const [drafts, setDrafts] = useDraftBox();
  const [roles] = useRoles();
  const activeRoles = getActiveRoles(roles);
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
    setEntry((prev) => ({ ...prev, review: { ...review, ...patch } }));
  };

  const unresolvedItems = [
    ...(!review.sacredDone && entry.sacredTask.title
      ? [
          {
            id: "sacred",
            title: entry.sacredTask.title,
            notes: review.failReason ? `未完成原因：${review.failReason}` : "",
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
        notes: item.status === "doing" ? "今天已开始，尚未完成" : "",
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
      title: status === "pending" ? "已转入待处理" : "已转入草稿",
      description: "这条未完成项已经被安全收口。",
    });
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
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`card-press rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <div className="mb-6 flex items-start justify-between gap-3 fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">晚间复盘</h1>
            <p className="text-sm text-muted-foreground">{dateStr} · 先收口，再下班。</p>
            <div className="mt-2">
              <PilotBadge />
            </div>
          </div>
          <HeaderActionLink />
        </div>

        <section className="mb-6 fade-in">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">神圣任务完成了吗？</h2>
          {entry.sacredTask.title ? (
            <div className="mb-3 rounded-xl border-2 border-sacred-border bg-sacred-bg p-4">
              <p className="text-sm font-semibold">{entry.sacredTask.title}</p>
            </div>
          ) : (
            <p className="mb-3 text-sm text-muted-foreground">今天没有设定神圣任务</p>
          )}
          <RadioGroup
            options={[
              { value: "true", label: "已完成" },
              { value: "false", label: "没完成" },
            ]}
            value={String(review.sacredDone)}
            onChange={(value) => updateReview({ sacredDone: value === "true" })}
          />
        </section>

        {!review.sacredDone && (
          <section className="mb-6 fade-in">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">未完成原因</h2>
            <RadioGroup
              options={FAIL_REASONS}
              value={review.failReason}
              onChange={(value) => updateReview({ failReason: value })}
            />
          </section>
        )}

        <section className="mb-6 fade-in">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">今天有没有掉出主线？</h2>
          <RadioGroup
            options={DRIFT_OPTIONS}
            value={review.drifted}
            onChange={(value) => updateReview({ drifted: value as DailyReview["drifted"] })}
          />
        </section>

        <section className="mb-6 fade-in">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">今天能量判断准不准？</h2>
          <RadioGroup
            options={ENERGY_ACCURACY}
            value={review.energyAccurate}
            onChange={(value) =>
              updateReview({ energyAccurate: value as DailyReview["energyAccurate"] })
            }
          />
        </section>

        <section className="mb-6 fade-in">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">今天最值得记录的一件推进</h2>
          <input
            type="text"
            value={review.bestProgress}
            onChange={(e) => updateReview({ bestProgress: e.target.value })}
            placeholder="一句话记录..."
            className="w-full rounded-xl border bg-card p-3 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
          />
        </section>

        <section className="mb-6 fade-in">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">明天预设</h2>
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div>
              <label className="text-xs text-muted-foreground">明天的主角色</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {activeRoles.map((role) => (
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

        {unresolvedItems.length > 0 ? (
          <section className="mb-6 fade-in">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">今日未完成收口</h2>
            <div className="space-y-2">
              {unresolvedItems.map((item) => {
                const movedToPending = drafts.some(
                  (draft) => draft.source === item.source && draft.status === "pending"
                );
                const movedToDraft = drafts.some(
                  (draft) => draft.source === item.source && draft.status === "draft"
                );

                return (
                  <div key={item.source} className="rounded-xl border bg-card p-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    {item.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => moveToDraftBox(item, "pending")}
                        disabled={movedToPending}
                        className="rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {movedToPending ? "已转入待处理" : "转入待处理"}
                      </button>
                      <button
                        onClick={() => moveToDraftBox(item, "draft")}
                        disabled={movedToDraft}
                        className="rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {movedToDraft ? "已转入草稿" : "转入草稿"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="mb-6 fade-in">
            <div className="rounded-2xl border border-dashed bg-card/60 p-4 text-center">
              <p className="text-sm font-medium">今天没有需要收口的尾巴。</p>
              <p className="mt-1 text-sm text-muted-foreground">留一句最佳进展，再设一下明天就够了。</p>
            </div>
          </section>
        )}

        <button
          onClick={() => updateReview({ completed: true })}
          className={`card-press w-full rounded-xl p-4 text-sm font-semibold transition-all ${
            review.completed
              ? "bg-success text-success-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {review.completed ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              复盘已完成
            </span>
          ) : (
            "完成今日复盘"
          )}
        </button>
      </div>
    </div>
  );
}
