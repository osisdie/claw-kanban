import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { ThemeToggle } from "../components/ThemeToggle";

export function LoginPage() {
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await authApi.register({ email, password, name });
      }
      const result = await authApi.login({ email, password });
      setAccessToken(result.access_token);
      navigate("/keys");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 w-full max-w-sm shadow-lg dark:shadow-none">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Claw Kanban
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isRegister && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="bg-gray-100 dark:bg-gray-900 text-sm text-gray-900 dark:text-white rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 border border-gray-200 dark:border-transparent"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="bg-gray-100 dark:bg-gray-900 text-sm text-gray-900 dark:text-white rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 border border-gray-200 dark:border-transparent"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="bg-gray-100 dark:bg-gray-900 text-sm text-gray-900 dark:text-white rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 border border-gray-200 dark:border-transparent"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {isRegister ? "Register" : "Login"}
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {isRegister
              ? "Already have an account? Login"
              : "No account? Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
