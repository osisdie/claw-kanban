const BASE = "/api";

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; refresh_token: string }>(
      "/auth/token",
      { method: "POST", body: JSON.stringify(data) }
    ),
  googleAuth: (token: string) =>
    request<{ access_token: string; refresh_token: string }>(
      "/auth/google",
      { method: "POST", body: JSON.stringify({ token }) }
    ),
};

// API Keys
export const apiKeysApi = {
  list: (token: string) =>
    request<import("./types").ApiKeyInfo[]>("/api-keys", {}, token),
  create: (token: string, data: { name: string; project_name?: string }) =>
    request<import("./types").ApiKeyInfo & { raw_key: string }>(
      "/api-keys",
      { method: "POST", body: JSON.stringify(data) },
      token
    ),
  delete: (token: string, id: string) =>
    request(`/api-keys/${id}`, { method: "DELETE" }, token),
};

// Tickets
export const ticketsApi = {
  list: (apiKey: string, status?: string[]) => {
    const params = status ? `?${status.map((s) => `status=${s}`).join("&")}` : "";
    return request<import("./types").Ticket[]>(`/tickets${params}`, {}, apiKey);
  },
  create: (apiKey: string, data: { title: string; description?: string; tags?: string[]; assignee?: string }) =>
    request<import("./types").Ticket>(
      "/tickets",
      { method: "POST", body: JSON.stringify(data) },
      apiKey
    ),
  update: (apiKey: string, id: string, data: Record<string, unknown>) =>
    request<import("./types").Ticket>(
      `/tickets/${id}`,
      { method: "PATCH", body: JSON.stringify(data) },
      apiKey
    ),
  move: (apiKey: string, id: string, status: string, reason?: string) =>
    request<import("./types").Ticket>(
      `/tickets/${id}/move`,
      { method: "POST", body: JSON.stringify({ status, reason }) },
      apiKey
    ),
  addComment: (apiKey: string, id: string, data: { author_type: string; body: string }) =>
    request<import("./types").Comment>(
      `/tickets/${id}/comments`,
      { method: "POST", body: JSON.stringify(data) },
      apiKey
    ),
  getComments: (apiKey: string, id: string) =>
    request<import("./types").Comment[]>(`/tickets/${id}/comments`, {}, apiKey),
  getHistory: (apiKey: string, id: string) =>
    request<import("./types").HistoryEntry[]>(`/tickets/${id}/history`, {}, apiKey),
};

// Permissions
export const permissionsApi = {
  list: (apiKey: string) =>
    request<import("./types").Permission[]>("/permissions", {}, apiKey),
  create: (apiKey: string, data: { resource: string; action: string }) =>
    request<import("./types").Permission>(
      "/permissions",
      { method: "POST", body: JSON.stringify(data) },
      apiKey
    ),
  update: (apiKey: string, id: string, status: string) =>
    request<import("./types").Permission>(
      `/permissions/${id}`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      apiKey
    ),
  bypass: (apiKey: string) =>
    request("/permissions/bypass", {
      method: "POST",
      body: JSON.stringify({ confirm: true }),
    }, apiKey),
  listCredentials: (apiKey: string) =>
    request<import("./types").Credential[]>("/permissions/credentials", {}, apiKey),
};
