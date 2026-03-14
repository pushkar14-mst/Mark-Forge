"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentMeta } from "@/hooks/useDocument";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { RiDeleteBinLine, RiFileLine, RiGlobalLine } from "react-icons/ri";
import { cn } from "@/lib/utils";

type Props = {
  document: DocumentMeta;
  isActive: boolean;
  onDelete: (id: string) => Promise<boolean>;
};

export function DocItem({ document, isActive, onDelete }: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const ok = await onDelete(document.id);
    if (ok) {
      setConfirmOpen(false);
      router.push("/");
    }
    setDeleting(false);
  };

  return (
    <>
      <div
        className={cn(
          "group flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer",
          "transition-colors duration-150",
          isActive
            ? "bg-[#141414] text-foreground"
            : "text-muted-foreground hover:bg-[#0f0f0f] hover:text-foreground",
        )}
        onClick={() => router.push(`/doc/${document.id}`)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {document.isPublic ? (
            <RiGlobalLine className="text-[#e63946] text-sm shrink-0" />
          ) : (
            <RiFileLine className="text-sm shrink-0" />
          )}
          <span className="text-xs font-mono truncate">
            {document.title || "Untitled"}
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen(true);
              }}
              className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100
                         text-muted-foreground hover:text-destructive
                         transition-opacity duration-150"
            >
              <RiDeleteBinLine className="text-xs" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-xs">
            Delete
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm bg-[#0f0f0f] border-border p-0 gap-0 font-mono">
          <DialogHeader className="px-4 pt-4 pb-3">
            <DialogTitle
              className="text-xs tracking-widest uppercase
                                    text-foreground font-mono font-normal"
            >
              Delete document
            </DialogTitle>
          </DialogHeader>

          <Separator className="bg-border" />

          <div className="px-4 py-4">
            <p className="text-xs font-mono text-muted-foreground leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="text-foreground">
                {document.title || "Untitled"}
              </span>
              ? This cannot be undone.
            </p>
          </div>

          <Separator className="bg-border" />

          <div className="flex items-center justify-end gap-2 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              className="text-[10px] font-mono tracking-widest uppercase
                         text-muted-foreground hover:text-foreground h-auto py-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-[10px] font-mono tracking-widest uppercase
                         h-auto py-1 bg-destructive hover:bg-destructive/90
                         text-white border-none"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
