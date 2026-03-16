import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DndContext, DragEndEvent, closestCorners } from "@dnd-kit/core";
import { useAuthStore } from "../stores/authStore";
import { useBoardStore } from "../stores/boardStore";
import { ticketsApi, permissionsApi } from "../lib/api";
import { useWebSocket } from "../hooks/useWebSocket";
import { Column } from "../components/Column";
import { SecurityPanel } from "../components/SecurityPanel";
import { TicketDetailModal } from "../components/TicketDetailModal";
import { CreateTicketModal } from "../components/CreateTicketModal";
import { ThemeToggle } from "../components/ThemeToggle";
import type { Ticket, TicketStatus } from "../lib/types";
import { COLUMNS } from "../lib/types";

export function BoardPage() {
  const navigate = useNavigate();
  const apiKey = useAuthStore((s) => s.apiKey);
  const logout = useAuthStore((s) => s.logout);
  const {
    tickets,
    setTickets,
    setPermissions,
    setCredentials,
    viewMode,
    toggleViewMode,
  } = useBoardStore();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useWebSocket("default");

  useEffect(() => {
    if (!apiKey) {
      navigate("/keys");
      return;
    }
    ticketsApi.list(apiKey).then(setTickets);
    permissionsApi.list(apiKey).then(setPermissions);
    permissionsApi.listCredentials(apiKey).then(setCredentials);
  }, [apiKey, navigate, setTickets, setPermissions, setCredentials]);

  const ticketsByStatus = (status: TicketStatus) =>
    tickets
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);

  const assignees = [...new Set(tickets.map((t) => t.assignee || "Unassigned"))];

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!apiKey) return;
    const { active, over } = event;
    if (!over) return;

    const ticket = tickets.find((t) => t.id === active.id);
    if (!ticket) return;

    const newStatus = over.id as TicketStatus;
    if (ticket.status === newStatus) return;

    try {
      const updated = await ticketsApi.move(apiKey, ticket.id, newStatus);
      useBoardStore.getState().upsertTicket(updated);
    } catch {
      ticketsApi.list(apiKey).then(setTickets);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between shadow-sm dark:shadow-none">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Claw Kanban</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={toggleViewMode}
            className="text-xs px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {viewMode === "tag" ? "Swimlane" : "Tag"} View
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            + New Ticket
          </button>
          <button
            onClick={() => navigate("/keys")}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Keys
          </button>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-4">
        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          {viewMode === "tag" ? (
            <div className="flex gap-4">
              {COLUMNS.map((col) => (
                <Column
                  key={col}
                  status={col}
                  tickets={ticketsByStatus(col)}
                  onTicketClick={setSelectedTicket}
                />
              ))}
              <SecurityPanel />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {assignees.map((assignee) => (
                <div key={assignee}>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-1">
                    {assignee}
                  </h3>
                  <div className="flex gap-4">
                    {COLUMNS.map((col) => (
                      <Column
                        key={col}
                        status={col}
                        tickets={ticketsByStatus(col).filter(
                          (t) => (t.assignee || "Unassigned") === assignee
                        )}
                        onTicketClick={setSelectedTicket}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <SecurityPanel />
            </div>
          )}
        </DndContext>
      </main>

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
      {showCreate && (
        <CreateTicketModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
