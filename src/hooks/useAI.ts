import { useState, useCallback, useRef } from "react";

export type AIState = "idle" | "loading" | "streaming" | "error";

export function useAI() {
  const [state, setState] = useState<AIState>("idle");
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (
      prompt: string,
      documentContext: string,
      onChunk: (chunk: string) => void,
      onDone: (full: string) => void,
    ) => {
      try {
        setState("loading");
        abortRef.current = new AbortController();

        const res = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, documentContext }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error("AI request failed");
        if (!res.body) throw new Error("No response body");

        setState("streaming");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          onChunk(chunk);
        }

        setState("idle");
        setOpen(false);
        onDone(full);
      } catch (err: any) {
        if (err.name === "AbortError") {
          setState("idle");
          return;
        }
        setState("error");
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState("idle");
    setOpen(false);
  }, []);

  return { state, open, setOpen, generate, cancel };
}
