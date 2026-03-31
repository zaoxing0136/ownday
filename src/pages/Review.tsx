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
  { value: "too_big", label: "鐩爣瀹氬緱澶ぇ" },
  { value: "interrupted", label: "琚獊鍙戜簨浠舵墦鏂? },
  { value: "avoided", label: "鑷繁鍦ㄥ洖閬? },
  { value: "dependency", label: "渚濊禆鍒汉鏈畬鎴? },
];

const DRIFT_OPTIONS = [
  { value: "no" as const, label: "娌℃湁" },
  { value: "slight" as const, label: "鏈変竴鐐? },
  { value: "major" as const, label: "鏄庢樉鍋忎簡" },
];

const ENERGY_ACCURACY = [
  { value: "accurate" as const, label: "寰堝噯" },
  { value: "ok" as const, label: "涓€鑸? },
  { value: "wrong" as const, label: "涓嶅噯" },
];

export default function Review() {
  const [entry, setEntry] = useDailyEntry();
  const [drafts, setDrafts] = useDraftBox();
  const [roles] = useRoles();
  const activeRoles = getActiveRoles(roles);
  const dateStr = format(new Date(), "M鏈坉鏃?EEEE", { locale: zhCN });

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
            notes: review.failReason ? `鏈畬鎴愬師鍥狅細${review.failReason}` : "",
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
        notes: item.status === "doing" ? "浠婂ぉ宸插紑濮嬶紝灏氭湭瀹屾垚" : "",
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
      title: status === "pending" ? "宸茶浆鍏ュ緟澶勭悊" : "宸茶浆鍏ヨ崏绋?,
      description: "杩欐潯鏈畬鎴愰」宸茬粡琚畨鍏ㄦ敹鍙ｃ€?,
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
            <h1 className="text-2xl font-bold tracking-tight">鏅氶棿澶嶇洏</h1>
            <p className="text-sm text-muted-foreground">{dateStr} 路 鍏堟敹鍙ｏ紝鍐嶄笅鐝€?/p>
            <div className="mt-2">
              <PilotBadge />
            </div>
          </div>
          <HeaderActionLink />
        </div>

        <section className="mb-6 fade-in">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">绁炲湥浠诲姟瀹屾垚浜嗗悧锛?/h2>
          {entry.sacredTask.title ? (
            <div className="mb-3 rounded-xl border-2 border-sacred-border bg-sacred-bg p-4">
              <p className="text-sm font-semibold">{entry.sacredTask.title}</p>
            </div>
          ) : (
            <p className="mb-3 text-sm text-muted-foreground">浠婂ぉ娌℃湁璁惧畾绁炲湥浠诲姟</p>
          )}
          <RadioGroup
            options={[
              { value: "true", label: "宸插畬鎴? },
              { value: "false", label: "娌″畬鎴? },
            ]}
            value={String(review.sacredDone)}
            onChange={(value) => updateReview({ sacredDone: value === "true" })}
          />
        </section>

        {!review.sacredDone && (
          <section className="mb-6 fade-in">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">鏈畬鎴愬師鍥?/h2>
            <RadioGroup
              options={FAIL_REASONS}
              value={review.failReason}
              onChange={(value) => updateReview({ failReason: value })}
            />
          </section>
        )}

        <section className="mb-6 fade-in">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">浠婂ぉ鏈夋病鏈夋帀鍑轰富绾匡紵</h2>
          <RadioGroup
            options={DRIFT_OPTIONS}
            value={review.drifted}
            onChange={(value) => updateReview({ drifted: value as DailyReview["drifted"] })}
          />
        </section>

        <section className="mb-6 fade-in">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">浠婂ぉ鑳介噺鍒ゆ柇鍑嗕笉鍑嗭紵</h2>
          <RadioGroup
            options={ENERGY_ACCURACY}
            value={review.energyAccurate}
            onChange={(value) =>
              updateReview({ energyAccurate: value as DailyReview["energyAccurate"] })
            }
          />
        </section>

        <section className="mb-6 fade-in">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">浠婂ぉ鏈€鍊煎緱璁板綍鐨勪竴浠舵帹杩?/h2>
          <input
            type="text"
            value={review.bestProgress}
            onChange={(e) => updateReview({ bestProgress: e.target.value })}
            placeholder="涓€鍙ヨ瘽璁板綍..."
            className="w-full rounded-xl border bg-card p-3 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
          />
        </section>

        <section className="mb-6 fade-in">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">鏄庡ぉ棰勮</h2>
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div>
              <label className="text-xs text-muted-foreground">鏄庡ぉ鐨勪富瑙掕壊</label>
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
              <label className="text-xs text-muted-foreground">鏄庡ぉ鐨勭鍦ｄ换鍔?/label>
              <input
                type="text"
                value={review.tomorrowSacred}
                onChange={(e) => updateReview({ tomorrowSacred: e.target.value })}
                placeholder="鏄庡ぉ鏈€閲嶈鐨勪竴浠朵簨..."
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
        </section>

        {unresolvedItems.length > 0 ? (
          <section className="mb-6 fade-in">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">浠婃棩鏈畬鎴愭敹鍙?/h2>
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
                        {movedToPending ? "宸茶浆鍏ュ緟澶勭悊" : "杞叆寰呭鐞?}
                      </button>
                      <button
                        onClick={() => moveToDraftBox(item, "draft")}
                        disabled={movedToDraft}
                        className="rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {movedToDraft ? "宸茶浆鍏ヨ崏绋? : "杞叆鑽夌"}
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
              <p className="text-sm font-medium">浠婂ぉ娌℃湁闇€瑕佹敹鍙ｇ殑灏惧反銆?/p>
              <p className="mt-1 text-sm text-muted-foreground">鐣欎竴鍙ユ渶浣宠繘灞曪紝鍐嶈涓€涓嬫槑澶╁氨澶熶簡銆?/p>
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
              澶嶇洏宸插畬鎴?            </span>
          ) : (
            "瀹屾垚浠婃棩澶嶇洏"
          )}
        </button>
      </div>
    </div>
  );
}
