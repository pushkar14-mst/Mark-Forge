"use client";

import { useRef, useEffect, useCallback } from "react";

type Props = {
  content: string;
  onChange: (value: string) => void;
  onAITrigger: () => void;
};

export function Editor({ content, onChange, onAITrigger }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect /ai command
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Tab → insert 2 spaces
      if (e.key === "Tab") {
        e.preventDefault();
        const el = e.currentTarget;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const next =
          content.substring(0, start) + "  " + content.substring(end);
        onChange(next);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + 2;
        });
      }
    },
    [content, onChange],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      onChange(val);

      // Trigger AI modal when user types /ai on a new line
      const lines = val.split("\n");
      const lastLine = lines[lines.length - 1].trim();
      if (lastLine === "/ai") {
        // Strip the /ai command from content before opening modal
        const stripped = lines.slice(0, -1).join("\n");
        onChange(stripped);
        onAITrigger();
      }
    },
    [onChange, onAITrigger],
  );

  // Focus editor on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="h-full w-full overflow-auto">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        className="w-full h-full min-h-full resize-none bg-transparent outline-none
                   text-[#c9c9c9] font-mono text-sm leading-7
                   px-[max(2rem,calc(50%-36rem))] py-12
                   placeholder:text-[#2a2a2a] caret-[#e63946]"
        placeholder={
          "Start writing...\n\nType /ai on a new line to generate content."
        }
      />
    </div>
  );
}
