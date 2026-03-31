import { useWeeklyFocus, useRoles } from "@/lib/store";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = [
  "hsl(24, 80%, 50%)",
  "hsl(210, 55%, 52%)",
  "hsl(152, 40%, 46%)",
  "hsl(280, 45%, 55%)",
  "hsl(45, 70%, 50%)",
  "hsl(340, 50%, 55%)",
];

export default function Roles() {
  const [roles] = useRoles();
  const [weekly] = useWeeklyFocus();

  const chartData = roles.map((role, i) => ({
    name: role.name,
    value: weekly.roleAllocation[role.id] || 0,
    color: COLORS[i % COLORS.length],
  })).filter((d) => d.value > 0);

  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <div className="mb-6 fade-in">
          <h1 className="text-2xl font-bold tracking-tight">角色身份</h1>
          <p className="text-sm text-muted-foreground">看见你的时间都花在了哪个角色上</p>
        </div>

        {/* Distribution Chart */}
        {chartData.length > 0 && (
          <section className="mb-6 fade-in">
            <div className="rounded-xl border bg-card p-4">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">本周角色分布</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {chartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-muted-foreground">{d.name} {d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Role Cards */}
        <section className="space-y-3 fade-in">
          {roles.map((role, i) => {
            const alloc = weekly.roleAllocation[role.id] || 0;
            return (
              <div key={role.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold">{role.name}</h3>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    本周 {alloc}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{role.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {role.examples.map((ex, j) => (
                    <span key={j} className="rounded bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                      {ex}
                    </span>
                  ))}
                </div>
                {/* Allocation bar */}
                <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${alloc}%`, backgroundColor: COLORS[i % COLORS.length] }}
                  />
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
