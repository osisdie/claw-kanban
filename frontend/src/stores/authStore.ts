import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  apiKey: string | null;
  setAccessToken: (token: string | null) => void;
  setApiKey: (key: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem("access_token"),
  apiKey: localStorage.getItem("api_key"),
  setAccessToken: (token) => {
    if (token) localStorage.setItem("access_token", token);
    else localStorage.removeItem("access_token");
    set({ accessToken: token });
  },
  setApiKey: (key) => {
    if (key) localStorage.setItem("api_key", key);
    else localStorage.removeItem("api_key");
    set({ apiKey: key });
  },
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("api_key");
    set({ accessToken: null, apiKey: null });
  },
}));
