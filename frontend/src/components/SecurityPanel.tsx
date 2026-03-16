import { useBoardStore } from "../stores/boardStore";
import { useAuthStore } from "../stores/authStore";
import { permissionsApi } from "../lib/api";

const statusColors: Record<string, string> = {
  granted: "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
  pending: "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
  revoked: "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
  expired: "text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-700",
};

export function SecurityPanel() {
  const permissions = useBoardStore((s) => s.permissions);
  const credentials = useBoardStore((s) => s.credentials);
  const setPermissions = useBoardStore((s) => s.setPermissions);
  const apiKey = useAuthStore((s) => s.apiKey);

  const handleApprove = async (id: string) => {
    if (!apiKey) return;
    await permissionsApi.update(apiKey, id, "granted");
    const updated = await permissionsApi.list(apiKey);
    setPermissions(updated);
  };

  const handleRevoke = async (id: string) => {
    if (!apiKey) return;
    await permissionsApi.update(apiKey, id, "revoked");
    const updated = await permissionsApi.list(apiKey);
    setPermissions(updated);
  };

  const handleBypass = async () => {
    if (!apiKey) return;
    if (!window.confirm("YOLO: Grant ALL pending permissions? Think twice.")) return;
    if (!window.confirm("Are you REALLY sure? This bypasses all permission checks."))
      return;
    await permissionsApi.bypass(apiKey);
    const updated = await permissionsApi.list(apiKey);
    setPermissions(updated);
  };

  return (
    <div className="min-w-[300px] w-[300px] bg-white dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Security Panel</h3>
        <button
          onClick={handleBypass}
          className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 transition-colors font-medium"
          title="YOLO: Skip all permissions"
        >
          YOLO
        </button>
      </div>

      <div className="mb-4">
        <h4 className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Permissions
        </h4>
        <div className="flex flex-col gap-1.5">
          {permissions.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500">No permissions</p>
          )}
          {permissions.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded p-2 border border-gray-100 dark:border-transparent"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  {p.resource} : {p.action}
                </p>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${statusColors[p.status]}`}
                >
                  {p.status}
                </span>
              </div>
              {p.status === "pending" && (
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleApprove(p.id)}
                    className="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900"
                  >
                    Grant
                  </button>
                  <button
                    onClick={() => handleRevoke(p.id)}
                    className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900"
                  >
                    Deny
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Credentials
        </h4>
        <div className="flex flex-col gap-1.5">
          {credentials.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500">No stored credentials</p>
          )}
          {credentials.map((c) => (
            <div
              key={c.id}
              className="bg-gray-50 dark:bg-gray-900/50 rounded p-2 border border-gray-100 dark:border-transparent"
            >
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300">{c.label}</p>
              {c.rotation_due_at && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Rotation: {new Date(c.rotation_due_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
