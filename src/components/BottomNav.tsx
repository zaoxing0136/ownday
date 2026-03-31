import { NavLink } from "react-router-dom";
import { Target, Compass, Inbox, CalendarDays, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", icon: Target, label: "今日" },
  { to: "/focus", icon: Compass, label: "主线" },
  { to: "/drafts", icon: Inbox, label: "草稿" },
  { to: "/future", icon: CalendarDays, label: "未来" },
  { to: "/review", icon: Moon, label: "复盘" },
];

export default function BottomNav() {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 safe-bottom px-3 pb-3">
      <div className="mx-auto max-w-xl">
        <div className="pointer-events-auto rounded-[1.9rem] border border-white/60 bg-white/70 px-2 py-2 shadow-[0_32px_80px_-36px_hsl(192_22%_18%_/_0.55)] backdrop-blur-2xl">
          <div className="grid grid-cols-5 gap-1">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "group relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-[1.4rem] px-2 py-2 text-[11px] font-medium transition-all",
                    isActive
                      ? "bg-[linear-gradient(180deg,hsl(var(--primary)/0.16),hsl(var(--primary)/0.06))] text-primary shadow-[inset_0_1px_0_hsl(0_0%_100%_/_0.75),0_16px_34px_-24px_hsl(var(--primary)/0.6)]"
                      : "text-muted-foreground hover:bg-white/55 hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                        isActive
                          ? "bg-white/70 shadow-[0_12px_24px_-18px_hsl(var(--primary)/0.6)]"
                          : "bg-transparent group-hover:bg-white/75"
                      )}
                    >
                      <tab.icon className={cn("h-[18px] w-[18px]", isActive && "scale-105")} />
                    </div>
                    <span className={cn("tracking-[0.16em]", isActive && "font-semibold")}>
                      {tab.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
