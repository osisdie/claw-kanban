import type { Ticket } from "../lib/types";

const statusColors: Record<string, string> = {
  TODO: "border-l-blue-500",
  Doing: "border-l-sky-500",
  "Pending Confirm": "border-l-orange-500",
  Testing: "border-l-purple-500",
  Done: "border-l-green-500",
};

interface Props {
  ticket: Ticket;
  onClick: (ticket: Ticket) => void;
}

export function TicketCard({ ticket, onClick }: Props) {
  return (
    <div
      onClick={() => onClick(ticket)}
      className={`bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 ${statusColors[ticket.status] || "border-l-gray-400"} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700 border-l-4`}
    >
      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{ticket.title}</h4>
      {ticket.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {ticket.description}
        </p>
      )}
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {ticket.tags?.map((tag) => (
          <span
            key={tag}
            className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-transparent"
          >
            {tag}
          </span>
        ))}
      </div>
      {ticket.assignee && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">@ {ticket.assignee}</p>
      )}
    </div>
  );
}
