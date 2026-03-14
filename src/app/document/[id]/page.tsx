import { cookies } from "next/headers";
import { getUserSSR } from "@/lib/session";
import { EditorShell } from "@/components/editor/editor-shell";

export default async function DocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getUserSSR(await cookies()); // auth guard only

  return <EditorShell documentId={id} />;
}
