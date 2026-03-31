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
      toast({ title: "已转为战焦", description: "这条内容已经进入本周关键战。" });
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
    todo: "未开始",
    doing: "进行中",
    done: "已完成",
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
                  主线总览
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                  先看月轴，再定义本周真正要打的仗，让方向感比忙碌感更强。
                </p>
              </div>
              <HeaderActionLink />
            </div>

            <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2">
              <PilotBadge />
              <span className="glass-chip">月轴 {filledAxes}/3</span>
              <span className="glass-chip">已对齐 {mappedBattles}/3</span>
            </div>

            <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.6rem] border border-white/60 bg-white/62 p-4 shadow-[inset_0_1px_0_hsl(0_0%_100%_/_0.82),0_20px_38px_-30px_hsl(192_22%_18%_/_0.35)] backdrop-blur-xl">
                <p className="soft-kicker">Strategy Map</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {monthly.axes.map((axis, index) => (
                    <span key={index} className="glass-chip">
                      月轴 {index + 1} · {axis.trim() || "待定义"}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  让周目标明确服务于月轴，减少“做了很多，却没真正推进”的感觉。
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-white/60 bg-white/58 p-4 shadow-[inset_0_1px_0_hsl(0_0%_100%_/_0.82),0_20px_38px_-30px_hsl(192_22%_18%_/_0.35)] backdrop-blur-xl">
                <span className="glass-chip">Week Signal</span>
                <p className="mt-4 text-base font-semibold text-foreground">
                  {weekly.theme.trim() || "先写下本周唯一主题"}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {weekly.notToDo.length > 0
                    ? `本周不做 ${weekly.notToDo.length} 件事，把边界一起写清楚。`
                    : "边界感会让注意力更干净，给本周留一个不做清单。"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {!focusReady && (
          <section className="mb-6 fade-in">
            <div className="rounded-[1.7rem] border border-dashed border-border/90 bg-white/48 p-5 text-sm leading-7 text-muted-foreground backdrop-blur-xl">
              主线还没搭起来。先写下 3 条月轴，再把本周唯一主题收紧，最后把三场关键战焦放进去。
            </div>
          </section>
        )}

        <section className="mb-6 fade-in">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="soft-kicker">Monthly Axes</p>
              <h2 className="mt-2 text-xl text-foreground">本月三大推进轴</h2>
            </div>
            <span className="section-subtle">月主线</span>
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
                      placeholder={`定义月轴 ${index + 1}`}
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
            <h2 className="mt-2 text-xl text-foreground">本周唯一主题</h2>
          </div>

          <div className="surface-card p-4">
            <input
              type="text"
              value={weekly.theme}
              onChange={(event) => updateWeekly({ theme: event.target.value })}
              placeholder="这周到底在打什么仗？"
              className="input-surface w-full rounded-[1.4rem] px-4 py-4 text-base font-semibold"
            />
            <p className="relative z-10 mt-3 text-sm leading-6 text-muted-foreground">
              主题越窄，这周越容易进入持续推进，而不是被很多小事分散掉。
            </p>
          </div>
        </section>

        <section className="mb-6 fade-in">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="soft-kicker">Weekly Battles</p>
              <h2 className="mt-2 text-xl text-foreground">本周三场关键战</h2>
            </div>
            <span className="section-subtle">周主线</span>
          </div>

          <div className="space-y-3">
            {weekly.battles.map((battle, index) => (
              <div key={index} className="surface-card p-4">
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3">
                    <span className="glass-chip">战焦 {index + 1}</span>
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
                    placeholder="战焦名称"
                    className="mt-4 w-full border-none bg-transparent p-0 text-base font-semibold shadow-none outline-none placeholder:text-muted-foreground/30 focus-visible:shadow-none"
                  />
                  <input
                    type="text"
                    value={battle.why}
                    onChange={(event) => updateBattle(index, { why: event.target.value })}
                    placeholder="为什么重要？"
                    className="mt-2 w-full border-none bg-transparent p-0 text-sm text-muted-foreground shadow-none outline-none placeholder:text-muted-foreground/30 focus-visible:shadow-none"
                  />

                  <div className="mt-4 rounded-[1.25rem] border border-white/60 bg-white/58 p-3 backdrop-blur-xl">
                    <label className="text-xs uppercase tracking-[0.16em] text-primary/60">
                      对应月轴
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
                      <option value="">暂不指定</option>
                      {monthly.axes.map((axis, axisIndex) => (
                        <option key={axisIndex} value={axisIndex} disabled={!axis.trim()}>
                          月轴 {axisIndex + 1} · {axis.trim() || "待定义"}
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
              <h2 className="mt-2 text-xl text-foreground">本周待升级</h2>
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
                      升级为战焦
                      <ArrowUpRight className="h-3.5 w-3.5" />
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
            <h2 className="mt-2 text-xl text-foreground">本周不做清单</h2>
          </div>

          <div className="space-y-2">
            {weekly.notToDo.map((item, index) => (
              <div key={index} className="surface-card px-4 py-3">
                <div className="relative z-10 flex items-center gap-3">
                  <span className="glass-chip border-destructive/20 bg-destructive/8 text-destructive">
                    不做
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
              placeholder="这周明确不做什么？"
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
