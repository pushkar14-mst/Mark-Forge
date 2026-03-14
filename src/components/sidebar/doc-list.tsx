"use client";

import { DocumentMeta } from "@/hooks/useDocument";
import { DocItem } from "./doc-item";

type Props = {
  documents: DocumentMeta[];
  activeDocumentId?: string;
  onDelete: (id: string) => Promise<boolean>;
};

export function DocList({ documents, activeDocumentId, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-0.5">
      {documents.map((doc) => (
        <DocItem
          key={doc.id}
          document={doc}
          isActive={doc.id === activeDocumentId}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
