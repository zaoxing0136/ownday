import { useRef, useState } from "react";
import {
  Database,
  Download,
  EyeOff,
  Plus,
  RotateCcw,
  Settings2,
  ShieldAlert,
  Upload,
} from "lucide-react";
import PilotBadge from "@/components/PilotBadge";
import { toast } from "@/hooks/use-toast";
import {
  buildOwnMyDayBackup,
  createRole,
  getActiveRoles,
  getOwnMyDayStorageSummary,
  importOwnMyDayBackup,
  resetOwnMyDayStorage,
  useRoles,
} from "@/lib/store";

type MessageState = {
  tone: "success" | "error" | "info";
  text: string;
};

export default function Settings() {
  const summary = getOwnMyDayStorageSummary();
  const [roles, setRoles] = useRoles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const activeRoles = getActiveRoles(roles);
  const hiddenRoleCount = roles.length - activeRoles.length;

  const showMessage = (next: MessageState) => {
    setMessage(next);
    toast({
      title: next.tone === "error" ? "操作未完成" : "已更新",
      description: next.text,
      variant: next.tone === "error" ? "destructive" : "default",
    });
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleExport = () => {
    const payload = buildOwnMyDayBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ownmyday-backup-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showMessage({ tone: "success", text: "已导出全部数据。" });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const result = importOwnMyDayBackup(parsed);
      showMessage({ tone: result.ok ? "success" : "error", text: result.message });
      if (result.ok) {
        setConfirmReset(false);
      }
    } catch {
      showMessage({ tone: "error", text: "导入失败：文件不是可识别的 JSON。" });
    }
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setMessage({
        tone: "info",
        text: "再点一次“确认清空”，就会删除这台设备上的本地数据。",
      });
      return;
    }

    const result = resetOwnMyDayStorage();
    showMessage({ tone: result.ok ? "success" : "error", text: result.message });
    if (result.ok) {
      setConfirmReset(false);
      setNewRoleName("");
    }
  };

  const addRole = () => {
    const name = newRoleName.trim();
    if (!name) return;

    setRoles((prev) => [...prev, createRole(name)]);
    setNewRoleName("");
    toast({
      title: "角色已新增",
      description: `“${name}” 已加入全站角色列表。`,
    });
  };

  const updateRoleName = (roleId: string, name: string) => {
    setRoles((prev) =>
      prev.map((role) =>
        role.id === roleId
          ? {
              ...role,
              name,
            }
          : role
      )
    );
  };

  const handleRoleNameBlur = (roleId: string) => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== roleId) return role;
        const trimmed = role.name.trim();
        return {
          ...role,
          name: trimmed || "未命名角色",
        };
      })
    );
  };

  const toggleRoleActive = (roleId: string) => {
    const currentRole = roles.find((role) => role.id === roleId);
    if (!currentRole) return;

    if (currentRole.active !== false && activeRoles.length <= 1) {
      showMessage({ tone: "info", text: "至少保留一个启用中的角色。" });
      return;
    }

    setRoles((prev) =>
      prev.map((role) =>
        role.id === roleId
          ? {
              ...role,
              active: role.active === false,
            }
          : role
      )
    );

    toast({
      title: currentRole.active === false ? "角色已启用" : "角色已停用",
      description:
        currentRole.active === false
          ? `“${currentRole.name}” 会重新出现在各页面选择器中。`
          : `“${currentRole.name}” 已从新选择中隐藏，历史数据不受影响。`,
    });
  };

  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <header className="page-header fade-in">
          <div>
            <p className="page-caption mt-0">先保住数据，再慢慢调顺手。</p>
            <h1 className="page-title mt-2">设置</h1>
            <div className="page-badges">
              <PilotBadge />
            </div>
          </div>
        </header>

        <section className="mb-6 fade-in">
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">当前系统状态</h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Pilot v0.5</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                启用角色 {activeRoles.length}
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                隐藏角色 {hiddenRoleCount}
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                本地优先
              </span>
            </div>
          </div>
        </section>

        <section className="mb-6 fade-in">
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">当前数据概览</h2>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              <div className="rounded-xl bg-secondary/60 px-3 py-2">
                <p className="text-muted-foreground">日记录</p>
                <p className="mt-1 text-base font-semibold text-foreground">{summary.dailyCount}</p>
              </div>
              <div className="rounded-xl bg-secondary/60 px-3 py-2">
                <p className="text-muted-foreground">周主线</p>
                <p className="mt-1 text-base font-semibold text-foreground">{summary.weeklyCount}</p>
              </div>
              <div className="rounded-xl bg-secondary/60 px-3 py-2">
                <p className="text-muted-foreground">月主线</p>
                <p className="mt-1 text-base font-semibold text-foreground">{summary.monthlyCount}</p>
              </div>
              <div className="rounded-xl bg-secondary/60 px-3 py-2">
                <p className="text-muted-foreground">角色总数</p>
                <p className="mt-1 text-base font-semibold text-foreground">{summary.roleCount}</p>
              </div>
              <div className="rounded-xl bg-secondary/60 px-3 py-2">
                <p className="text-muted-foreground">草稿箱</p>
                <p className="mt-1 text-base font-semibold text-foreground">{summary.draftCount}</p>
              </div>
              <div className="rounded-xl bg-secondary/60 px-3 py-2">
                <p className="text-muted-foreground">未来安排</p>
                <p className="mt-1 text-base font-semibold text-foreground">{summary.futureCount}</p>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <section className="mb-6 fade-in">
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                message.tone === "success"
                  ? "border-success/30 bg-success/10 text-success"
                  : message.tone === "error"
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-primary/20 bg-primary/5 text-foreground"
              }`}
            >
              {message.text}
            </div>
          </section>
        )}

        <section className="mb-6 fade-in">
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">轻量角色管理</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              可直接改名称、启停角色。停用后会从新选择里隐藏，但历史记录仍保留。
            </p>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRole()}
                placeholder="新增一个角色名称"
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
              />
              <button
                onClick={addRole}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                新增角色
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`rounded-xl border p-3 ${
                    role.active === false ? "bg-secondary/30 opacity-80" : "bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={role.name}
                      onChange={(e) => updateRoleName(role.id, e.target.value)}
                      onBlur={() => handleRoleNameBlur(role.id)}
                      className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <button
                      onClick={() => toggleRoleActive(role.id)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium ${
                        role.active === false
                          ? "border bg-card text-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {role.active === false ? "启用" : "停用"}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>ID: {role.id}</span>
                    <span>·</span>
                    <span>{role.active === false ? "已隐藏" : "启用中"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-6 fade-in space-y-3">
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">导出全部数据</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              会导出 daily、weekly、monthly、roles、drafts、future。
            </p>
            <button
              onClick={handleExport}
              className="mt-3 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
            >
              导出 JSON 备份
            </button>
          </div>

          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">导入数据</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              只支持导入 ownmyday 导出的 JSON。导入成功后当前页面会直接同步，不再整页刷新。
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={triggerImport}
              className="mt-3 w-full rounded-lg border px-4 py-3 text-sm font-medium text-foreground"
            >
              选择 JSON 文件
            </button>
          </div>
        </section>

        <section className="mb-6 fade-in">
          <div className="rounded-2xl border border-destructive/20 bg-card p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <h2 className="text-sm font-medium text-foreground">清空本地数据</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              这是危险操作。建议先导出一份备份，再清空。
            </p>
            <div className="mt-3 grid gap-2">
              <button
                onClick={handleReset}
                className="w-full rounded-lg bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground"
              >
                {confirmReset ? "确认清空全部数据" : "开始清空"}
              </button>
              {confirmReset && (
                <button
                  onClick={() => {
                    setConfirmReset(false);
                    setMessage(null);
                  }}
                  className="w-full rounded-lg border px-4 py-3 text-sm font-medium text-foreground"
                >
                  取消
                </button>
              )}
            </div>
          </div>
        </section>

        <button
          onClick={() => window.location.assign("/")}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          回到今日页
        </button>
      </div>
    </div>
  );
}
