import { cookies } from "next/headers";
import { getUserSSR, getUserSSRNoRedirect } from "@/lib/session";
import { Sidebar } from "@/components/sidebar/sidebar";
import { redirect } from "next/navigation";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserSSRNoRedirect(await cookies());
  if (!user) redirect("/login");
  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <Sidebar user={user} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
