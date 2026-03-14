import { useCallback, useRef } from "react";
import useSWR, { mutate } from "swr";

export type Document = {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  shareSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentMeta = Omit<Document, "content">;

const AUTOSAVE_DELAY = 1500;

export function useDocumentList() {
  const { data, error, isLoading } = useSWR<DocumentMeta[]>("/api/documents");

  const create = useCallback(
    async (title?: string): Promise<DocumentMeta | null> => {
      try {
        const res = await fetch("/api/documents/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title ?? "Untitled" }),
        });
        if (!res.ok) throw new Error();
        const doc = await res.json();
        // Optimistically prepend to list
        mutate(
          "/api/documents",
          (prev: DocumentMeta[] = []) => [doc, ...prev],
          false,
        );
        return doc;
      } catch {
        return null;
      }
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/documents/${id}/delete`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      mutate(
        "/api/documents",
        (prev: DocumentMeta[] = []) => prev.filter((d) => d.id !== id),
        false,
      );
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    documents: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    create,
    remove,
  };
}

export function useDocument(id: string) {
  const {
    data: document,
    error,
    isLoading,
    mutate: mutateDoc,
  } = useSWR<Document>(`/api/documents/${id}`);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Partial<Document>>({});
  const savingRef = useRef(false);

  const flush = useCallback(
    async (patch: Partial<Document>) => {
      try {
        savingRef.current = true;
        const res = await fetch(`/api/documents/${id}/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        // Revalidate both the single doc and the list (title may have changed)
        mutateDoc(updated, false);
        mutate("/api/documents");
      } catch {
        console.error("Autosave failed");
      } finally {
        savingRef.current = false;
      }
    },
    [id, mutateDoc],
  );

  const update = useCallback(
    (patch: Partial<Document>) => {
      // Optimistic update
      mutateDoc((prev) => (prev ? { ...prev, ...patch } : prev), false);

      // Accumulate pending changes
      pendingRef.current = { ...pendingRef.current, ...patch };

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const toSave = pendingRef.current;
        pendingRef.current = {};
        flush(toSave);
      }, AUTOSAVE_DELAY);
    },
    [mutateDoc, flush],
  );

  const toggleShare = useCallback(async (): Promise<string | null> => {
    if (!document) return null;
    const res = await fetch(`/api/documents/${id}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !document.isPublic }),
    });
    if (!res.ok) return null;
    const updated = await res.json();
    mutateDoc(updated, false);
    mutate("/api/documents");
    return updated.shareSlug ?? null;
  }, [document, id, mutateDoc]);

  return {
    document: document ?? null,
    loading: isLoading,
    saving: savingRef.current,
    saveError: error?.message ?? null,
    update,
    toggleShare,
  };
}
