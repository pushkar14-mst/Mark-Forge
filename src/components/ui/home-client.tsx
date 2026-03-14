"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDocumentList } from "@/hooks/useDocument";

export default function HomeClient() {
  const router = useRouter();
  const { documents, loading } = useDocumentList();

  useEffect(() => {
    if (!loading && documents.length > 0) {
      router.replace(`/document/${documents[0].id}`);
    }
  }, [loading, documents, router]);

  return (
    <div className="flex h-full items-center justify-center">
      {loading ? (
        <span
          className="text-[10px] font-mono text-muted-foreground
                         tracking-widest uppercase animate-pulse"
        >
          Loading
        </span>
      ) : documents.length === 0 ? (
        <div className="text-center">
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
            No documents yet
          </p>
          <p className="text-[10px] font-mono text-[#2a2a2a] mt-1">
            Create one from the sidebar
          </p>
        </div>
      ) : null}
    </div>
  );
}
