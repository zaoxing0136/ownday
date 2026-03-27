import { NavLink } from "react-router-dom";
import { Target, CalendarDays, TrendingUp, Users, Moon } from "lucide-react";

const tabs = [
  { to: "/", icon: Target, label: "今日" },
  { to: "/week", icon: CalendarDays, label: "本周" },
  { to: "/month", icon: TrendingUp, label: "本月" },
  { to: "/roles", icon: Users, label: "角色" },
  { to: "/review", icon: Moon, label: "复盘" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                isActive ? "text-primary font-medium" : "text-muted-foreground"
              }`
            }
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
