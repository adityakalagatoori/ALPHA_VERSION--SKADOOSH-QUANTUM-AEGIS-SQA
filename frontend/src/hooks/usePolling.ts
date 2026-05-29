import { useEffect, useRef, useState } from "react";

export function usePolling<T>(
  fn: () => Promise<{ data: unknown; error: string | null }>,
  interval: number,
  enabled = true
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = async () => {
    setLoading(true);
    const result = await fn();
    setData(result.data as T | null);
    setError(result.error);
    setLoading(false);
  };

  useEffect(() => {
    if (!enabled) return;
    run();
    timer.current = setInterval(run, interval);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [enabled, interval]);

  return { data, error, loading, refresh: run };
}
