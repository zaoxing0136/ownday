import { useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Check, ChevronRight, Plus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeaderActionLink from "@/components/HeaderActionLink";
import PilotBadge from "@/components/PilotBadge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  createDraftItem,
  createIdeaItem,
  getActiveRoles,
  getMonthKey,
  useDailyEntry,
  useDraftBox,
  useWeeklyFocus,
  useRoles,
  ENERGY_CONFIG,
  type EnergyState,
  type TaskStatus,
  type SupportTask,
} from "@/lib/store";

export default function Today() {
  const [entry, setEntry] = useDailyEntry();
  const [, setDrafts] = useDraftBox();
  const [weekly] = useWeeklyFocus();
  const [roles] = useRoles();
  const navigate = useNavigate();
  const [quickInput, setQuickInput] = useState("");
  const [ideaInput, setIdeaInput] = useState("");
  const activeRoles = getActiveRoles(roles);
  const energyToneClasses: Record<
    EnergyState,
    { selected: string; text: string }
  > = {
    high: {
      selected:
        "border-energy-high/40 bg-energy-high/12 shadow-[0_20px_40px_-28px_hsl(var(--energy-high)/0.7)]",
      text: "text-energy-high",
    },
    medium: {
      selected:
        "border-energy-medium/40 bg-energy-medium/12 shadow-[0_20px_40px_-28px_hsl(var(--energy-medium)/0.7)]",
      text: "text-energy-medium",
    },
    low: {
      selected:
        "border-energy-low/40 bg-energy-low/12 shadow-[0_20px_40px_-28px_hsl(var(--energy-low)/0.7)]",
      text: "text-energy-low",
    },
    chaos: {
      selected:
        "border-energy-chaos/40 bg-energy-chaos/12 shadow-[0_20px_40px_-28px_hsl(var(--energy-chaos)/0.7)]",
      text: "text-energy-chaos",
    },
  };

  const today = new Date();
  const dateStr = format(today, "M月d日 EEEE", { locale: zhCN });

  const sacredDone = entry.sacredTask.done ? 1 : 0;
  const krDone = entry.keyResults.filter((item) => item.status === "done").length;
  const stDone = entry.supportTasks.filter((task) => task.done).length;
  const stTotal = entry.supportTasks.length;
  const totalItems = 1 + 3 + stTotal;
  const doneItems = sacredDone + krDone + stDone;
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const selectedRole = activeRoles.find((role) => role.id === entry.mainRole);
  const activeBattleCount = weekly.battles.filter((battle) => battle.name.trim()).length;

  const update = (patch: Partial<typeof entry>) => setEntry((prev) => ({ ...prev, ...patch }));

  const addSupportTask = (title: string) => {
    if (!title.trim()) return;
    const task: SupportTask = { id: Date.now().toString(36), title: title.trim(), done: false };
    update({ supportTasks: [...entry.supportTasks, task] });
  };

  const toggleSupportTask = (id: string) => {
    update({
      supportTasks: entry.supportTasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      ),
    });
  };

  const removeSupportTask = (id: string) => {
    update({ supportTasks: entry.supportTasks.filter((task) => task.id !== id) });
  };

  const setKRStatus = (id: string, status: TaskStatus) => {
    update({
      keyResults: entry.keyResults.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    });
  };

  const handleQuickAdd = () => {
    if (!quickInput.trim()) return;
    addSupportTask(quickInput);
    toast({ title: "已加入支撑任务", description: "今天的承接动作已经记下来了。" });
    setQuickInput("");
  };

  const addIdeaItem = () => {
    const text = ideaInput.trim();
    if (!text) return;

    setEntry((prev) => ({
      ...prev,
      ideaItems: [createIdeaItem(text), ...prev.ideaItems],
    }));
    toast({ title: "想法已记录", description: "先放进系统里，晚点再决定是否升级。" });
    setIdeaInput("");
  };

  const updateIdeaItem = (id: string, text: string) => {
    setEntry((prev) => ({
      ...prev,
      ideaItems: prev.ideaItems.map((item) => (item.id === id ? { ...item, text } : item)),
    }));
  };

  const removeIdeaItem = (id: string, silent = false) => {
    setEntry((prev) => ({
      ...prev,
      ideaItems: prev.ideaItems.filter((item) => item.id !== id),
    }));
    if (!silent) {
      toast({ title: "想法已删除", description: "这条临时念头已经从列表移除。" });
    }
  };

  const moveIdeaToDraft = (id: string) => {
    const currentItem = entry.ideaItems.find((item) => item.id === id);
    if (!currentItem?.text.trim()) return;

    const lines = currentItem.text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const title = lines[0] || currentItem.text.trim();
    const notes = lines.slice(1).join(" / ");

    setDrafts((prev) => [
      createDraftItem({
        title,
        notes,
        status: "draft",
        source: `today-idea:${entry.date}:${currentItem.id}`,
        relatedRoleId: entry.mainRole || undefined,
        relatedMonth: getMonthKey(),
      }),
      ...prev,
    ]);

    removeIdeaItem(id, true);
    toast({ title: "已转入草稿箱", description: "这条想法已经从今天页挪走，随时可再加工。" });
  };

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
                <p className="soft-kicker">Own The Day</p>
                <h1 className="mt-2 text-3xl leading-tight text-foreground sm:text-[2.35rem]">
                  {dateStr}
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                  {weekly.theme
                    ? `本周主线：${weekly.theme}`
                    : "把今天收得更窄一点，先守住一件真正重要的事。"}
                </p>
              </div>
              <HeaderActionLink />
            </div>

            <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2">
              <PilotBadge />
              {selectedRole && <span className="glass-chip">{selectedRole.name}</span>}
              {activeBattleCount > 0 && (
                <span className="glass-chip">本周战焦 {activeBattleCount}/3</span>
              )}
            </div>

            <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-[1.2fr_0.85fr]">
              <div className="rounded-[1.6rem] border border-white/60 bg-white/62 p-4 shadow-[inset_0_1px_0_hsl(0_0%_100%_/_0.82),0_20px_38px_-30px_hsl(192_22%_18%_/_0.35)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="soft-kicker">Flow Pulse</p>
                    <p className="mt-2 text-3xl font-semibold text-foreground">{progress}%</p>
                  </div>
                  <span className="glass-chip text-[11px]">{doneItems}/{totalItems} 已推进</span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/65">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(28_82%_62%))] shadow-[0_10px_24px_-12px_hsl(var(--primary)/0.8)] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {entry.sacredTask.done
                    ? "核心任务已经点亮，继续顺势把今天收得更完整。"
                    : "先把最重要的一件事做出来，今天的节奏就会安静下来。"}
                </p>
              </div>

              <button
                onClick={() => navigate("/review")}
                className="card-press rounded-[1.6rem] border border-white/60 bg-white/58 p-4 text-left shadow-[inset_0_1px_0_hsl(0_0%_100%_/_0.82),0_20px_38px_-30px_hsl(192_22%_18%_/_0.35)] backdrop-blur-xl"
              >
                <span className="glass-chip">Night Reset</span>
                <div className="mt-6 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">晚间复盘</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      收口今天，顺手给明天预热。
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>
            </div>
          </div>
        </section>

        <section className="mb-6 fade-in">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="soft-kicker">Focus Beam</p>
              <h2 className="mt-2 text-xl text-foreground">神圣任务</h2>
            </div>
            <span
              className={cn(
                "glass-chip",
                entry.sacredTask.done && "border-success/25 bg-success/10 text-success"
              )}
            >
              {entry.sacredTask.done ? "已点亮" : "待推进"}
            </span>
          </div>

          <div className="surface-card border-sacred-border/70 bg-sacred-bg/75 p-5">
            <div className="relative z-10 flex items-start gap-4">
              <button
                onClick={() =>
                  update({ sacredTask: { ...entry.sacredTask, done: !entry.sacredTask.done } })
                }
                className={cn(
                  "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  entry.sacredTask.done
                    ? "border-success bg-success check-bounce shadow-[0_18px_30px_-18px_hsl(var(--success)/0.8)]"
                    : "border-sacred/60 bg-white/70"
                )}
              >
                {entry.sacredTask.done && (
                  <Check className="h-4 w-4 text-success-foreground" />
                )}
              </button>

              <div className="flex-1">
                <input
                  type="text"
                  value={entry.sacredTask.title}
                  onChange={(event) =>
                    update({ sacredTask: { ...entry.sacredTask, title: event.target.value } })
                  }
                  placeholder="今天最重要的一件事..."
                  className={cn(
                    "w-full border-none bg-transparent p-0 text-[1.1rem] font-semibold shadow-none outline-none placeholder:text-muted-foreground/40 focus-visible:shadow-none",
                    entry.sacredTask.done && "task-done"
                  )}
                />

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  用一句足够清楚的话写下来，让今天所有动作都围绕它服务。
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.sacredTask.role && (
                    <span className="glass-chip">
                      {roles.find((role) => role.id === entry.sacredTask.role)?.name}
                    </span>
                  )}
                  {entry.sacredTask.linkedBattle && (
                    <span className="glass-chip border-primary/20 bg-primary/10 text-primary">
                      {entry.sacredTask.linkedBattle}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <select
                    value={entry.sacredTask.role}
                    onChange={(event) =>
                      update({ sacredTask: { ...entry.sacredTask, role: event.target.value } })
                    }
                    className="input-surface rounded-2xl px-3 py-2.5 text-sm"
                  >
                    <option value="">关联角色</option>
                    {activeRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={entry.sacredTask.linkedBattle}
                    onChange={(event) =>
                      update({
                        sacredTask: { ...entry.sacredTask, linkedBattle: event.target.value },
                      })
                    }
                    className="input-surface rounded-2xl px-3 py-2.5 text-sm"
                  >
                    <option value="">关联周战焦</option>
                    {weekly.battles
                      .filter((battle) => battle.name)
                      .map((battle, index) => (
                        <option key={index} value={battle.name}>
                          {battle.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="fade-in">
            <div className="mb-3">
              <p className="soft-kicker">Energy Window</p>
              <h2 className="mt-2 text-xl text-foreground">今日能量</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ENERGY_CONFIG) as EnergyState[]).map((key) => {
                const config = ENERGY_CONFIG[key];
                const selected = entry.energyState === key;
                const toneClasses = energyToneClasses[key];

                return (
                  <button
                    key={key}
                    onClick={() => update({ energyState: key })}
                    className={cn(
                      "card-press rounded-[1.4rem] border p-3 text-left",
                      selected
                        ? toneClasses.selected
                        : "border-white/60 bg-white/58 hover:border-white/80 hover:bg-white/70"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{config.icon}</span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          selected ? toneClasses.text : "text-foreground"
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {config.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="fade-in">
            <div className="mb-3">
              <p className="soft-kicker">Identity Lens</p>
              <h2 className="mt-2 text-xl text-foreground">今天主角色</h2>
            </div>
            <div className="surface-card p-4">
              <p className="relative z-10 text-sm leading-6 text-muted-foreground">
                先决定你今天最想成为什么样的人，再决定要做哪些事。
              </p>
              <div className="relative z-10 mt-4 flex flex-wrap gap-2">
                {activeRoles.map((role) => {
                  const selected = entry.mainRole === role.id;

                  return (
                    <button
                      key={role.id}
                      onClick={() => update({ mainRole: role.id })}
                      className={cn(
                        "card-press rounded-full px-3.5 py-2 text-xs font-medium tracking-[0.08em] transition-all",
                        selected
                          ? "bg-primary text-primary-foreground shadow-[0_18px_32px_-22px_hsl(var(--primary)/0.85)]"
                          : "bg-white/68 text-foreground shadow-[0_12px_24px_-22px_hsl(192_22%_18%_/_0.4)] hover:bg-white"
                      )}
                    >
                      {role.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        <section className="mb-6 fade-in">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="soft-kicker">Three Wins</p>
              <h2 className="mt-2 text-xl text-foreground">3 个关键成果</h2>
            </div>
            <span className="section-subtle">{krDone}/3 已完成</span>
          </div>

          <div className="space-y-3">
            {entry.keyResults.map((item, index) => (
              <div key={item.id} className="surface-card p-4">
                <div className="relative z-10 flex items-center gap-3">
                  <button
                    onClick={() => setKRStatus(item.id, nextStatus[item.status])}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      item.status === "done"
                        ? "bg-success/15 text-success"
                        : item.status === "doing"
                          ? "bg-primary/12 text-primary"
                          : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {statusLabels[item.status]}
                  </button>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(event) =>
                      update({
                        keyResults: entry.keyResults.map((candidate) =>
                          candidate.id === item.id
                            ? { ...candidate, title: event.target.value }
                            : candidate
                        ),
                      })
                    }
                    placeholder={`关键成果 ${index + 1}`}
                    className={cn(
                      "w-full border-none bg-transparent p-0 text-sm shadow-none outline-none placeholder:text-muted-foreground/30 focus-visible:shadow-none",
                      item.status === "done" && "task-done"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 fade-in">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="soft-kicker">Support Layer</p>
              <h2 className="mt-2 text-xl text-foreground">支撑任务</h2>
            </div>
            <span className="section-subtle">{stDone}/{stTotal} 已完成</span>
          </div>

          <div className="space-y-2">
            {entry.supportTasks.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-border/90 bg-white/48 px-4 py-5 text-center text-sm text-muted-foreground backdrop-blur-xl">
                还没有支撑任务。只加入今天真的会做的那几件。
              </div>
            ) : (
              entry.supportTasks.map((task) => (
                <div key={task.id} className="surface-card px-4 py-3">
                  <div className="relative z-10 flex items-center gap-3">
                    <button
                      onClick={() => toggleSupportTask(task.id)}
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all",
                        task.done
                          ? "border-success bg-success check-bounce shadow-[0_18px_30px_-18px_hsl(var(--success)/0.8)]"
                          : "border-border bg-white/70"
                      )}
                    >
                      {task.done && <Check className="h-3.5 w-3.5 text-success-foreground" />}
                    </button>
                    <span className={cn("flex-1 text-sm", task.done && "task-done")}>
                      {task.title}
                    </span>
                    <button
                      onClick={() => removeSupportTask(task.id)}
                      className="text-xs text-muted-foreground/60 transition-colors hover:text-destructive"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={quickInput}
              onChange={(event) => setQuickInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleQuickAdd()}
              placeholder="添加承接动作..."
              className="input-surface min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm"
            />
            <button
              onClick={handleQuickAdd}
              className="card-press flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_20px_36px_-24px_hsl(var(--primary)/0.9)]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="mb-6 fade-in">
          <div className="mb-3">
            <p className="soft-kicker">Idea Buffer</p>
            <div className="mt-2 flex items-center gap-2">
              <h2 className="text-xl text-foreground">临时想法 / 临时创意</h2>
              <Sparkles className="h-4 w-4 text-primary/70" />
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              想到就先放进来，不打断当前节奏，也不让它悄悄蒸发。
            </p>
          </div>

          <div className="surface-card p-4">
            <div className="relative z-10 flex items-center gap-2">
              <input
                type="text"
                value={ideaInput}
                onChange={(event) => setIdeaInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && addIdeaItem()}
                placeholder="记下一条临时想法..."
                className="input-surface min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm"
              />
              <button
                onClick={addIdeaItem}
                className="card-press rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-[0_20px_36px_-24px_hsl(var(--primary)/0.9)]"
              >
                新增
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {entry.ideaItems.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-border/90 bg-white/48 px-4 py-5 text-center text-sm text-muted-foreground backdrop-blur-xl">
                还没有临时想法。想到什么，先记一条，不必现在处理。
              </div>
            ) : (
              entry.ideaItems.map((item, index) => (
                <div key={item.id} className="surface-card p-4">
                  <div className="relative z-10">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="glass-chip text-[11px]">
                        想法 {entry.ideaItems.length - index}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => moveIdeaToDraft(item.id)}
                          className="text-xs font-medium text-primary transition-opacity hover:opacity-80"
                        >
                          转草稿
                        </button>
                        <button
                          onClick={() => removeIdeaItem(item.id)}
                          className="text-xs text-muted-foreground/60 transition-colors hover:text-destructive"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={item.text}
                      onChange={(event) => updateIdeaItem(item.id, event.target.value)}
                      placeholder="把细节也一起放进来..."
                      className="input-surface min-h-24 w-full resize-none rounded-[1.2rem] px-4 py-3 text-sm"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <button
          onClick={() => navigate("/review")}
          className="card-press mb-4 flex w-full items-center justify-between rounded-[1.6rem] border border-white/60 bg-white/64 p-4 text-left shadow-[0_24px_60px_-40px_hsl(192_22%_18%_/_0.4)] backdrop-blur-xl"
        >
          <div>
            <p className="soft-kicker">Close The Loop</p>
            <p className="mt-2 text-base font-semibold text-foreground">进入晚间复盘</p>
            <p className="mt-1 text-sm text-muted-foreground">把今天收圆，再让明天更轻一点。</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
