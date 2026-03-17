import useSWR from "swr";

type SharedDocument = {
  title: string;
  content: string;
};

export function useSharedDocument(slug: string) {
  const { data, error, isLoading } = useSWR<SharedDocument>(
    `/api/share/${slug}`,
  );

  return {
    document: data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
  };
}
