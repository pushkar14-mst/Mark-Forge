import HomeClient from "@/components/ui/home-client";
import { getUserSSRNoRedirect } from "@/lib/session";
import { cookies } from "next/headers";

export default async function Home() {
  // Client component handles fetching latest doc and redirecting
  const user = getUserSSRNoRedirect(await cookies());
  if (!user) return;
  return <HomeClient />;
}
