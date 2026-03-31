import { useState } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Plus, X } from "lucide-react";
import PilotBadge from "@/components/PilotBadge";
import { getActiveRoles, useWeeklyFocus, useRoles, type TaskStatus } from "@/lib/store";

export default function WeeklyFocus() {
  const [weekly, setWeekly] = useWeeklyFocus();
  const [roles] = useRoles();
  const activeRoles = getActiveRoles(roles);
  const [notDoInput, setNotDoInput] = useState("");

  const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
  const we = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekLabel = `${format(ws, "M/d", { locale: zhCN })} - ${format(we, "M/d", { locale: zhCN })}`;

  const update = (patch: Partial<typeof weekly>) => setWeekly((p) => ({ ...p, ...patch }));

  const updateBattle = (idx: number, patch: Partial<typeof weekly.battles[0]>) => {
    const battles = [...weekly.battles] as typeof weekly.battles;
    battles[idx] = { ...battles[idx], ...patch };
    update({ battles });
  };

  const addNotDo = () => {
    if (!notDoInput.trim()) return;
    update({ notToDo: [...weekly.notToDo, notDoInput.trim()] });
    setNotDoInput("");
  };

  const removeNotDo = (idx: number) => {
    update({ notToDo: weekly.notToDo.filter((_, i) => i !== idx) });
  };

  const totalAlloc = activeRoles.reduce((sum, role) => sum + (weekly.roleAllocation[role.id] || 0), 0);

  const statusLabels: Record<TaskStatus, string> = { todo: "鏈紑濮?, doing: "杩涜涓?, done: "宸插畬鎴? };
  const nextStatus: Record<TaskStatus, TaskStatus> = { todo: "doing", doing: "done", done: "todo" };

  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <div className="mb-6 fade-in">
          <h1 className="text-2xl font-bold tracking-tight">鏈懆涓荤嚎</h1>
          <p className="text-sm text-muted-foreground">{weekLabel}</p>
          <div className="mt-2">
            <PilotBadge />
          </div>
        </div>

        {/* Weekly Theme */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">鏈懆鍞竴涓婚</h2>
          <input
            type="text"
            value={weekly.theme}
            onChange={(e) => update({ theme: e.target.value })}
            placeholder="杩欏懆鍒板簳鍦ㄦ墦浠€涔堜粭锛?
            className="w-full rounded-xl border bg-card p-4 text-base font-semibold outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
          />
        </section>

        {/* 3 Battles */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">鈿旓笍 涓夊満鍏抽敭鎴?/h2>
          <div className="space-y-3">
            {weekly.battles.map((battle, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">鎴樺焦 {i + 1}</span>
                  <button
                    onClick={() => updateBattle(i, { status: nextStatus[battle.status] })}
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      battle.status === "done"
                        ? "bg-success/15 text-success"
                        : battle.status === "doing"
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {statusLabels[battle.status]}
                  </button>
                </div>
                <input
                  type="text"
                  value={battle.name}
                  onChange={(e) => updateBattle(i, { name: e.target.value })}
                  placeholder="鎴樺焦鍚嶇О"
                  className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/30"
                />
                <input
                  type="text"
                  value={battle.why}
                  onChange={(e) => updateBattle(i, { why: e.target.value })}
                  placeholder="涓轰粈涔堥噸瑕侊紵"
                  className="w-full bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/30"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Role Allocation */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">馃搳 瑙掕壊閰嶆瘮</h2>
          <div className="rounded-xl border bg-card p-4 space-y-3">
            {activeRoles.map((role) => {
              const val = weekly.roleAllocation[role.id] || 0;
              return (
                <div key={role.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{role.name}</span>
                    <span className="text-xs text-muted-foreground">{val}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={val}
                    onChange={(e) =>
                      update({
                        roleAllocation: { ...weekly.roleAllocation, [role.id]: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-primary h-1.5"
                  />
                </div>
              );
            })}
            {totalAlloc !== 100 && (
              <p className="text-xs text-destructive">褰撳墠鎬昏 {totalAlloc}%锛屽缓璁皟鏁村埌 100%</p>
            )}
          </div>
        </section>

        {/* Not To Do */}
        <section className="mb-6 fade-in">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">馃毇 鏈懆涓嶅仛娓呭崟</h2>
          <div className="space-y-1.5">
            {weekly.notToDo.map((item, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                <span className="flex-1 text-sm">{item}</span>
                <button onClick={() => removeNotDo(i)} className="text-muted-foreground/40 hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={notDoInput}
              onChange={(e) => setNotDoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNotDo()}
              placeholder="杩欏懆鏄庣‘涓嶅仛浠€涔堬紵"
              className="flex-1 rounded-lg border bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
            />
            <button onClick={addNotDo} className="rounded-lg bg-primary p-2 text-primary-foreground">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
