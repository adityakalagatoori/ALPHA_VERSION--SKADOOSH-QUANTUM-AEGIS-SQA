import { useEffect, useState, useRef } from "react";
import { WS_BASE } from "../lib/api";

const WS_URL = `${WS_BASE}/ws/security-feed`;

export default function useSecurityFeed() {
  const [events, setEvents] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const retryCount = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let unmounted = false;

    function connect() {
      if (unmounted) return;

      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("[DRAGON WARRIOR] WS CONNECTED");
        setConnected(true);
        retryCount.current = 0;
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setEvents((prev) => [parsed, ...prev.slice(0, 99)]);
        } catch (err) {
          console.error(err);
        }
      };

      socket.onclose = () => {
        console.log("[DRAGON WARRIOR] WS CLOSED");
        setConnected(false);
        if (!unmounted && retryCount.current < 5) {
          const delay = Math.pow(2, retryCount.current) * 1000;
          retryCount.current++;
          console.log(`[DRAGON WARRIOR] Reconnecting in ${delay}ms (attempt ${retryCount.current})`);
          setTimeout(connect, delay);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    }

    connect();

    return () => {
      unmounted = true;
      socketRef.current?.close();
    };
  }, []);

  return { connected, events };
}
