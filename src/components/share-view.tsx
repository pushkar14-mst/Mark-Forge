"use client";

import { useSharedDocument } from "@/hooks/useSharedDocuments";
import { Preview } from "./editor/preview";

type Props = {
  slug: string;
};

export function ShareView({ slug }: Props) {
  const { document, loading, error } = useSharedDocument(slug);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <span
          className="text-[10px] font-mono text-muted-foreground
                         tracking-widest uppercase animate-pulse"
        >
          Loading
        </span>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center flex flex-col gap-2">
          <span
            className="text-xs font-mono text-muted-foreground
                           tracking-widest uppercase"
          >
            Document not found
          </span>
          <span className="text-[10px] font-mono text-[#888]">
            This link may have expired or been made private.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 h-12
                         border-b border-border shrink-0"
      >
        <span className="text-sm font-mono text-foreground truncate max-w-lg">
          {document.title}
        </span>

        <div className="flex items-center gap-4">
          <span
            className="text-[10px] font-mono text-muted-foreground
                           tracking-widest uppercase"
          >
            Read only
          </span>
          <a
            href="/login"
            className="text-[10px] font-mono text-[#e63946] hover:text-[#ff4d5a]
                       tracking-widest uppercase transition-colors"
          >
            Open MarkForge →
          </a>
        </div>
      </header>

      {/* Preview */}
      <main className="flex-1 overflow-hidden">
        <Preview content={document.content} />
      </main>
    </div>
  );
}
