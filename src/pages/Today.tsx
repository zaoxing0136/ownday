import { useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowUpRight, Check, Plus, Trash2 } from "lucide-react";
import HeaderActionLink from "@/components/HeaderActionLink";
import PilotBadge from "@/components/PilotBadge";
import { toast } from "@/hooks/use-toast";
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
import { cn } from "@/lib/utils";

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

export default function Today() {
  const [entry, setEntry] = useDailyEntry();
  const [, setDrafts] = useDraftBox();
  const [weekly] = useWeeklyFocus();
  const [roles] = useRoles();
  const activeRoles = getActiveRoles(roles);
  const [supportInput, setSupportInput] = useState("");
  const [ideaInput, setIdeaInput] = useState("");

  const dateLabel = format(new Date(), "M月d日 EEEE", { locale: zhCN });

  const update = (patch: Partial<typeof entry>) => {
    setEntry((prev) => ({ ...prev, ...patch }));
  };

  const addSupportTask = () => {
    const title = supportInput.trim();
    if (!title) return;

    const task: SupportTask = {
      id: Date.now().toString(36),
      title,
      done: false,
    };

    update({ supportTasks: [...entry.supportTasks, task] });
    setSupportInput("");
    toast({ title: "已加入今天", description: "支撑任务已经记下。" });
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
    toast({ title: "已删除", description: "这条支撑任务已移除。" });
  };

  const setKeyResultStatus = (id: string, status: TaskStatus) => {
    update({
      keyResults: entry.keyResults.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    });
  };

  const addIdeaItem = () => {
    const text = ideaInput.trim();
    if (!text) return;

    update({
      ideaItems: [createIdeaItem(text), ...entry.ideaItems],
    });
    setIdeaInput("");
    toast({ title: "已记下", description: "临时想法已经放进今天。" });
  };

  const updateIdeaItem = (id: string, text: string) => {
    update({
      ideaItems: entry.ideaItems.map((item) => (item.id === id ? { ...item, text } : item)),
    });
  };

  const removeIdeaItem = (id: string, silent = false) => {
    update({
      ideaItems: entry.ideaItems.filter((item) => item.id !== id),
    });
    if (!silent) {
      toast({ title: "已删除", description: "这条临时想法已移除。" });
    }
  };

  const moveIdeaToDraft = (id: string) => {
    const idea = entry.ideaItems.find((item) => item.id === id);
    if (!idea?.text.trim()) return;

    const lines = idea.text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const title = lines[0] || idea.text.trim();
    const notes = lines.slice(1).join(" / ");

    setDrafts((prev) => [
      createDraftItem({
        title,
        notes,
        status: "draft",
        source: `today-idea:${entry.date}:${idea.id}`,
        relatedRoleId: entry.mainRole || undefined,
        relatedMonth: getMonthKey(),
      }),
      ...prev,
    ]);

    removeIdeaItem(id, true);
    toast({ title: "已转入草稿", description: "这条想法已经挪到草稿箱。" });
  };

  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <header className="page-header fade-in">
          <div>
            <p className="page-caption mt-0 text-foreground">{dateLabel}</p>
            <h1 className="page-title mt-2">今天</h1>
            <div className="page-badges">
              <PilotBadge />
              {weekly.theme.trim() && (
                <span className="glass-chip border-primary/20 bg-primary/8 text-primary">
                  本周：{weekly.theme}
                </span>
              )}
            </div>
          </div>
          <HeaderActionLink />
        </header>

        <section className="section-block fade-in">
          <div className="hero-panel px-4 py-4 sm:px-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="soft-kicker">唯一最重要</p>
                <h2 className="mt-2 text-[1.6rem] font-semibold leading-tight text-foreground">
                  神圣任务
                </h2>
              </div>
              <button
                onClick={() =>
                  update({
                    sacredTask: { ...entry.sacredTask, done: !entry.sacredTask.done },
                  })
                }
                className={cn(
                  "icon-button-soft shrink-0",
                  entry.sacredTask.done &&
                    "border-success bg-success text-success-foreground shadow-none"
                )}
              >
                {entry.sacredTask.done && <Check className="h-4 w-4" />}
              </button>
            </div>

            <input
              type="text"
              value={entry.sacredTask.title}
              onChange={(event) =>
                update({
                  sacredTask: { ...entry.sacredTask, title: event.target.value },
                })
              }
              placeholder="今天唯一最重要的一件事"
              className={cn(
                "w-full border-none bg-transparent px-0 py-0 text-[1.4rem] font-semibold leading-snug shadow-none outline-none placeholder:text-muted-foreground/40 focus-visible:shadow-none",
                entry.sacredTask.done && "task-done"
              )}
            />

            <div className="mt-5 divider-dash" />

            <div className="mt-4 grid gap-5 sm:grid-cols-[0.95fr_1.05fr]">
              <div>
                <div className="section-bar mb-2 after:hidden">
                  <h3 className="section-title text-sm">今日能量</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(ENERGY_CONFIG) as EnergyState[]).map((key) => {
                    const selected = entry.energyState === key;

                    return (
                      <button
                        key={key}
                        onClick={() => update({ energyState: key })}
                        className={cn(
                          "rounded-full border px-3 py-2 text-sm font-medium transition-all",
                          selected
                            ? "border-primary bg-primary text-primary-foreground shadow-[0_10px_18px_-14px_hsl(var(--primary)/0.35)]"
                            : "bg-white/72 text-foreground"
                        )}
                      >
                        {ENERGY_CONFIG[key].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="section-bar mb-2 after:hidden">
                  <h3 className="section-title text-sm">今日主角色</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeRoles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() =>
                        update({
                          mainRole: role.id,
                          sacredTask: { ...entry.sacredTask, role: role.id },
                        })
                      }
                      className={cn(
                        "rounded-full border px-3 py-2 text-xs font-medium transition-all",
                        entry.mainRole === role.id
                          ? "border-primary bg-primary text-primary-foreground shadow-[0_10px_18px_-14px_hsl(var(--primary)/0.35)]"
                          : "bg-white/72 text-foreground"
                      )}
                    >
                      {role.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block fade-in">
          <div className="section-bar">
            <h2 className="section-title">三个关键成果</h2>
          </div>
          <div className="space-y-2">
            {entry.keyResults.map((item, index) => (
              <div key={item.id} className="stack-card">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setKeyResultStatus(item.id, NEXT_STATUS[item.status])}
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
                      item.status === "done"
                        ? "bg-success/15 text-success"
                        : item.status === "doing"
                          ? "bg-primary/12 text-primary"
                          : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {STATUS_LABELS[item.status]}
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
                      "w-full border-none bg-transparent px-0 py-0 text-sm shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none",
                      item.status === "done" && "task-done"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section-block fade-in">
          <div className="section-bar">
            <h2 className="section-title">支撑任务</h2>
          </div>

          <div className="surface-card mb-3 px-3 py-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={supportInput}
                onChange={(event) => setSupportInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && addSupportTask()}
                placeholder="加一条今天会做的动作"
                className="min-w-0 flex-1 border-none bg-transparent px-0 py-0 text-sm shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
              />
              <button
                onClick={addSupportTask}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_14px_20px_-16px_hsl(var(--primary)/0.35)]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {entry.supportTasks.map((task) => (
              <div key={task.id} className="stack-card">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSupportTask(task.id)}
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all",
                      task.done
                        ? "border-success bg-success text-success-foreground"
                        : "border-border bg-white"
                    )}
                  >
                    {task.done && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <span className={cn("flex-1 text-sm text-foreground", task.done && "task-done")}>
                    {task.title}
                  </span>
                  <button
                    onClick={() => removeSupportTask(task.id)}
                    className="text-muted-foreground/70 transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="fade-in">
          <div className="section-bar">
            <h2 className="section-title">临时想法</h2>
          </div>

          <div className="surface-card mb-3 px-3 py-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ideaInput}
                onChange={(event) => setIdeaInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && addIdeaItem()}
                placeholder="记一条"
                className="min-w-0 flex-1 border-none bg-transparent px-0 py-0 text-sm shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
              />
              <button
                onClick={addIdeaItem}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_14px_20px_-16px_hsl(var(--primary)/0.35)]"
              >
                新增
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {entry.ideaItems.map((item) => (
              <div key={item.id} className="stack-card">
                <textarea
                  value={item.text}
                  onChange={(event) => updateIdeaItem(item.id, event.target.value)}
                  placeholder="这条想法写在这里"
                  className="min-h-[88px] w-full resize-none border-none bg-transparent px-0 py-0 text-sm leading-6 shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    onClick={() => moveIdeaToDraft(item.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                  >
                    转草稿
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeIdeaItem(item.id)}
                    className="text-xs text-muted-foreground/75 transition-colors hover:text-destructive"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
