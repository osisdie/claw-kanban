import { useEffect, useState } from "react";
import type { Comment, HistoryEntry, Ticket } from "../lib/types";
import { ticketsApi } from "../lib/api";
import { useAuthStore } from "../stores/authStore";

interface Props {
  ticket: Ticket;
  onClose: () => void;
}

export function TicketDetailModal({ ticket, onClose }: Props) {
  const apiKey = useAuthStore((s) => s.apiKey);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [newComment, setNewComment] = useState("");
  const [tab, setTab] = useState<"comments" | "history">("comments");

  useEffect(() => {
    if (!apiKey) return;
    ticketsApi.getComments(apiKey, ticket.id).then(setComments);
    ticketsApi.getHistory(apiKey, ticket.id).then(setHistory);
  }, [apiKey, ticket.id]);

  const handleAddComment = async () => {
    if (!apiKey || !newComment.trim()) return;
    const comment = await ticketsApi.addComment(apiKey, ticket.id, {
      author_type: "human",
      body: newComment.trim(),
    });
    setComments((prev) => [...prev, comment]);
    setNewComment("");
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl dark:shadow-none border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.title}</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Status: {ticket.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white text-xl"
          >
            x
          </button>
        </div>

        {ticket.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{ticket.description}</p>
        )}

        {ticket.tags && ticket.tags.length > 0 && (
          <div className="flex gap-1 mb-4 flex-wrap">
            {ticket.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-transparent"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
          <button
            onClick={() => setTab("comments")}
            className={`text-sm px-2 py-1 rounded ${tab === "comments" ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}
          >
            Comments ({comments.length})
          </button>
          <button
            onClick={() => setTab("history")}
            className={`text-sm px-2 py-1 rounded ${tab === "history" ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}
          >
            History ({history.length})
          </button>
        </div>

        {tab === "comments" && (
          <div>
            <div className="flex flex-col gap-2 mb-3 max-h-[200px] overflow-y-auto">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={`rounded p-2 text-sm ${
                    c.author_type === "agent"
                      ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500"
                      : "bg-gray-50 dark:bg-gray-700/50 border-l-2 border-gray-400 dark:border-gray-500"
                  }`}
                >
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span className="font-medium">{c.author_type}</span>
                    <span>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200">{c.body}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 bg-gray-100 dark:bg-gray-900 text-sm text-gray-900 dark:text-white rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 border border-gray-200 dark:border-transparent"
              />
              <button
                onClick={handleAddComment}
                className="text-sm px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {history.map((h) => (
              <div key={h.id} className="bg-gray-50 dark:bg-gray-900/50 rounded p-2 text-sm border border-gray-100 dark:border-transparent">
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="text-gray-400 dark:text-gray-500">{h.from_status}</span>
                  {" -> "}
                  <span className="text-gray-900 dark:text-white font-medium">{h.to_status}</span>
                </p>
                {h.reason && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{h.reason}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {new Date(h.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
