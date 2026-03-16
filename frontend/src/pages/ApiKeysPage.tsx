import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiKeysApi } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { ThemeToggle } from "../components/ThemeToggle";
import type { ApiKeyInfo } from "../lib/types";

export function ApiKeysPage() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setApiKey = useAuthStore((s) => s.setApiKey);
  const logout = useAuthStore((s) => s.logout);
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [newName, setNewName] = useState("");
  const [newProject, setNewProject] = useState("default");
  const [justCreated, setJustCreated] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
      return;
    }
    apiKeysApi.list(accessToken).then(setKeys).catch(() => {
      logout();
      navigate("/login");
    });
  }, [accessToken, navigate, logout]);

  const handleCreate = async () => {
    if (!accessToken || !newName.trim()) return;
    const result = await apiKeysApi.create(accessToken, {
      name: newName.trim(),
      project_name: newProject.trim() || "default",
    });
    setJustCreated(result.raw_key);
    setKeys((prev) => [...prev, result]);
    setNewName("");
  };

  const handleSelect = (key: ApiKeyInfo) => {
    const raw = prompt("Enter the raw API key for: " + key.name);
    if (raw) {
      setApiKey(raw);
      navigate("/board");
    }
  };

  const handleUseJustCreated = () => {
    if (justCreated) {
      setApiKey(justCreated);
      setJustCreated(null);
      navigate("/board");
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    await apiKeysApi.delete(accessToken, id);
    setKeys((prev) => prev.filter((k) => k.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">API Keys</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm dark:shadow-none border border-gray-200 dark:border-transparent">
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
            Create New Key
          </h2>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Key name"
              className="flex-1 bg-gray-100 dark:bg-gray-900 text-sm text-gray-900 dark:text-white rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 border border-gray-200 dark:border-transparent"
            />
            <input
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              placeholder="Project"
              className="w-32 bg-gray-100 dark:bg-gray-900 text-sm text-gray-900 dark:text-white rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 border border-gray-200 dark:border-transparent"
            />
            <button
              onClick={handleCreate}
              className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </div>

        {justCreated && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-700 dark:text-green-300 mb-2">
              Key created! Copy it now — it won't be shown again:
            </p>
            <code className="text-xs text-green-600 dark:text-green-400 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded break-all block mb-2">
              {justCreated}
            </code>
            <button
              onClick={handleUseJustCreated}
              className="text-sm px-3 py-1 rounded bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600"
            >
              Use this key now
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {keys.map((key) => (
            <div
              key={key.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between shadow-sm dark:shadow-none border border-gray-200 dark:border-transparent"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{key.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Project: {key.project_name} | Actions: {key.action_count}/1000
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelect(key)}
                  className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Select
                </button>
                <button
                  onClick={() => handleDelete(key.id)}
                  className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
