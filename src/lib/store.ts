import { useState, useCallback } from "react";
import { format, startOfWeek } from "date-fns";

// ─── Types ───────────────────────────────────────────

export type EnergyState = "high" | "medium" | "low" | "chaos";
export type TaskStatus = "todo" | "doing" | "done";

export interface SacredTask {
  title: string;
  done: boolean;
  role: string;
  energy: EnergyState | "";
  linkedBattle: string;
  failReason: string;
}

export interface KeyResult {
  id: string;
  title: string;
  role: string;
  energy: EnergyState | "";
  status: TaskStatus;
}

export interface SupportTask {
  id: string;
  title: string;
  done: boolean;
}

export interface DailyReview {
  sacredDone: boolean;
  failReason: string;
  drifted: "no" | "slight" | "major";
  energyAccurate: "accurate" | "ok" | "wrong";
  bestProgress: string;
  tomorrowRole: string;
  tomorrowSacred: string;
  completed: boolean;
}

export interface DailyEntry {
  id: string;
  date: string;
  energyState: EnergyState | "";
  mainRole: string;
  sacredTask: SacredTask;
  keyResults: KeyResult[];
  supportTasks: SupportTask[];
  quickNotes: string[];
  review?: DailyReview;
}

export interface WeeklyBattle {
  name: string;
  why: string;
  status: TaskStatus;
  mappedToday: boolean;
}

export interface WeeklyFocus {
  id: string;
  weekStart: string;
  theme: string;
  battles: [WeeklyBattle, WeeklyBattle, WeeklyBattle];
  roleAllocation: Record<string, number>;
  notToDo: string[];
}

export interface MonthlyFocus {
  id: string;
  monthKey: string;
  axes: [string, string, string];
  resourceFocus: { money: string; time: string; attention: string };
  riskDrift: string[];
}

export interface Role {
  id: string;
  name: string;
  desc: string;
  examples: string[];
}

// ─── Constants ───────────────────────────────────────

export const ENERGY_CONFIG: Record<EnergyState, { label: string; desc: string; icon: string }> = {
  high: { label: "高能推进", desc: "打硬仗、做决策、写关键内容", icon: "⚡" },
  medium: { label: "中能执行", desc: "推进、沟通、修改、跟进", icon: "🔋" },
  low: { label: "低能收尾", desc: "清零碎、收尾、整理", icon: "🌿" },
  chaos: { label: "混乱保底", desc: "只保 1 件最重要的事", icon: "🛡️" },
};

export const DEFAULT_ROLES: Role[] = [
  { id: "founder", name: "创始人 / 操盘手", desc: "战略方向、关键决策、资源调度", examples: ["制定季度战略", "关键合作谈判", "融资路演"] },
  { id: "growth", name: "增长负责人", desc: "获客、转化、留存、增长实验", examples: ["分析转化漏斗", "策划增长活动", "优化投放策略"] },
  { id: "product", name: "产品设计者", desc: "需求洞察、产品规划、体验优化", examples: ["用户调研", "功能原型设计", "竞品分析"] },
  { id: "content", name: "内容输出者", desc: "内容创作、品牌建设、公众表达", examples: ["写公众号文章", "录制视频", "准备演讲"] },
  { id: "manager", name: "团队管理者", desc: "带人、协调、文化建设", examples: ["1on1 面谈", "团队周会", "绩效反馈"] },
  { id: "personal", name: "家庭与个人", desc: "健康、家庭、自我充电", examples: ["运动健身", "陪伴家人", "学习充电"] },
];

// ─── Helpers ─────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getTodayKey(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getWeekStartKey(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function getMonthKey(): string {
  return format(new Date(), "yyyy-MM");
}

function createDefaultDaily(date: string): DailyEntry {
  return {
    id: uid(),
    date,
    energyState: "",
    mainRole: "",
    sacredTask: { title: "", done: false, role: "", energy: "", linkedBattle: "", failReason: "" },
    keyResults: [
      { id: uid(), title: "", role: "", energy: "", status: "todo" },
      { id: uid(), title: "", role: "", energy: "", status: "todo" },
      { id: uid(), title: "", role: "", energy: "", status: "todo" },
    ],
    supportTasks: [],
    quickNotes: [],
  };
}

function createDefaultWeekly(weekStart: string): WeeklyFocus {
  const defaultAlloc: Record<string, number> = {};
  DEFAULT_ROLES.forEach((r) => (defaultAlloc[r.id] = Math.round(100 / DEFAULT_ROLES.length)));
  return {
    id: uid(),
    weekStart,
    theme: "",
    battles: [
      { name: "", why: "", status: "todo", mappedToday: false },
      { name: "", why: "", status: "todo", mappedToday: false },
      { name: "", why: "", status: "todo", mappedToday: false },
    ],
    roleAllocation: defaultAlloc,
    notToDo: [],
  };
}

function createDefaultMonthly(monthKey: string): MonthlyFocus {
  return {
    id: uid(),
    monthKey,
    axes: ["", "", ""],
    resourceFocus: { money: "", time: "", attention: "" },
    riskDrift: [],
  };
}

// ─── Generic localStorage hook ───────────────────────

function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  return [stored, setValue];
}

// ─── Domain hooks ────────────────────────────────────

export function useDailyEntry(date?: string) {
  const d = date || getTodayKey();
  return useLocalStorage<DailyEntry>(`omd_daily_${d}`, createDefaultDaily(d));
}

export function useWeeklyFocus(weekStart?: string) {
  const w = weekStart || getWeekStartKey();
  return useLocalStorage<WeeklyFocus>(`omd_weekly_${w}`, createDefaultWeekly(w));
}

export function useMonthlyFocus(monthKey?: string) {
  const m = monthKey || getMonthKey();
  return useLocalStorage<MonthlyFocus>(`omd_monthly_${m}`, createDefaultMonthly(m));
}

export function useRoles() {
  return useLocalStorage<Role[]>("omd_roles", DEFAULT_ROLES);
}
