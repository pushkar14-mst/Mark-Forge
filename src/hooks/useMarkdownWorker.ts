import { useEffect, useRef, useCallback } from "react";

type PendingResolve = {
  resolve: (html: string) => void;
  reject: (err: string) => void;
};

export function useMarkdownWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingResolve>>(new Map());

  useEffect(() => {
    // Plain string URL — worker lives in public/, bundler never touches it
    const worker = new Worker("/workers/markdown.worker.js", {
      type: "module",
    });

    worker.onmessage = (
      e: MessageEvent<{
        id: string;
        html: string | null;
        error: string | null;
      }>,
    ) => {
      const { id, html, error } = e.data;
      const pending = pendingRef.current.get(id);
      if (!pending) return;
      pendingRef.current.delete(id);
      if (error || !html) {
        pending.reject(error ?? "Unknown error");
      } else {
        pending.resolve(html);
      }
    };

    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const parse = useCallback((markdown: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      pendingRef.current.set(id, { resolve, reject });
      workerRef.current?.postMessage({ id, markdown });
    });
  }, []);

  return { parse };
}
