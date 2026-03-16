import { useState } from "react";
import { ticketsApi } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { useBoardStore } from "../stores/boardStore";

interface Props {
  onClose: () => void;
}

export function CreateTicketModal({ onClose }: Props) {
  const apiKey = useAuthStore((s) => s.apiKey);
  const upsertTicket = useBoardStore((s) => s.upsertTicket);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [assignee, setAssignee] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!apiKey || !title.trim()) return;
    setError("");
    try {
      const ticket = await ticketsApi.create(apiKey, {
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.trim() ? tags.split(",").map((t) => t.trim()) : undefined,
        assignee: assignee.trim() || undefined,
      });
      upsertTicket(ticket);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl dark:shadow-none border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Ticket</h2>
        {error && (
          <p className="text-sm text-red-500 mb-3">{error}</p>
        )}
        <div className="flex flex-col gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="bg-gray-100 dark:bg-gray-900 text-sm text-gray-900 dark:text-white rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 border border-gray-200 dark:border-transparent"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="bg-gray-100 dark:bg-gray-900 text-sm text-gray-900 dark:text-white rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 resize-none border border-gray-200 dark:border-transparent"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma-separated)"
            className="bg-gray-100 dark:bg-gray-900 text-sm text-gray-900 dark:text-white rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 border border-gray-200 dark:border-transparent"
          />
          <input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Assignee"
            className="bg-gray-100 dark:bg-gray-900 text-sm text-gray-900 dark:text-white rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 border border-gray-200 dark:border-transparent"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
