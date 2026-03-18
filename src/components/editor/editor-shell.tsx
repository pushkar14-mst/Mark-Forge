"use client";

import { useEditor } from "@/hooks/useEditor";
import { useDocument } from "@/hooks/useDocument";
import { useAI } from "@/hooks/useAI";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { AICommandModal } from "./ai-command-modal";
import { Editor } from "./editor";
import { Preview } from "./preview";
import { RiShareLine, RiCheckLine, RiFileCopyLine } from "react-icons/ri";

type Props = {
  documentId: string;
};

export function EditorShell({ documentId }: Props) {
  const { document, loading, saving, saveError, update, toggleShare } =
    useDocument(documentId);
  const { toggle, isEdit } = useEditor();
  const {
    state: aiState,
    open: aiOpen,
    setOpen: setAIOpen,
    generate,
    cancel,
  } = useAI();
  const [copying, setCopying] = useState(false);

  const handleContentChange = useCallback(
    (content: string) => {
      update({ content });
    },
    [update],
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      update({ title });
    },
    [update],
  );

  const handleAIInsert = useCallback(
    (prompt: string) => {
      if (!document) return;
      const snapshot = document.content;
      let inserted = "";

      generate(
        prompt,
        snapshot,
        (chunk) => {
          inserted += chunk;
          update({ content: snapshot + (snapshot ? "\n\n" : "") + inserted });
        },
        (_full) => {},
      );
    },
    [document, generate, update],
  );

  const handleShare = useCallback(async () => {
    const slug = await toggleShare();
    if (slug) {
      const url = `${window.location.origin}/share/${slug}`;
      await navigator.clipboard.writeText(url);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    }
  }, [toggleShare]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <span className="text-muted-foreground text-xs tracking-widest uppercase animate-pulse font-mono">
          Loading
        </span>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <span className="text-muted-foreground text-xs tracking-widest uppercase font-mono">
          Document not found
        </span>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex flex-col h-screen bg-[#0a0a0a] text-foreground">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-12 border-b border-border shrink-0">
          <Input
            value={document.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="bg-transparent border-none shadow-none outline-none
                       text-sm font-mono w-64 px-0 focus-visible:ring-0
                       placeholder:text-muted-foreground truncate h-auto"
            placeholder="Untitled"
            spellCheck={false}
          />

          <div className="flex items-center gap-4">
            {/* Save status */}
            <span className="text-[10px] tracking-widest uppercase font-mono text-muted-foreground">
              {saving ? "saving..." : saveError ? "error" : "saved"}
            </span>

            {/* Share toggle */}
            {/* <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  {copying ? (
                    <RiCheckLine className="text-sm text-[#e63946]" />
                  ) : document.isPublic ? (
                    <RiFileCopyLine className="text-sm" />
                  ) : (
                    <RiShareLine className="text-sm" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-mono text-xs">
                {copying
                  ? "Link copied!"
                  : document.isPublic
                    ? "Copy share link"
                    : "Share document"}
              </TooltipContent>
            </Tooltip> */}

            {/* Mode toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggle}
                  className="text-[10px] tracking-widest uppercase font-mono
                             text-muted-foreground hover:text-foreground h-auto py-1"
                >
                  {isEdit ? "Preview" : "Edit"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-mono text-xs">
                ⌘E
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Editor / Preview */}
        <main className="flex-1 overflow-hidden">
          {isEdit ? (
            <Editor
              content={document.content}
              onChange={handleContentChange}
              onAITrigger={() => setAIOpen(true)}
            />
          ) : (
            <Preview content={document.content} />
          )}
        </main>

        {aiOpen && (
          <AICommandModal
            state={aiState}
            onSubmit={handleAIInsert}
            onClose={cancel}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
