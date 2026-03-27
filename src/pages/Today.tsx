import { useState, useRef } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Check, Plus, Mic, MicOff, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useDailyEntry,
  useWeeklyFocus,
  ENERGY_CONFIG,
  DEFAULT_ROLES,
  type EnergyState,
  type TaskStatus,
  type SupportTask,
} from "@/lib/store";

export default function Today() {
  const [entry, setEntry] = useDailyEntry();
  const [weekly] = useWeeklyFocus();
  const navigate = useNavigate();
  const [quickInput, setQuickInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const today = new Date();
  const dateStr = format(today, "M月d日 EEEE", { locale: zhCN });

  // Completion calc
  const sacredDone = entry.sacredTask.done ? 1 : 0;
  const krDone = entry.keyResults.filter((k) => k.status === "done").length;
  const stDone = entry.supportTasks.filter((s) => s.done).length;
  const stTotal = entry.supportTasks.length;
  const totalItems = 1 + 3 + stTotal;
  const doneItems = sacredDone + krDone + stDone;
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const update = (patch: Partial<typeof entry>) => setEntry((p) => ({ ...p, ...patch }));

  const addSupportTask = (title: string) => {
    if (!title.trim()) return;
    const task: SupportTask = { id: Date.now().toString(36), title: title.trim(), done: false };
    update({ supportTasks: [...entry.supportTasks, task] });
  };

  const toggleSupportTask = (id: string) => {
    update({
      supportTasks: entry.supportTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    });
  };

  const removeSupportTask = (id: string) => {
    update({ supportTasks: entry.supportTasks.filter((t) => t.id !== id) });
  };

  const setKRStatus = (id: string, status: TaskStatus) => {
    update({
      keyResults: entry.keyResults.map((k) => (k.id === id ? { ...k, status } : k)),
    });
  };

  const handleQuickAdd = () => {
    if (!quickInput.trim()) return;
    addSupportTask(quickInput);
    setQuickInput("");
  };

  // Voice input
  const hasSpeech = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setQuickInput((prev) => prev + text);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const statusLabels: Record<TaskStatus, string> = { todo: "未开始", doing: "进行中", done: "已完成" };
  const nextStatus: Record<TaskStatus, TaskStatus> = { todo: "doing", doing: "done", done: "todo" };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-6">
        {/* Header */}
        <div className="mb-6 fade-in">
          <h1 className="text-2xl font-bold tracking-tight">{dateStr}</h1>
          {weekly.theme && (
            <p className="mt-1 text-sm text-muted-foreground">
              本周主线：{weekly.theme}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6 fade-in">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>今日完成度</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Energy Selector */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">今日能量</h2>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ENERGY_CONFIG) as EnergyState[]).map((key) => {
              const cfg = ENERGY_CONFIG[key];
              const selected = entry.energyState === key;
              return (
                <button
                  key={key}
                  onClick={() => update({ energyState: key })}
                  className={`card-press rounded-lg border p-3 text-left transition-all ${
                    selected
                      ? `border-energy-${key} bg-energy-${key}/10 ring-1 ring-energy-${key}/30`
                      : "border-border bg-card hover:border-muted-foreground/20"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{cfg.icon}</span>
                    <span className={`text-sm font-medium ${selected ? `text-energy-${key}` : ""}`}>{cfg.label}</span>
                  </div>
                  {selected && <p className="mt-1 text-xs text-muted-foreground">{cfg.desc}</p>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Role Selector */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">今日主角色</h2>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_ROLES.map((role) => {
              const selected = entry.mainRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => update({ mainRole: role.id })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all card-press ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {role.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Sacred Task */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">🎯 神圣任务</h2>
          <div className="rounded-xl border-2 border-sacred-border bg-sacred-bg p-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() =>
                  update({ sacredTask: { ...entry.sacredTask, done: !entry.sacredTask.done } })
                }
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  entry.sacredTask.done
                    ? "border-success bg-success check-bounce"
                    : "border-sacred"
                }`}
              >
                {entry.sacredTask.done && <Check className="h-3.5 w-3.5 text-success-foreground" />}
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={entry.sacredTask.title}
                  onChange={(e) =>
                    update({ sacredTask: { ...entry.sacredTask, title: e.target.value } })
                  }
                  placeholder="今天最重要的一件事..."
                  className={`w-full bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground/40 ${
                    entry.sacredTask.done ? "task-done" : ""
                  }`}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entry.sacredTask.role && (
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                      {DEFAULT_ROLES.find((r) => r.id === entry.sacredTask.role)?.name}
                    </span>
                  )}
                  {entry.sacredTask.linkedBattle && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {entry.sacredTask.linkedBattle}
                    </span>
                  )}
                </div>
                {/* Quick role & battle link */}
                <div className="mt-2 flex gap-2">
                  <select
                    value={entry.sacredTask.role}
                    onChange={(e) =>
                      update({ sacredTask: { ...entry.sacredTask, role: e.target.value } })
                    }
                    className="rounded-md border bg-card px-2 py-1 text-xs"
                  >
                    <option value="">关联角色</option>
                    {DEFAULT_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <select
                    value={entry.sacredTask.linkedBattle}
                    onChange={(e) =>
                      update({ sacredTask: { ...entry.sacredTask, linkedBattle: e.target.value } })
                    }
                    className="rounded-md border bg-card px-2 py-1 text-xs"
                  >
                    <option value="">关联周战役</option>
                    {weekly.battles.filter((b) => b.name).map((b, i) => (
                      <option key={i} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Results */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">📌 3 个关键成果</h2>
          <div className="space-y-2">
            {entry.keyResults.map((kr, i) => (
              <div key={kr.id} className="flex items-center gap-2 rounded-lg border bg-card p-3">
                <button
                  onClick={() => setKRStatus(kr.id, nextStatus[kr.status])}
                  className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                    kr.status === "done"
                      ? "bg-success/15 text-success"
                      : kr.status === "doing"
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {statusLabels[kr.status]}
                </button>
                <input
                  type="text"
                  value={kr.title}
                  onChange={(e) =>
                    update({
                      keyResults: entry.keyResults.map((k) =>
                        k.id === kr.id ? { ...k, title: e.target.value } : k
                      ),
                    })
                  }
                  placeholder={`关键成果 ${i + 1}`}
                  className={`flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/30 ${
                    kr.status === "done" ? "task-done" : ""
                  }`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Support Tasks */}
        <section className="mb-6 fade-in">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-muted-foreground">📋 支撑任务</h2>
            <span className="text-xs text-muted-foreground">
              {stDone}/{stTotal}
            </span>
          </div>
          <div className="space-y-1.5">
            {entry.supportTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2 rounded-lg bg-card border px-3 py-2">
                <button
                  onClick={() => toggleSupportTask(task.id)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                    task.done ? "border-success bg-success check-bounce" : "border-border"
                  }`}
                >
                  {task.done && <Check className="h-3 w-3 text-success-foreground" />}
                </button>
                <span className={`flex-1 text-sm ${task.done ? "task-done" : ""}`}>{task.title}</span>
                <button
                  onClick={() => removeSupportTask(task.id)}
                  className="text-muted-foreground/40 hover:text-destructive text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {/* Inline add */}
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              placeholder="添加任务..."
              className="flex-1 rounded-lg border bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
            />
            {hasSpeech && (
              <button onClick={toggleVoice} className="rounded-lg border bg-card p-2 text-muted-foreground">
                {isListening ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={handleQuickAdd}
              className="rounded-lg bg-primary p-2 text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Go to Review */}
        <button
          onClick={() => navigate("/review")}
          className="mb-4 flex w-full items-center justify-between rounded-xl border bg-card p-4 card-press"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🌙</span>
            <span className="text-sm font-medium">晚间复盘</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
