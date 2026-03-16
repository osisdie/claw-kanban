import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Ticket, TicketStatus } from "../lib/types";
import { SortableTicketCard } from "./SortableTicketCard";

const columnColors: Record<string, string> = {
  TODO: "bg-blue-50 dark:bg-blue-900/30",
  Doing: "bg-cyan-100 dark:bg-cyan-900/30",
  "Pending Confirm": "bg-orange-100 dark:bg-orange-900/30",
  Testing: "bg-purple-50 dark:bg-purple-900/30",
  Done: "bg-green-50 dark:bg-green-900/30",
};

interface Props {
  status: TicketStatus;
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
}

export function Column({ status, tickets, onTicketClick }: Props) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-[280px] rounded-xl ${columnColors[status] || "bg-gray-100 dark:bg-gray-800/30"} p-3 border border-gray-200/50 dark:border-transparent`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{status}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-500 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-transparent">
          {tickets.length}
        </span>
      </div>
      <SortableContext
        items={tickets.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 flex-1 min-h-[100px]">
          {tickets.map((ticket) => (
            <SortableTicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={onTicketClick}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
