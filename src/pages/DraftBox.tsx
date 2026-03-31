import { useState } from "react";
import { Clock3, FileText, Inbox, Trash2 } from "lucide-react";
import HeaderActionLink from "@/components/HeaderActionLink";
import PilotBadge from "@/components/PilotBadge";
import { toast } from "@/hooks/use-toast";
import {
  appendSupportTask,
  createDraftItem,
  getActiveRoles,
  getMonthKey,
  insertIntoWeeklyBattles,
  useDailyEntry,
  useDraftBox,
  useRoles,
  useWeeklyFocus,
  type DraftStatus,
} from "@/lib/store";

export default function DraftBox() {
  const [drafts, setDrafts] = useDraftBox();
  const [, setEntry] = useDailyEntry();
  const [weekly, setWeekly] = useWeeklyFocus();
  const [roles] = useRoles();
  const activeRoles = getActiveRoles(roles);

  const [view, setView] = useState<DraftStatus>("pending");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [roleId, setRoleId] = useState("");

  const addDraft = () => {
    if (!title.trim()) return;
    setDrafts((prev) => [
      createDraftItem({
        title,
        notes,
        status: view,
        source: "manual",
        relatedRoleId: roleId || undefined,
      }),
      ...prev,
    ]);
    setTitle("");
    setNotes("");
    setRoleId("");
    toast({ title: "已加入草稿箱", description: view === "pending" ? "待处理事项已经记下。" : "草稿想法已经记下。" });
  };

  const removeDraft = (id: string, silent = false) => {
    setDrafts((prev) => prev.filter((item) => item.id !== id));
    if (!silent) {
      toast({ title: "已删除", description: "这条草稿已从列表移除。" });
    }
  };

  const toggleStatus = (id: string) => {
    setDrafts((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "draft" ? "pending" : "draft",
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
    toast({ title: "状态已切换", description: "这条内容已经移动到另一侧。" });
  };

  const moveToToday = (id: string) => {
    const item = drafts.find((draft) => draft.id === id);
    if (!item) return;

    const taskTitle = item.notes ? `${item.title}｜${item.notes}` : item.title;
    setEntry((prev) => appendSupportTask(prev, taskTitle));
    removeDraft(id, true);
    toast({ title: "已转入今天", description: "这条内容已经进入今日支撑任务。" });
  };

  const moveToWeek = (id: string) => {
    const item = drafts.find((draft) => draft.id === id);
    if (!item) return;

    let inserted = false;
    setWeekly((prev) => {
      const result = insertIntoWeeklyBattles(prev, {
        title: item.title,
        why: item.notes,
      });
      inserted = result.inserted;
      return result.nextWeekly;
    });

    if (inserted) {
      removeDraft(id, true);
      toast({ title: "已升级为本周战役", description: "这条内容已经进入本周主线。" });
      return;
    }

    setDrafts((prev) =>
      prev.map((draft) =>
        draft.id === id
          ? {
              ...draft,
              status: "pending",
              relatedWeek: weekly.weekStart,
              relatedMonth: getMonthKey(),
              updatedAt: new Date().toISOString(),
            }
          : draft
      )
    );
    toast({ title: "已标记为本周待升格", description: "本周战役已满，先留在待处理池里。" });
  };

  const filteredDrafts = drafts
    .filter((item) => item.status === view)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <div className="mb-6 flex items-start justify-between gap-3 fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">草稿箱 / 待完成池</h1>
            <p className="text-sm text-muted-foreground">把没想清楚的、没做完的、先放下的，都放到这里。</p>
            <div className="mt-2">
              <PilotBadge />
            </div>
          </div>
          <HeaderActionLink />
        </div>

        <section className="mb-6 fade-in">
          <div className="rounded-2xl border bg-card p-4">
            <div className="mb-3 flex gap-2">
              {([
                { key: "pending" as const, label: "待处理", icon: Clock3 },
                { key: "draft" as const, label: "草稿", icon: FileText },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setView(tab.key)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    view === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDraft()}
                placeholder={view === "pending" ? "新增待处理事项..." : "新增草稿想法..."}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="补一句说明也行，不写也行..."
                className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="">关联角色（可选）</option>
                  {activeRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addDraft}
                  className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground sm:w-auto"
                >
                  新增
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3 fade-in">
          {filteredDrafts.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card/60 p-6 text-center">
              <Inbox className="mx-auto h-6 w-6 text-muted-foreground/60" />
              <p className="mt-2 text-sm text-muted-foreground">
                {view === "pending" ? "待处理池还是空的，把没收口的事先丢进来。" : "草稿箱还是空的，先把脑子里的尾巴记下来。"}
              </p>
            </div>
          ) : (
            filteredDrafts.map((item) => {
              const relatedRole = roles.find((role) => role.id === item.relatedRoleId);
              return (
                <div key={item.id} className="rounded-2xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">{item.title}</p>
                      {item.notes && (
                        <p className="text-xs leading-5 text-muted-foreground">{item.notes}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                          {item.status === "pending" ? "待处理" : "草稿"}
                        </span>
                        {item.source && (
                          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">
                            {item.source}
                          </span>
                        )}
                        {relatedRole && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                            {relatedRole.name}
                          </span>
                        )}
                        {item.relatedWeek === weekly.weekStart && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] text-orange-700">
                            本周待升格
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeDraft(item.id)}
                      className="rounded-full p-2 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => toggleStatus(item.id)}
                      className="rounded-lg border px-3 py-2 text-xs font-medium text-foreground"
                    >
                      {item.status === "pending" ? "切到草稿" : "切到待处理"}
                    </button>
                    <button
                      onClick={() => moveToToday(item.id)}
                      className="rounded-lg border px-3 py-2 text-xs font-medium text-foreground"
                    >
                      转入今天
                    </button>
                    <button
                      onClick={() => moveToWeek(item.id)}
                      className="col-span-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                    >
                      升级为本周战役
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
