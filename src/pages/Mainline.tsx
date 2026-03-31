import HeaderActionLink from "@/components/HeaderActionLink";
import PilotBadge from "@/components/PilotBadge";
import { cn } from "@/lib/utils";
import { useMonthlyFocus, useWeeklyFocus, type TaskStatus } from "@/lib/store";

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

export default function Mainline() {
  const [monthly, setMonthly] = useMonthlyFocus();
  const [weekly, setWeekly] = useWeeklyFocus();

  const updateMonthly = (patch: Partial<typeof monthly>) => {
    setMonthly((prev) => ({ ...prev, ...patch }));
  };

  const updateWeekly = (patch: Partial<typeof weekly>) => {
    setWeekly((prev) => ({ ...prev, ...patch }));
  };

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

  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <header className="page-header fade-in">
          <div>
            <p className="page-caption mt-0">只看这段时间真正该往前推的东西。</p>
            <h1 className="page-title mt-2">主线</h1>
            <div className="page-badges">
              <PilotBadge />
            </div>
          </div>
          <HeaderActionLink />
        </header>

        <section className="section-block fade-in">
          <div className="section-bar">
            <h2 className="section-title">本月三条主线</h2>
          </div>
          <div className="space-y-2">
            {monthly.axes.map((axis, index) => (
              <div key={index} className="stack-card">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={axis}
                    onChange={(event) => updateAxis(index, event.target.value)}
                    placeholder={`主线 ${index + 1}`}
                    className="w-full border-none bg-transparent px-0 py-0 text-sm font-medium shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section-block fade-in">
          <div className="section-bar">
            <h2 className="section-title">本周唯一主题</h2>
          </div>
          <div className="hero-panel px-4 py-4">
            <input
              type="text"
              value={weekly.theme}
              onChange={(event) => updateWeekly({ theme: event.target.value })}
              placeholder="这周到底在抓什么"
              className="w-full border-none bg-transparent px-0 py-0 text-[1.2rem] font-semibold shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
            />
          </div>
        </section>

        <section className="fade-in">
          <div className="section-bar">
            <h2 className="section-title">本周三件关键事</h2>
          </div>
          <div className="space-y-2">
            {weekly.battles.map((battle, index) => (
              <div key={index} className="stack-card">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateBattle(index, { status: NEXT_STATUS[battle.status] })}
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
                      battle.status === "done"
                        ? "bg-success/15 text-success"
                        : battle.status === "doing"
                          ? "bg-primary/12 text-primary"
                          : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {STATUS_LABELS[battle.status]}
                  </button>
                  <input
                    type="text"
                    value={battle.name}
                    onChange={(event) => updateBattle(index, { name: event.target.value })}
                    placeholder={`关键事 ${index + 1}`}
                    className="w-full border-none bg-transparent px-0 py-0 text-sm font-medium shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
