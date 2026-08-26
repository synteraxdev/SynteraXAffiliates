import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !isAdmin(session)) redirect("/dashboard");
  return children;
}
