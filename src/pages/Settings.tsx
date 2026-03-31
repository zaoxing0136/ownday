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
      title: next.tone === "error" ? "鎿嶄綔鏈畬鎴? : "宸叉洿鏂?,
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
    showMessage({ tone: "success", text: "宸插鍑哄叏閮ㄦ暟鎹€? });
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
      showMessage({ tone: "error", text: "瀵煎叆澶辫触锛氭枃浠朵笉鏄彲璇嗗埆鐨?JSON銆? });
    }
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setMessage({
        tone: "info",
        text: "鍐嶇偣涓€娆♀€滅‘璁ゆ竻绌衡€濓紝灏变細鍒犻櫎杩欏彴璁惧涓婄殑鏈湴鏁版嵁銆?,
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
      title: "瑙掕壊宸叉柊澧?,
      description: `鈥?{name}鈥?宸插姞鍏ュ叏绔欒鑹插垪琛ㄣ€俙,
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
          name: trimmed || "鏈懡鍚嶈鑹?,
        };
      })
    );
  };

  const toggleRoleActive = (roleId: string) => {
    const currentRole = roles.find((role) => role.id === roleId);
    if (!currentRole) return;

    if (currentRole.active !== false && activeRoles.length <= 1) {
      showMessage({ tone: "info", text: "鑷冲皯淇濈暀涓€涓惎鐢ㄤ腑鐨勮鑹层€? });
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
      title: currentRole.active === false ? "瑙掕壊宸插惎鐢? : "瑙掕壊宸插仠鐢?,
      description:
        currentRole.active === false
          ? `鈥?{currentRole.name}鈥?浼氶噸鏂板嚭鐜板湪鍚勯〉闈㈤€夋嫨鍣ㄤ腑銆俙
          : `鈥?{currentRole.name}鈥?宸蹭粠鏂伴€夋嫨涓殣钘忥紝鍘嗗彶鏁版嵁涓嶅彈褰卞搷銆俙,
    });
  };

  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <div className="mb-6 fade-in">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">鏁版嵁涓庣郴缁熻缃?/h1>
              <p className="text-sm text-muted-foreground">
                鍏堜繚浣忔暟鎹紝鍐嶆妸璇曡繍琛岀増璋冨埌鏇撮『鎵嬨€?              </p>
            </div>
            <PilotBadge />
          </div>
        </div>

        <section className="mb-6 fade-in">
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">褰撳墠绯荤粺鐘舵€?/h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Pilot v0.3</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                鍚敤瑙掕壊 {activeRoles.length}
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                闅愯棌瑙掕壊 {hiddenRoleCount}
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                鏈湴浼樺厛
              </span>
            </div>
          </div>
        </section>

        <section className="mb-6 fade-in">
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">褰撳墠鏁版嵁姒傝</h2>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              <div className="rounded-xl bg-secondary/60 px-3 py-2">
                <p className="text-muted-foreground">鏃ヨ褰?/p>
                <p className="mt-1 text-base font-semibold text-foreground">{summary.dailyCount}</p>
              </div>
              <div className="rounded-xl bg-secondary/60 px-3 py-2">
                <p className="text-muted-foreground">鍛ㄤ富绾?/p>
                <p className="mt-1 text-base font-semibold text-foreground">{summary.weeklyCount}</p>
              </div>
              <div className="rounded-xl bg-secondary/60 px-3 py-2">
                <p className="text-muted-foreground">鏈堜富绾?/p>
                <p className="mt-1 text-base font-semibold text-foreground">{summary.monthlyCount}</p>
              </div>
              <div className="rounded-xl bg-secondary/60 px-3 py-2">
                <p className="text-muted-foreground">瑙掕壊鎬绘暟</p>
                <p className="mt-1 text-base font-semibold text-foreground">{summary.roleCount}</p>
              </div>
              <div className="rounded-xl bg-secondary/60 px-3 py-2">
                <p className="text-muted-foreground">鑽夌绠?/p>
                <p className="mt-1 text-base font-semibold text-foreground">{summary.draftCount}</p>
              </div>
              <div className="rounded-xl bg-secondary/60 px-3 py-2">
                <p className="text-muted-foreground">鏈潵瀹夋帓</p>
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
              <h2 className="text-sm font-medium">杞婚噺瑙掕壊绠＄悊</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              鍙洿鎺ユ敼鍚嶇О銆佸惎鍋滆鑹层€傚仠鐢ㄥ悗浼氫粠鏂伴€夋嫨閲岄殣钘忥紝浣嗗巻鍙茶褰曚粛淇濈暀銆?            </p>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRole()}
                placeholder="鏂板涓€涓鑹插悕绉?
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
              />
              <button
                onClick={addRole}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                鏂板瑙掕壊
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
                      {role.active === false ? "鍚敤" : "鍋滅敤"}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>ID: {role.id}</span>
                    <span>路</span>
                    <span>{role.active === false ? "宸查殣钘? : "鍚敤涓?}</span>
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
              <h2 className="text-sm font-medium">瀵煎嚭鍏ㄩ儴鏁版嵁</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              浼氬鍑?daily銆亀eekly銆乵onthly銆乺oles銆乨rafts銆乫uture銆?            </p>
            <button
              onClick={handleExport}
              className="mt-3 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
            >
              瀵煎嚭 JSON 澶囦唤
            </button>
          </div>

          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">瀵煎叆鏁版嵁</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              鍙敮鎸佸鍏?ownmyday 瀵煎嚭鐨?JSON銆傚鍏ユ垚鍔熷悗褰撳墠椤甸潰浼氱洿鎺ュ悓姝ワ紝涓嶅啀鏁撮〉鍒锋柊銆?            </p>
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
              閫夋嫨 JSON 鏂囦欢
            </button>
          </div>
        </section>

        <section className="mb-6 fade-in">
          <div className="rounded-2xl border border-destructive/20 bg-card p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <h2 className="text-sm font-medium text-foreground">娓呯┖鏈湴鏁版嵁</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              杩欐槸鍗遍櫓鎿嶄綔銆傚缓璁厛瀵煎嚭涓€浠藉浠斤紝鍐嶆竻绌恒€?            </p>
            <div className="mt-3 grid gap-2">
              <button
                onClick={handleReset}
                className="w-full rounded-lg bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground"
              >
                {confirmReset ? "纭娓呯┖鍏ㄩ儴鏁版嵁" : "寮€濮嬫竻绌?}
              </button>
              {confirmReset && (
                <button
                  onClick={() => {
                    setConfirmReset(false);
                    setMessage(null);
                  }}
                  className="w-full rounded-lg border px-4 py-3 text-sm font-medium text-foreground"
                >
                  鍙栨秷
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
          鍥炲埌浠婃棩椤?        </button>
      </div>
    </div>
  );
}
