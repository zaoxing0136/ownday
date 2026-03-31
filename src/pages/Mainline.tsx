import { useState } from "react";
import { ArrowUpRight, Plus, X } from "lucide-react";
import HeaderActionLink from "@/components/HeaderActionLink";
import PilotBadge from "@/components/PilotBadge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useMonthlyFocus,
  useWeeklyFocus,
  useDraftBox,
  insertIntoWeeklyBattles,
  type TaskStatus,
} from "@/lib/store";

export default function Mainline() {
  const [monthly, setMonthly] = useMonthlyFocus();
  const [weekly, setWeekly] = useWeeklyFocus();
  const [drafts, setDrafts] = useDraftBox();
  const [notDoInput, setNotDoInput] = useState("");

  const updateMonthly = (patch: Partial<typeof monthly>) =>
    setMonthly((prev) => ({ ...prev, ...patch }));
  const updateWeekly = (patch: Partial<typeof weekly>) =>
    setWeekly((prev) => ({ ...prev, ...patch }));

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

  const addNotToDo = () => {
    if (!notDoInput.trim()) return;
    updateWeekly({ notToDo: [...weekly.notToDo, notDoInput.trim()] });
    setNotDoInput("");
  };

  const removeNotToDo = (index: number) => {
    updateWeekly({ notToDo: weekly.notToDo.filter((_, itemIndex) => itemIndex !== index) });
  };

  const promoteDraftToBattle = (draftId: string) => {
    const currentDraft = drafts.find((item) => item.id === draftId);
    if (!currentDraft) return;

    let inserted = false;
    setWeekly((prev) => {
      const result = insertIntoWeeklyBattles(prev, {
        title: currentDraft.title,
        why: currentDraft.notes,
      });
      inserted = result.inserted;
      return result.nextWeekly;
    });

    if (inserted) {
      setDrafts((prev) => prev.filter((item) => item.id !== draftId));
      toast({ title: "宸茶浆涓烘垬鐒?, description: "杩欐潯鍐呭宸茬粡杩涘叆鏈懆鍏抽敭鎴樸€? });
    }
  };

  const weekLinkedDrafts = drafts.filter((item) => item.relatedWeek === weekly.weekStart);
  const filledAxes = monthly.axes.filter((axis) => axis.trim()).length;
  const mappedBattles = weekly.battles.filter(
    (battle) =>
      battle.name.trim() &&
      typeof battle.axisIndex === "number" &&
      !!monthly.axes[battle.axisIndex]?.trim()
  ).length;
  const focusReady = filledAxes > 0 || weekly.theme.trim() || weekly.battles.some((battle) => battle.name.trim());

  const statusLabels: Record<TaskStatus, string> = {
    todo: "鏈紑濮?,
    doing: "杩涜涓?,
    done: "宸插畬鎴?,
  };

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    todo: "doing",
    doing: "done",
    done: "todo",
  };

  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <section className="mb-6 fade-in">
          <div className="hero-panel p-5 sm:p-6">
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div>
                <p className="soft-kicker">Focus Atlas</p>
                <h1 className="mt-2 text-3xl leading-tight text-foreground sm:text-[2.35rem]">
                  涓荤嚎鎬昏
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                  鍏堢湅鏈堣酱锛屽啀瀹氫箟鏈懆鐪熸瑕佹墦鐨勪粭锛岃鏂瑰悜鎰熸瘮蹇欑鎰熸洿寮恒€?                </p>
              </div>
              <HeaderActionLink />
            </div>

            <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2">
              <PilotBadge />
              <span className="glass-chip">鏈堣酱 {filledAxes}/3</span>
              <span className="glass-chip">宸插榻?{mappedBattles}/3</span>
            </div>

            <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.6rem] border border-white/60 bg-white/62 p-4 shadow-[inset_0_1px_0_hsl(0_0%_100%_/_0.82),0_20px_38px_-30px_hsl(192_22%_18%_/_0.35)] backdrop-blur-xl">
                <p className="soft-kicker">Strategy Map</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {monthly.axes.map((axis, index) => (
                    <span key={index} className="glass-chip">
                      鏈堣酱 {index + 1} 路 {axis.trim() || "寰呭畾涔?}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  璁╁懆鐩爣鏄庣‘鏈嶅姟浜庢湀杞达紝鍑忓皯鈥滃仛浜嗗緢澶氾紝鍗存病鐪熸鎺ㄨ繘鈥濈殑鎰熻銆?                </p>
              </div>

              <div className="rounded-[1.6rem] border border-white/60 bg-white/58 p-4 shadow-[inset_0_1px_0_hsl(0_0%_100%_/_0.82),0_20px_38px_-30px_hsl(192_22%_18%_/_0.35)] backdrop-blur-xl">
                <span className="glass-chip">Week Signal</span>
                <p className="mt-4 text-base font-semibold text-foreground">
                  {weekly.theme.trim() || "鍏堝啓涓嬫湰鍛ㄥ敮涓€涓婚"}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {weekly.notToDo.length > 0
                    ? `鏈懆涓嶅仛 ${weekly.notToDo.length} 浠朵簨锛屾妸杈圭晫涓€璧峰啓娓呮銆俙
                    : "杈圭晫鎰熶細璁╂敞鎰忓姏鏇村共鍑€锛岀粰鏈懆鐣欎竴涓笉鍋氭竻鍗曘€?}
                </p>
              </div>
            </div>
          </div>
        </section>

        {!focusReady && (
          <section className="mb-6 fade-in">
            <div className="rounded-[1.7rem] border border-dashed border-border/90 bg-white/48 p-5 text-sm leading-7 text-muted-foreground backdrop-blur-xl">
              涓荤嚎杩樻病鎼捣鏉ャ€傚厛鍐欎笅 3 鏉℃湀杞达紝鍐嶆妸鏈懆鍞竴涓婚鏀剁揣锛屾渶鍚庢妸涓夊満鍏抽敭鎴樼劍鏀捐繘鍘汇€?            </div>
          </section>
        )}

        <section className="mb-6 fade-in">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="soft-kicker">Monthly Axes</p>
              <h2 className="mt-2 text-xl text-foreground">鏈湀涓夊ぇ鎺ㄨ繘杞?/h2>
            </div>
            <span className="section-subtle">鏈堜富绾?/span>
          </div>

          <div className="space-y-3">
            {monthly.axes.map((axis, index) => (
              <div key={index} className="surface-card p-4">
                <div className="relative z-10 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary/60">Axis {index + 1}</p>
                    <input
                      type="text"
                      value={axis}
                      onChange={(event) => updateAxis(index, event.target.value)}
                      placeholder={`瀹氫箟鏈堣酱 ${index + 1}`}
                      className="w-full border-none bg-transparent px-0 pb-0 pt-1 text-base font-medium shadow-none outline-none placeholder:text-muted-foreground/30 focus-visible:shadow-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 fade-in">
          <div className="mb-3">
            <p className="soft-kicker">Weekly Theme</p>
            <h2 className="mt-2 text-xl text-foreground">鏈懆鍞竴涓婚</h2>
          </div>

          <div className="surface-card p-4">
            <input
              type="text"
              value={weekly.theme}
              onChange={(event) => updateWeekly({ theme: event.target.value })}
              placeholder="杩欏懆鍒板簳鍦ㄦ墦浠€涔堜粭锛?
              className="input-surface w-full rounded-[1.4rem] px-4 py-4 text-base font-semibold"
            />
            <p className="relative z-10 mt-3 text-sm leading-6 text-muted-foreground">
              涓婚瓒婄獎锛岃繖鍛ㄨ秺瀹规槗杩涘叆鎸佺画鎺ㄨ繘锛岃€屼笉鏄寰堝灏忎簨鍒嗘暎鎺夈€?            </p>
          </div>
        </section>

        <section className="mb-6 fade-in">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="soft-kicker">Weekly Battles</p>
              <h2 className="mt-2 text-xl text-foreground">鏈懆涓夊満鍏抽敭鎴?/h2>
            </div>
            <span className="section-subtle">鍛ㄤ富绾?/span>
          </div>

          <div className="space-y-3">
            {weekly.battles.map((battle, index) => (
              <div key={index} className="surface-card p-4">
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3">
                    <span className="glass-chip">鎴樼劍 {index + 1}</span>
                    <button
                      onClick={() => updateBattle(index, { status: nextStatus[battle.status] })}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        battle.status === "done"
                          ? "bg-success/15 text-success"
                          : battle.status === "doing"
                            ? "bg-primary/12 text-primary"
                            : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {statusLabels[battle.status]}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={battle.name}
                    onChange={(event) => updateBattle(index, { name: event.target.value })}
                    placeholder="鎴樼劍鍚嶇О"
                    className="mt-4 w-full border-none bg-transparent p-0 text-base font-semibold shadow-none outline-none placeholder:text-muted-foreground/30 focus-visible:shadow-none"
                  />
                  <input
                    type="text"
                    value={battle.why}
                    onChange={(event) => updateBattle(index, { why: event.target.value })}
                    placeholder="涓轰粈涔堥噸瑕侊紵"
                    className="mt-2 w-full border-none bg-transparent p-0 text-sm text-muted-foreground shadow-none outline-none placeholder:text-muted-foreground/30 focus-visible:shadow-none"
                  />

                  <div className="mt-4 rounded-[1.25rem] border border-white/60 bg-white/58 p-3 backdrop-blur-xl">
                    <label className="text-xs uppercase tracking-[0.16em] text-primary/60">
                      瀵瑰簲鏈堣酱
                    </label>
                    <select
                      value={typeof battle.axisIndex === "number" ? battle.axisIndex : ""}
                      onChange={(event) =>
                        updateBattle(index, {
                          axisIndex: event.target.value === "" ? null : Number(event.target.value),
                        })
                      }
                      className="input-surface mt-2 w-full rounded-xl px-3 py-2.5 text-sm"
                    >
                      <option value="">鏆備笉鎸囧畾</option>
                      {monthly.axes.map((axis, axisIndex) => (
                        <option key={axisIndex} value={axisIndex} disabled={!axis.trim()}>
                          鏈堣酱 {axisIndex + 1} 路 {axis.trim() || "寰呭畾涔?}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {weekLinkedDrafts.length > 0 && (
          <section className="mb-6 fade-in">
            <div className="mb-3">
              <p className="soft-kicker">Upgrade Queue</p>
              <h2 className="mt-2 text-xl text-foreground">鏈懆寰呭崌绾?/h2>
            </div>

            <div className="space-y-3">
              {weekLinkedDrafts.map((item) => (
                <div key={item.id} className="surface-card p-4">
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-foreground">{item.title}</p>
                      {item.notes && (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => promoteDraftToBattle(item.id)}
                      className="card-press inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-[0_20px_36px_-24px_hsl(var(--primary)/0.9)]"
                    >
                      鍗囩骇涓烘垬鐒?                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-6 fade-in">
          <div className="mb-3">
            <p className="soft-kicker">Boundaries</p>
            <h2 className="mt-2 text-xl text-foreground">鏈懆涓嶅仛娓呭崟</h2>
          </div>

          <div className="space-y-2">
            {weekly.notToDo.map((item, index) => (
              <div key={index} className="surface-card px-4 py-3">
                <div className="relative z-10 flex items-center gap-3">
                  <span className="glass-chip border-destructive/20 bg-destructive/8 text-destructive">
                    涓嶅仛
                  </span>
                  <span className="flex-1 text-sm">{item}</span>
                  <button
                    onClick={() => removeNotToDo(index)}
                    className="text-muted-foreground/60 transition-colors hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={notDoInput}
              onChange={(event) => setNotDoInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && addNotToDo()}
              placeholder="杩欏懆鏄庣‘涓嶅仛浠€涔堬紵"
              className="input-surface min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm"
            />
            <button
              onClick={addNotToDo}
              className="card-press flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_20px_36px_-24px_hsl(var(--primary)/0.9)]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
