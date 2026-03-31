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
import { cn } from "@/lib/utils";

export default function DraftBox() {
  const [drafts, setDrafts] = useDraftBox();
  const [, setEntry] = useDailyEntry();
  const [weekly, setWeekly] = useWeeklyFocus();
  const [roles] = useRoles();
  const activeRoles = getActiveRoles(roles);

  const [view, setView] = useState<DraftStatus>("pending");
  const [title, setTitle] = useState("");
  const [roleId, setRoleId] = useState("");

  const addDraft = () => {
    if (!title.trim()) return;

    setDrafts((prev) => [
      createDraftItem({
        title,
        status: view,
        source: "manual",
        relatedRoleId: roleId || undefined,
      }),
      ...prev,
    ]);

    setTitle("");
    setRoleId("");
    toast({ title: "已记下", description: view === "pending" ? "放进待处理了。" : "放进草稿了。" });
  };

  const removeDraft = (id: string, silent = false) => {
    setDrafts((prev) => prev.filter((item) => item.id !== id));
    if (!silent) {
      toast({ title: "已删除", description: "这条内容已移除。" });
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
    toast({ title: "已切换", description: "它已经换到另一侧。" });
  };

  const moveToToday = (id: string) => {
    const item = drafts.find((draft) => draft.id === id);
    if (!item) return;

    setEntry((prev) => appendSupportTask(prev, item.title));
    removeDraft(id, true);
    toast({ title: "已转入今天", description: "它已经进入今天的支撑任务。" });
  };

  const moveToWeek = (id: string) => {
    const item = drafts.find((draft) => draft.id === id);
    if (!item) return;

    let inserted = false;
    setWeekly((prev) => {
      const result = insertIntoWeeklyBattles(prev, {
        title: item.title,
      });
      inserted = result.inserted;
      return result.nextWeekly;
    });

    if (inserted) {
      removeDraft(id, true);
      toast({ title: "已升级到本周", description: "它已经进入本周三件关键事。" });
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
    toast({ title: "先留在池子里", description: "本周三件事已满，先不硬塞进去。" });
  };

  const filteredDrafts = drafts
    .filter((item) => item.status === view)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <header className="page-header fade-in">
          <div>
            <p className="page-caption mt-0">先放这里，等你决定要不要处理。</p>
            <h1 className="page-title mt-2">草稿池</h1>
            <div className="page-badges">
              <PilotBadge />
            </div>
          </div>
          <HeaderActionLink />
        </header>

        <section className="section-block fade-in">
          <div className="mb-3 flex gap-2">
            {[
              { key: "pending" as const, label: "待处理", icon: Clock3 },
              { key: "draft" as const, label: "草稿", icon: FileText },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  view === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

          <div className="surface-card px-4 py-4">
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && addDraft()}
              placeholder={view === "pending" ? "加一条待处理" : "加一条草稿"}
              className="w-full border-none bg-transparent px-0 py-0 text-sm font-medium shadow-none outline-none placeholder:text-muted-foreground/45 focus-visible:shadow-none"
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={roleId}
                onChange={(event) => setRoleId(event.target.value)}
                className="input-surface w-full flex-1 rounded-xl px-3 py-2.5 text-sm"
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
                className="rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_14px_20px_-16px_hsl(var(--primary)/0.35)]"
              >
                新增
              </button>
            </div>
          </div>
        </section>

        <section className="fade-in">
          <div className="section-bar">
            <h2 className="section-title">{view === "pending" ? "待处理" : "草稿"}</h2>
          </div>
          <div className="space-y-2">
          {filteredDrafts.length === 0 ? (
            <div className="stack-card border-dashed bg-white/55 text-center text-sm text-muted-foreground">
              <Inbox className="mx-auto mb-2 h-5 w-5" />
              这里现在还是空的。
            </div>
          ) : (
            filteredDrafts.map((item) => {
              const relatedRole = roles.find((role) => role.id === item.relatedRoleId);
              return (
                <div key={item.id} className="stack-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      {item.notes && (
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.notes}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="glass-chip">
                          {item.status === "pending" ? "待处理" : "草稿"}
                        </span>
                        {relatedRole && <span className="glass-chip">{relatedRole.name}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => moveToToday(item.id)}
                      className="shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-[0_14px_20px_-16px_hsl(var(--primary)/0.35)]"
                    >
                      转入今天
                    </button>
                  </div>

                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                      更多
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      <button
                        onClick={() => toggleStatus(item.id)}
                        className="font-medium text-foreground"
                      >
                        {item.status === "pending" ? "切到草稿" : "切到待处理"}
                      </button>
                      <button
                        onClick={() => moveToWeek(item.id)}
                        className="font-medium text-primary"
                      >
                        升级到本周
                      </button>
                      <button
                        onClick={() => removeDraft(item.id)}
                        className="inline-flex items-center gap-1 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        删除
                      </button>
                    </div>
                  </details>
                </div>
              );
            })
          )}
          </div>
        </section>
      </div>
    </div>
  );
}
