import { useState, useEffect, useCallback } from "react";

export type EditorMode = "edit" | "preview";

export function useEditor() {
  const [mode, setMode] = useState<EditorMode>("edit");

  const toggle = useCallback(() => {
    setMode((prev) => (prev === "edit" ? "preview" : "edit"));
  }, []);

  // Cmd/Ctrl + E — toggle mode
  // Cmd/Ctrl + S — no-op (auto-save handles it, but prevent browser save dialog)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "e") {
        e.preventDefault();
        toggle();
      }
      if (mod && e.key === "s") {
        e.preventDefault();
        // auto-save is already debounced — this just blocks the browser dialog
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return {
    mode,
    toggle,
    isEdit: mode === "edit",
    isPreview: mode === "preview",
  };
}
