import { useEffect, useRef } from "react";
import { useBoardStore } from "../stores/boardStore";

export function useWebSocket(project: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const upsertTicket = useBoardStore((s) => s.upsertTicket);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/board?project=${project}`
    );
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.ticket) {
          upsertTicket(data.ticket);
        }
      } catch {
        // ignore non-JSON
      }
    };

    ws.onclose = () => {
      // Reconnect after 3s
      setTimeout(() => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
      }, 3000);
    };

    return () => {
      ws.close();
    };
  }, [project, upsertTicket]);

  return wsRef;
}
