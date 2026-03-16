export type TicketStatus =
  | "TODO"
  | "Doing"
  | "Pending Confirm"
  | "Testing"
  | "Done";

export const COLUMNS: TicketStatus[] = [
  "TODO",
  "Doing",
  "Pending Confirm",
  "Testing",
  "Done",
];

export interface Ticket {
  id: string;
  api_key_id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  order: number;
  tags: string[] | null;
  assignee: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  ticket_id: string;
  author_type: "agent" | "human";
  author_id: string;
  body: string;
  created_at: string;
}

export interface HistoryEntry {
  id: string;
  ticket_id: string;
  from_status: TicketStatus;
  to_status: TicketStatus;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

export interface Permission {
  id: string;
  api_key_id: string;
  resource: string;
  action: string;
  status: "pending" | "granted" | "revoked" | "expired";
  expires_at: string | null;
  granted_by: string | null;
  metadata_: Record<string, unknown> | null;
  created_at: string;
}

export interface Credential {
  id: string;
  api_key_id: string;
  label: string;
  rotation_due_at: string | null;
  last_accessed_at: string | null;
  created_at: string;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  project_name: string;
  action_count: number;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  raw_key?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
}
