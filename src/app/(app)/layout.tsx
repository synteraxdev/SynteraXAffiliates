import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { unreadNotificationCount } from "@/lib/data";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.status !== "active") redirect("/login?error=inactive");
  const unreadCount = await unreadNotificationCount(session.id);
  return (
    <AppShell user={session} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
