"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AIState } from "@/hooks/useAI";

type Props = {
  state: AIState;
  onSubmit: (prompt: string) => void;
  onClose: () => void;
};

export function AICommandModal({ state, onSubmit, onClose }: Props) {
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isLoading = state === "loading" || state === "streaming";

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading) onSubmit(prompt.trim());
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-w-xl bg-[#111111] border-border p-0 gap-0
                   font-mono shadow-2xl"
      >
        <DialogHeader className="px-4 pt-4 pb-3">
          <DialogTitle className="text-xs tracking-widest uppercase text-[#e63946] font-mono font-normal">
            AI Generate
          </DialogTitle>
        </DialogHeader>

        <Separator className="bg-border" />

        <div className="px-4 py-4">
          <Input
            ref={inputRef}
            autoFocus
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            disabled={isLoading}
            placeholder="Describe what to generate..."
            className="bg-transparent border-none shadow-none px-0
                       font-mono text-sm placeholder:text-muted-foreground
                       focus-visible:ring-0 h-auto text-muted-foreground"
            spellCheck={false}
          />
        </div>

        <Separator className="bg-border" />

        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
            {state === "idle" && "Enter to generate · Esc to close"}
            {state === "loading" && "Thinking..."}
            {state === "streaming" && "Writing..."}
            {state === "error" && "Something went wrong"}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-[10px] font-mono tracking-widest uppercase
                         text-muted-foreground hover:text-foreground h-auto py-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading}
              className="text-[10px] font-mono tracking-widest uppercase
                         h-auto py-1 bg-[#e63946] hover:bg-[#ff4d5a]
                         text-white border-none"
            >
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
