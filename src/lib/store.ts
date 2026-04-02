import { useState, useCallback, useEffect } from "react";
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

export interface IdeaItem {
  id: string;
  text: string;
  createdAt: string;
}

export interface DailyReview {
  sacredDone: boolean;
  failReason: string;
  bestProgress: string;
  stuckPoint: string;
  mood: string;
  loopingThought: string;
  tomorrowRole: string;
  tomorrowSacred: string;
  completed: boolean;
  drifted: "no" | "slight" | "major";
  energyAccurate: "accurate" | "ok" | "wrong";
}

export type DraftStatus = "draft" | "pending";
export type FuturePriority = "low" | "medium" | "high";
export type FutureReminderMinutes = 0 | 10 | 30 | 60 | 1440;

export interface DailyEntry {
  id: string;
  date: string;
  energyState: EnergyState | "";
  mainRole: string;
  sacredTask: SacredTask;
  keyResults: KeyResult[];
  supportTasks: SupportTask[];
  quickNotes: string[];
  ideaItems: IdeaItem[];
  brainDump?: string;
  review?: DailyReview;
}

export interface DraftItem {
  id: string;
  title: string;
  notes?: string;
  source?: string;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
  relatedRoleId?: string;
  relatedWeek?: string;
  relatedMonth?: string;
}

export interface FutureItem {
  id: string;
  title: string;
  notes?: string;
  date: string;
  time?: string;
  rawInput?: string;
  priority: FuturePriority;
  reminderMinutesBefore?: FutureReminderMinutes | null;
  reminderAt?: string;
  remindedAt?: string;
  relatedRoleId?: string;
  relatedWeek?: string;
  relatedMonth?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyBattle {
  name: string;
  why: string;
  status: TaskStatus;
  mappedToday: boolean;
  axisIndex?: number | null;
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
  active?: boolean;
}

export interface OwnMyDayBackupData {
  version: number;
  exportedAt: string;
  daily: Record<string, DailyEntry>;
  weekly: Record<string, WeeklyFocus>;
  monthly: Record<string, MonthlyFocus>;
  roles: Role[];
  drafts: DraftItem[];
  future: FutureItem[];
}

export interface OwnMyDayStorageSummary {
  dailyCount: number;
  weeklyCount: number;
  monthlyCount: number;
  roleCount: number;
  draftCount: number;
  futureCount: number;
}

export interface OwnMyDayActionResult {
  ok: boolean;
  message: string;
}

// ─── Constants ───────────────────────────────────────

export const ENERGY_CONFIG: Record<EnergyState, { label: string; desc: string; icon: string }> = {
  high: { label: "高能", desc: "适合猛推最重要的事", icon: "⚡" },
  medium: { label: "中能", desc: "适合稳定推进", icon: "🌤️" },
  low: { label: "低能", desc: "适合收口和清理", icon: "🌙" },
  chaos: { label: "混乱", desc: "先保住最重要的一件", icon: "🌀" },
};

export const DEFAULT_ROLES: Role[] = [
  {
    id: "founder",
    name: "操盘",
    desc: "方向、决策、关键推进。",
    examples: ["定方向", "做决策", "谈关键合作"],
  },
  {
    id: "growth",
    name: "增长",
    desc: "获客、转化、增长动作。",
    examples: ["改转化", "做投放", "盯增长"],
  },
  {
    id: "product",
    name: "产品",
    desc: "需求、体验、产品推进。",
    examples: ["梳需求", "改流程", "做方案"],
  },
  {
    id: "content",
    name: "内容",
    desc: "写作、表达、对外输出。",
    examples: ["写文章", "录内容", "做表达"],
  },
  {
    id: "manager",
    name: "团队",
    desc: "带人、协调、组织推进。",
    examples: ["带人", "开会", "协调资源"],
  },
  {
    id: "personal",
    name: "生活",
    desc: "身体、家庭、个人状态。",
    examples: ["运动", "陪家人", "休整充电"],
  },
];

const DAILY_PREFIX = "omd_daily_";
const WEEKLY_PREFIX = "omd_weekly_";
const MONTHLY_PREFIX = "omd_monthly_";
const ROLES_KEY = "omd_roles";
const DRAFTS_KEY = "omd_draft_box";
const FUTURE_KEY = "omd_future_schedule";
const BACKUP_VERSION = 1;
const STORAGE_SYNC_EVENT = "omd:storage-sync";
const REMINDER_TIME_FALLBACK = "09:00";

// ─── Helpers ─────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function nowIso(): string {
  return new Date().toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getStorageSafely(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function getStorageKeys(storage: Storage) {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key) keys.push(key);
  }
  return keys;
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
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

export function getSavedDailyDates(): string[] {
  const storage = getStorageSafely();
  if (!storage) return [];
  return getStorageKeys(storage)
    .filter((key) => key.startsWith(DAILY_PREFIX))
    .map((key) => key.slice(DAILY_PREFIX.length))
    .sort((a, b) => b.localeCompare(a));
}

export function getSavedWeekStarts(): string[] {
  const storage = getStorageSafely();
  if (!storage) return [];
  return getStorageKeys(storage)
    .filter((key) => key.startsWith(WEEKLY_PREFIX))
    .map((key) => key.slice(WEEKLY_PREFIX.length))
    .sort((a, b) => b.localeCompare(a));
}

export function getSavedMonthKeys(): string[] {
  const storage = getStorageSafely();
  if (!storage) return [];
  return getStorageKeys(storage)
    .filter((key) => key.startsWith(MONTHLY_PREFIX))
    .map((key) => key.slice(MONTHLY_PREFIX.length))
    .sort((a, b) => b.localeCompare(a));
}

function isFutureReminderMinutes(value: unknown): value is FutureReminderMinutes {
  return value === 0 || value === 10 || value === 30 || value === 60 || value === 1440;
}

function resolveReminderBaseTime(time?: string) {
  const normalized = typeof time === "string" && /^\d{2}:\d{2}$/.test(time) ? time : REMINDER_TIME_FALLBACK;
  return normalized;
}

function toReminderTimestamp(date: string, time?: string, minutesBefore?: FutureReminderMinutes | null) {
  if (!date || minutesBefore === null || minutesBefore === undefined) return "";

  const baseTime = resolveReminderBaseTime(time);
  const base = new Date(`${date}T${baseTime}:00`);
  if (Number.isNaN(base.getTime())) return "";

  base.setMinutes(base.getMinutes() - minutesBefore);
  return base.toISOString();
}

export function getFutureReminderLabel(item: Pick<FutureItem, "reminderMinutesBefore">) {
  if (item.reminderMinutesBefore === null || item.reminderMinutesBefore === undefined) return "不提醒";
  if (item.reminderMinutesBefore === 0) return "准时提醒";
  if (item.reminderMinutesBefore === 1440) return "提前 1 天";
  if (item.reminderMinutesBefore === 60) return "提前 1 小时";
  return `提前 ${item.reminderMinutesBefore} 分钟`;
}

export function getDueFutureReminderItems(items: FutureItem[], now: Date = new Date()) {
  const timestamp = now.getTime();
  return items.filter((item) => {
    if (!item.reminderAt || item.remindedAt) return false;
    const reminderTime = new Date(item.reminderAt).getTime();
    return Number.isFinite(reminderTime) && reminderTime <= timestamp;
  });
}

export function markFutureItemsReminded(items: FutureItem[], ids: string[]) {
  if (ids.length === 0) return items;
  const seenAt = nowIso();
  return items.map((item) =>
    ids.includes(item.id)
      ? {
          ...item,
          remindedAt: item.remindedAt || seenAt,
          updatedAt: seenAt,
        }
      : item
  );
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
    ideaItems: [],
    review: createDefaultReview(),
  };
}

function createDefaultReview(): DailyReview {
  return {
    sacredDone: false,
    failReason: "",
    bestProgress: "",
    stuckPoint: "",
    mood: "",
    loopingThought: "",
    tomorrowRole: "",
    tomorrowSacred: "",
    completed: false,
    drifted: "no",
    energyAccurate: "accurate",
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
      { name: "", why: "", status: "todo", mappedToday: false, axisIndex: null },
      { name: "", why: "", status: "todo", mappedToday: false, axisIndex: null },
      { name: "", why: "", status: "todo", mappedToday: false, axisIndex: null },
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

function normalizeDailyEntry(entry: DailyEntry | null | undefined, date: string): DailyEntry {
  const base = createDefaultDaily(date);

  if (!entry) return base;

  const keyResults = Array.isArray(entry.keyResults)
    ? entry.keyResults.map((result) => ({
        id: result.id || uid(),
        title: result.title || "",
        role: result.role || "",
        energy: result.energy || "",
        status: result.status || "todo",
      }))
    : base.keyResults;

  const legacyBrainDump = typeof entry.brainDump === "string" ? entry.brainDump : "";
  const ideaItems = normalizeIdeaItems(entry.ideaItems, legacyBrainDump);

  return {
    ...base,
    ...entry,
    sacredTask: {
      ...base.sacredTask,
      ...entry.sacredTask,
    },
    keyResults: keyResults.length > 0 ? keyResults : base.keyResults,
    supportTasks: Array.isArray(entry.supportTasks) ? entry.supportTasks : base.supportTasks,
    quickNotes: Array.isArray(entry.quickNotes) ? entry.quickNotes : base.quickNotes,
    ideaItems,
    review: normalizeDailyReview(entry.review),
    brainDump: undefined,
  };
}

function normalizeDailyReview(review: DailyReview | null | undefined): DailyReview {
  const base = createDefaultReview();
  if (!review) return base;

  return {
    ...base,
    ...review,
    sacredDone: typeof review.sacredDone === "boolean" ? review.sacredDone : base.sacredDone,
    failReason: typeof review.failReason === "string" ? review.failReason : base.failReason,
    bestProgress: typeof review.bestProgress === "string" ? review.bestProgress : base.bestProgress,
    stuckPoint: typeof review.stuckPoint === "string" ? review.stuckPoint : base.stuckPoint,
    mood: typeof review.mood === "string" ? review.mood : base.mood,
    loopingThought:
      typeof review.loopingThought === "string" ? review.loopingThought : base.loopingThought,
    tomorrowRole:
      typeof review.tomorrowRole === "string" ? review.tomorrowRole : base.tomorrowRole,
    tomorrowSacred:
      typeof review.tomorrowSacred === "string" ? review.tomorrowSacred : base.tomorrowSacred,
    completed: typeof review.completed === "boolean" ? review.completed : base.completed,
    drifted:
      review.drifted === "no" || review.drifted === "slight" || review.drifted === "major"
        ? review.drifted
        : base.drifted,
    energyAccurate:
      review.energyAccurate === "accurate" ||
      review.energyAccurate === "ok" ||
      review.energyAccurate === "wrong"
        ? review.energyAccurate
        : base.energyAccurate,
  };
}

function normalizeIdeaItems(items: IdeaItem[] | null | undefined, legacyBrainDump?: string): IdeaItem[] {
  const normalizedItems = Array.isArray(items)
    ? items
        .filter((item) => isRecord(item))
        .map((item) => ({
          id: typeof item.id === "string" && item.id ? item.id : uid(),
          text: typeof item.text === "string" ? item.text : "",
          createdAt:
            typeof item.createdAt === "string" && item.createdAt ? item.createdAt : nowIso(),
        }))
    : [];

  if (normalizedItems.length > 0) {
    return normalizedItems;
  }

  if (legacyBrainDump?.trim()) {
    return [
      {
        id: uid(),
        text: legacyBrainDump,
        createdAt: nowIso(),
      },
    ];
  }

  return [];
}

function normalizeRoles(roles: Role[] | null | undefined): Role[] {
  if (!Array.isArray(roles) || roles.length === 0) {
    return DEFAULT_ROLES;
  }

  return roles.map((role, index) => ({
    id: role.id || `role_${index + 1}`,
    name: role.name || `角色 ${index + 1}`,
    desc: role.desc || "",
    examples: Array.isArray(role.examples) ? role.examples : [],
    active: role.active !== false,
  }));
}

function emitStorageSync(key: string | "*") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(STORAGE_SYNC_EVENT, {
      detail: { key },
    })
  );
}

export function getActiveRoles(roles: Role[]) {
  return roles.filter((role) => role.active !== false);
}

function normalizeWeeklyFocus(entry: WeeklyFocus | null | undefined, weekStart: string): WeeklyFocus {
  const base = createDefaultWeekly(weekStart);
  if (!entry) return base;

  const battleSource = Array.isArray(entry.battles) ? entry.battles : [];
  const battles = [0, 1, 2].map((index) => {
    const battle = battleSource[index];
    return {
      ...base.battles[index],
      ...(isRecord(battle) ? battle : {}),
      name: typeof battle?.name === "string" ? battle.name : base.battles[index].name,
      why: typeof battle?.why === "string" ? battle.why : base.battles[index].why,
      status:
        battle?.status === "todo" || battle?.status === "doing" || battle?.status === "done"
          ? battle.status
          : base.battles[index].status,
      mappedToday: typeof battle?.mappedToday === "boolean" ? battle.mappedToday : false,
      axisIndex: typeof battle?.axisIndex === "number" ? battle.axisIndex : null,
    };
  }) as WeeklyFocus["battles"];

  const roleAllocation = isRecord(entry.roleAllocation)
    ? Object.fromEntries(
        Object.entries(entry.roleAllocation).map(([key, value]) => [
          key,
          typeof value === "number" && Number.isFinite(value) ? value : 0,
        ])
      )
    : base.roleAllocation;

  return {
    ...base,
    ...entry,
    weekStart,
    theme: typeof entry.theme === "string" ? entry.theme : base.theme,
    battles,
    roleAllocation,
    notToDo: Array.isArray(entry.notToDo) ? entry.notToDo.filter((item) => typeof item === "string") : [],
  };
}

function normalizeMonthlyFocus(entry: MonthlyFocus | null | undefined, monthKey: string): MonthlyFocus {
  const base = createDefaultMonthly(monthKey);
  if (!entry) return base;

  const axesSource = Array.isArray(entry.axes) ? entry.axes : [];
  const axes = [0, 1, 2].map((index) =>
    typeof axesSource[index] === "string" ? axesSource[index] : ""
  ) as MonthlyFocus["axes"];

  const resourceFocus = isRecord(entry.resourceFocus)
    ? {
        money: typeof entry.resourceFocus.money === "string" ? entry.resourceFocus.money : "",
        time: typeof entry.resourceFocus.time === "string" ? entry.resourceFocus.time : "",
        attention:
          typeof entry.resourceFocus.attention === "string" ? entry.resourceFocus.attention : "",
      }
    : base.resourceFocus;

  return {
    ...base,
    ...entry,
    monthKey,
    axes,
    resourceFocus,
    riskDrift: Array.isArray(entry.riskDrift)
      ? entry.riskDrift.filter((item) => typeof item === "string")
      : [],
  };
}

function normalizeDraftItems(items: DraftItem[] | null | undefined): DraftItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => isRecord(item) && typeof item.title === "string")
    .map((item) => ({
      id: typeof item.id === "string" && item.id ? item.id : uid(),
      title: item.title.trim(),
      notes: typeof item.notes === "string" ? item.notes : "",
      source: typeof item.source === "string" ? item.source : undefined,
      status: item.status === "draft" || item.status === "pending" ? item.status : "draft",
      createdAt: typeof item.createdAt === "string" && item.createdAt ? item.createdAt : nowIso(),
      updatedAt: typeof item.updatedAt === "string" && item.updatedAt ? item.updatedAt : nowIso(),
      relatedRoleId: typeof item.relatedRoleId === "string" ? item.relatedRoleId : undefined,
      relatedWeek: typeof item.relatedWeek === "string" ? item.relatedWeek : undefined,
      relatedMonth: typeof item.relatedMonth === "string" ? item.relatedMonth : undefined,
    }))
    .filter((item) => item.title);
}

function normalizeFutureItems(items: FutureItem[] | null | undefined): FutureItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => isRecord(item) && typeof item.title === "string" && typeof item.date === "string")
    .map((item) => ({
      id: typeof item.id === "string" && item.id ? item.id : uid(),
      title: item.title.trim(),
      notes: typeof item.notes === "string" ? item.notes : "",
      date: item.date,
      time: typeof item.time === "string" ? item.time : "",
      rawInput: typeof item.rawInput === "string" ? item.rawInput : "",
      priority: item.priority === "low" || item.priority === "medium" || item.priority === "high" ? item.priority : "medium",
      reminderMinutesBefore: isFutureReminderMinutes(item.reminderMinutesBefore)
        ? item.reminderMinutesBefore
        : null,
      reminderAt: typeof item.reminderAt === "string" ? item.reminderAt : "",
      remindedAt: typeof item.remindedAt === "string" ? item.remindedAt : "",
      relatedRoleId: typeof item.relatedRoleId === "string" ? item.relatedRoleId : undefined,
      relatedWeek: typeof item.relatedWeek === "string" ? item.relatedWeek : undefined,
      relatedMonth: typeof item.relatedMonth === "string" ? item.relatedMonth : undefined,
      createdAt: typeof item.createdAt === "string" && item.createdAt ? item.createdAt : nowIso(),
      updatedAt: typeof item.updatedAt === "string" && item.updatedAt ? item.updatedAt : nowIso(),
    }))
    .map((item) => ({
      ...item,
      reminderAt:
        item.reminderAt ||
        toReminderTimestamp(item.date, item.time, item.reminderMinutesBefore ?? null),
    }))
    .filter((item) => item.title && item.date);
}

// ─── Generic localStorage hook ───────────────────────

function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const storage = getStorageSafely();
      if (!storage) return initialValue;
      return safeParseJson<T>(storage.getItem(key), initialValue);
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          const storage = getStorageSafely();
          storage?.setItem(key, JSON.stringify(next));
          emitStorageSync(key);
        } catch {
          // Keep in-memory state usable even if persistence fails.
        }
        return next;
      });
    },
    [key]
  );

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const storage = getStorageSafely();
        const next = storage ? safeParseJson<T>(storage.getItem(key), initialValue) : initialValue;
        setStored(next);
      } catch {
        setStored(initialValue);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) {
        syncFromStorage();
      }
    };

    const handleCustomSync = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      if (!detail?.key || detail.key === key || detail.key === "*") {
        syncFromStorage();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(STORAGE_SYNC_EVENT, handleCustomSync as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(STORAGE_SYNC_EVENT, handleCustomSync as EventListener);
    };
    // `initialValue` is intentionally omitted here; callers change key when the storage shape changes.
  }, [key]);

  return [stored, setValue];
}

// ─── Domain hooks ────────────────────────────────────

export function useDailyEntry(date?: string) {
  const d = date || getTodayKey();
  const [entry, setEntry] = useLocalStorage<DailyEntry>(`omd_daily_${d}`, createDefaultDaily(d));

  const safeEntry = normalizeDailyEntry(entry, d);
  const safeSetEntry = useCallback(
    (value: DailyEntry | ((prev: DailyEntry) => DailyEntry)) => {
      setEntry((prev) => {
        const normalizedPrev = normalizeDailyEntry(prev, d);
        const next = value instanceof Function ? value(normalizedPrev) : value;
        return normalizeDailyEntry(next, d);
      });
    },
    [d, setEntry]
  );

  return [safeEntry, safeSetEntry] as const;
}

export function useWeeklyFocus(weekStart?: string) {
  const w = weekStart || getWeekStartKey();
  const [weekly, setWeekly] = useLocalStorage<WeeklyFocus>(`${WEEKLY_PREFIX}${w}`, createDefaultWeekly(w));
  const safeWeekly = normalizeWeeklyFocus(weekly, w);
  const safeSetWeekly = useCallback(
    (value: WeeklyFocus | ((prev: WeeklyFocus) => WeeklyFocus)) => {
      setWeekly((prev) => {
        const normalizedPrev = normalizeWeeklyFocus(prev, w);
        const next = value instanceof Function ? value(normalizedPrev) : value;
        return normalizeWeeklyFocus(next, w);
      });
    },
    [setWeekly, w]
  );

  return [safeWeekly, safeSetWeekly] as const;
}

export function useMonthlyFocus(monthKey?: string) {
  const m = monthKey || getMonthKey();
  const [monthly, setMonthly] = useLocalStorage<MonthlyFocus>(`${MONTHLY_PREFIX}${m}`, createDefaultMonthly(m));
  const safeMonthly = normalizeMonthlyFocus(monthly, m);
  const safeSetMonthly = useCallback(
    (value: MonthlyFocus | ((prev: MonthlyFocus) => MonthlyFocus)) => {
      setMonthly((prev) => {
        const normalizedPrev = normalizeMonthlyFocus(prev, m);
        const next = value instanceof Function ? value(normalizedPrev) : value;
        return normalizeMonthlyFocus(next, m);
      });
    },
    [m, setMonthly]
  );

  return [safeMonthly, safeSetMonthly] as const;
}

export function useRoles() {
  const [roles, setRoles] = useLocalStorage<Role[]>(ROLES_KEY, DEFAULT_ROLES);
  const safeRoles = normalizeRoles(roles);
  const safeSetRoles = useCallback(
    (value: Role[] | ((prev: Role[]) => Role[])) => {
      setRoles((prev) => {
        const normalizedPrev = normalizeRoles(prev);
        const next = value instanceof Function ? value(normalizedPrev) : value;
        return normalizeRoles(next);
      });
    },
    [setRoles]
  );
  return [safeRoles, safeSetRoles] as const;
}

export function useDraftBox() {
  const [drafts, setDrafts] = useLocalStorage<DraftItem[]>(DRAFTS_KEY, []);
  const safeDrafts = normalizeDraftItems(drafts);
  const safeSetDrafts = useCallback(
    (value: DraftItem[] | ((prev: DraftItem[]) => DraftItem[])) => {
      setDrafts((prev) => {
        const normalizedPrev = normalizeDraftItems(prev);
        const next = value instanceof Function ? value(normalizedPrev) : value;
        return normalizeDraftItems(next);
      });
    },
    [setDrafts]
  );
  return [safeDrafts, safeSetDrafts] as const;
}

export function useFutureSchedule() {
  const [items, setItems] = useLocalStorage<FutureItem[]>(FUTURE_KEY, []);
  const safeItems = normalizeFutureItems(items);
  const safeSetItems = useCallback(
    (value: FutureItem[] | ((prev: FutureItem[]) => FutureItem[])) => {
      setItems((prev) => {
        const normalizedPrev = normalizeFutureItems(prev);
        const next = value instanceof Function ? value(normalizedPrev) : value;
        return normalizeFutureItems(next);
      });
    },
    [setItems]
  );
  return [safeItems, safeSetItems] as const;
}

export function createDraftItem(input: {
  title: string;
  notes?: string;
  source?: string;
  status?: DraftStatus;
  relatedRoleId?: string;
  relatedWeek?: string;
  relatedMonth?: string;
}): DraftItem {
  const timestamp = nowIso();
  return {
    id: uid(),
    title: input.title.trim(),
    notes: input.notes?.trim() || "",
    source: input.source,
    status: input.status || "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
    relatedRoleId: input.relatedRoleId,
    relatedWeek: input.relatedWeek,
    relatedMonth: input.relatedMonth,
  };
}

export function createIdeaItem(text: string): IdeaItem {
  return {
    id: uid(),
    text: text.trim(),
    createdAt: nowIso(),
  };
}

export function createRole(name: string): Role {
  return {
    id: `role_${uid()}`,
    name: name.trim(),
    desc: "",
    examples: [],
    active: true,
  };
}

export function createFutureItem(input: {
  title: string;
  notes?: string;
  date: string;
  time?: string;
  rawInput?: string;
  priority?: FuturePriority;
  reminderMinutesBefore?: FutureReminderMinutes | null;
  relatedRoleId?: string;
  relatedWeek?: string;
  relatedMonth?: string;
}): FutureItem {
  const timestamp = nowIso();
  const reminderMinutesBefore =
    input.reminderMinutesBefore === null || input.reminderMinutesBefore === undefined
      ? null
      : input.reminderMinutesBefore;
  return {
    id: uid(),
    title: input.title.trim(),
    notes: input.notes?.trim() || "",
    date: input.date,
    time: input.time?.trim() || "",
    rawInput: input.rawInput?.trim() || "",
    priority: input.priority || "medium",
    reminderMinutesBefore,
    reminderAt: toReminderTimestamp(input.date, input.time?.trim() || "", reminderMinutesBefore),
    remindedAt: "",
    relatedRoleId: input.relatedRoleId,
    relatedWeek: input.relatedWeek,
    relatedMonth: input.relatedMonth,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function appendSupportTask(entry: DailyEntry, title: string): DailyEntry {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return entry;

  return {
    ...entry,
    supportTasks: [
      ...entry.supportTasks,
      {
        id: uid(),
        title: trimmedTitle,
        done: false,
      },
    ],
  };
}

export function insertIntoWeeklyBattles(
  weekly: WeeklyFocus,
  payload: { title: string; why?: string; axisIndex?: number | null }
) {
  const title = payload.title.trim();
  if (!title) {
    return { nextWeekly: weekly, inserted: false };
  }

  const existingIndex = weekly.battles.findIndex((battle) => battle.name.trim() === title);
  if (existingIndex >= 0) {
    return { nextWeekly: weekly, inserted: true };
  }

  const emptyIndex = weekly.battles.findIndex((battle) => !battle.name.trim());
  if (emptyIndex < 0) {
    return { nextWeekly: weekly, inserted: false };
  }

  const battles = [...weekly.battles] as typeof weekly.battles;
  battles[emptyIndex] = {
    ...battles[emptyIndex],
    name: title,
    why: payload.why || battles[emptyIndex].why || "",
    status: "todo",
    axisIndex: payload.axisIndex ?? null,
  };

  return {
    nextWeekly: {
      ...weekly,
      battles,
    },
    inserted: true,
  };
}

export function buildOwnMyDayBackup(): OwnMyDayBackupData {
  const storage = getStorageSafely();
  const daily: Record<string, DailyEntry> = {};
  const weekly: Record<string, WeeklyFocus> = {};
  const monthly: Record<string, MonthlyFocus> = {};

  if (storage) {
    getStorageKeys(storage).forEach((key) => {
      if (key.startsWith(DAILY_PREFIX)) {
        const dateKey = key.slice(DAILY_PREFIX.length);
        daily[dateKey] = normalizeDailyEntry(
          safeParseJson<DailyEntry | null>(storage.getItem(key), null),
          dateKey
        );
      }

      if (key.startsWith(WEEKLY_PREFIX)) {
        const weekKey = key.slice(WEEKLY_PREFIX.length);
        weekly[weekKey] = normalizeWeeklyFocus(
          safeParseJson<WeeklyFocus | null>(storage.getItem(key), null),
          weekKey
        );
      }

      if (key.startsWith(MONTHLY_PREFIX)) {
        const monthKey = key.slice(MONTHLY_PREFIX.length);
        monthly[monthKey] = normalizeMonthlyFocus(
          safeParseJson<MonthlyFocus | null>(storage.getItem(key), null),
          monthKey
        );
      }
    });
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: nowIso(),
    daily,
    weekly,
    monthly,
    roles: normalizeRoles(
      safeParseJson<Role[] | null>(storage?.getItem(ROLES_KEY) ?? null, DEFAULT_ROLES)
    ),
    drafts: normalizeDraftItems(
      safeParseJson<DraftItem[] | null>(storage?.getItem(DRAFTS_KEY) ?? null, [])
    ),
    future: normalizeFutureItems(
      safeParseJson<FutureItem[] | null>(storage?.getItem(FUTURE_KEY) ?? null, [])
    ),
  };
}

export function getOwnMyDayStorageSummary(): OwnMyDayStorageSummary {
  const backup = buildOwnMyDayBackup();
  return {
    dailyCount: Object.keys(backup.daily).length,
    weeklyCount: Object.keys(backup.weekly).length,
    monthlyCount: Object.keys(backup.monthly).length,
    roleCount: backup.roles.length,
    draftCount: backup.drafts.length,
    futureCount: backup.future.length,
  };
}

export function importOwnMyDayBackup(payload: unknown): OwnMyDayActionResult {
  const storage = getStorageSafely();
  if (!storage) {
    return { ok: false, message: "当前环境无法访问本地存储。" };
  }

  if (!isRecord(payload)) {
    return { ok: false, message: "导入失败：文件格式不对。" };
  }

  const version = payload.version;
  if (typeof version !== "number") {
    return { ok: false, message: "导入失败：缺少版本信息。" };
  }

  if (!isRecord(payload.daily) || !isRecord(payload.weekly) || !isRecord(payload.monthly)) {
    return { ok: false, message: "导入失败：主数据结构不完整。" };
  }

  if (!Array.isArray(payload.roles) || !Array.isArray(payload.drafts) || !Array.isArray(payload.future)) {
    return { ok: false, message: "导入失败：角色或列表数据格式不对。" };
  }

  try {
    getStorageKeys(storage)
      .filter((key) => key.startsWith("omd_"))
      .forEach((key) => storage.removeItem(key));

    Object.entries(payload.daily).forEach(([dateKey, value]) => {
      storage.setItem(
        `${DAILY_PREFIX}${dateKey}`,
        JSON.stringify(normalizeDailyEntry(value as DailyEntry | null, dateKey))
      );
    });

    Object.entries(payload.weekly).forEach(([weekKey, value]) => {
      storage.setItem(
        `${WEEKLY_PREFIX}${weekKey}`,
        JSON.stringify(normalizeWeeklyFocus(value as WeeklyFocus | null, weekKey))
      );
    });

    Object.entries(payload.monthly).forEach(([monthKey, value]) => {
      storage.setItem(
        `${MONTHLY_PREFIX}${monthKey}`,
        JSON.stringify(normalizeMonthlyFocus(value as MonthlyFocus | null, monthKey))
      );
    });

    storage.setItem(ROLES_KEY, JSON.stringify(normalizeRoles(payload.roles as Role[])));
    storage.setItem(DRAFTS_KEY, JSON.stringify(normalizeDraftItems(payload.drafts as DraftItem[])));
    storage.setItem(FUTURE_KEY, JSON.stringify(normalizeFutureItems(payload.future as FutureItem[])));
    emitStorageSync("*");

    return { ok: true, message: "数据导入成功。" };
  } catch {
    return { ok: false, message: "导入失败：写入本地存储时出错。" };
  }
}

export function resetOwnMyDayStorage(): OwnMyDayActionResult {
  const storage = getStorageSafely();
  if (!storage) {
    return { ok: false, message: "当前环境无法访问本地存储。" };
  }

  try {
    getStorageKeys(storage)
      .filter((key) => key.startsWith("omd_"))
      .forEach((key) => storage.removeItem(key));
    emitStorageSync("*");

    return { ok: true, message: "本地数据已清空。" };
  } catch {
    return { ok: false, message: "清空失败，请稍后再试。" };
  }
}
