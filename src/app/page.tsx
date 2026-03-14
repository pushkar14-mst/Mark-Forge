import { cookies } from "next/headers";
import { getUserSSR } from "@/lib/session";
import { redirect } from "next/navigation";
import HomeClient from "@/components/ui/home-client";

export default async function Home() {
  await getUserSSR(await cookies()); // auth guard only

  // Client component handles fetching latest doc and redirecting
  return <HomeClient />;
}
