import { create } from "zustand";
import type { Credential, Permission, Ticket } from "../lib/types";

type ViewMode = "tag" | "swimlane";

interface BoardState {
  tickets: Ticket[];
  permissions: Permission[];
  credentials: Credential[];
  viewMode: ViewMode;
  setTickets: (tickets: Ticket[]) => void;
  upsertTicket: (ticket: Ticket) => void;
  setPermissions: (permissions: Permission[]) => void;
  setCredentials: (credentials: Credential[]) => void;
  toggleViewMode: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  tickets: [],
  permissions: [],
  credentials: [],
  viewMode: "tag",
  setTickets: (tickets) => set({ tickets }),
  upsertTicket: (ticket) =>
    set((state) => {
      const idx = state.tickets.findIndex((t) => t.id === ticket.id);
      if (idx >= 0) {
        const next = [...state.tickets];
        next[idx] = ticket;
        return { tickets: next };
      }
      return { tickets: [...state.tickets, ticket] };
    }),
  setPermissions: (permissions) => set({ permissions }),
  setCredentials: (credentials) => set({ credentials }),
  toggleViewMode: () =>
    set((state) => ({
      viewMode: state.viewMode === "tag" ? "swimlane" : "tag",
    })),
}));
