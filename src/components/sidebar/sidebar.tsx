"use client";

import { useDocumentList } from "@/hooks/useDocument";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { RiAddLine, RiLogoutBoxLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import { UserData } from "@/lib/session";
import { DocList } from "./doc-list";

type Props = {
  user: UserData;
  activeDocumentId?: string;
};

export function Sidebar({ user, activeDocumentId }: Props) {
  const router = useRouter();
  const { documents, loading, create, remove } = useDocumentList();

  const handleCreate = async () => {
    const doc = await create();
    if (doc) router.push(`/doc/${doc.id}`);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout");
    router.push("/login");
    router.refresh();
  };

  return (
    <TooltipProvider delayDuration={400}>
      <aside
        className="flex flex-col w-60 h-screen bg-[#080808]
                        border-r border-border shrink-0"
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-4 h-12 shrink-0">
          <span className="text-sm font-mono tracking-widest uppercase text-foreground">
            Mark<span className="text-[#e63946]">Forge</span>
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCreate}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <RiAddLine className="text-base" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-mono text-xs">
              New document
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator className="bg-border" />

        {/* Document list */}
        <ScrollArea className="flex-1 px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span
                className="text-[10px] font-mono text-muted-foreground
                               tracking-widest uppercase animate-pulse"
              >
                Loading
              </span>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span
                className="text-[10px] font-mono text-muted-foreground
                               tracking-widest uppercase"
              >
                No documents
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreate}
                className="text-[10px] font-mono tracking-widest uppercase
                           text-[#e63946] hover:text-[#ff4d5a] h-auto py-1"
              >
                Create one
              </Button>
            </div>
          ) : (
            <DocList
              documents={documents}
              activeDocumentId={activeDocumentId}
              onDelete={remove}
            />
          )}
        </ScrollArea>

        <Separator className="bg-border" />

        {/* User footer */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-5 h-5 rounded-full shrink-0"
              />
            ) : (
              <div
                className="w-5 h-5 rounded-full bg-[#1a1a1a] shrink-0
                              flex items-center justify-center"
              >
                <span className="text-[8px] font-mono text-muted-foreground uppercase">
                  {user.name?.[0] ?? "?"}
                </span>
              </div>
            )}
            <span className="text-xs font-mono text-muted-foreground truncate">
              {user.email}
            </span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <RiLogoutBoxLine className="text-base" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-mono text-xs">
              Sign out
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
