import Link from "next/link";
import { LogOut } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { MobileMenu, MobileTabs } from "@/components/mobile-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { adminNav, userNav } from "@/lib/nav";
import { isAdmin, type SessionUser } from "@/lib/session";
import { roleLabel } from "@/lib/roles";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AppShell({
  user,
  unreadCount = 0,
  children,
}: {
  user: SessionUser;
  unreadCount?: number;
  children: React.ReactNode;
}) {
  const admin = isAdmin(user);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar/90 p-4 lg:flex lg:flex-col">
        <BrandWordmark href="/dashboard" />
        <Badge variant="secondary" className="mt-4 w-fit text-[11px]">
          {roleLabel(user.role)}
        </Badge>
        <nav className="mt-6 flex flex-col gap-1">
          {userNav.map((item) => (
            <NavLink key={item.href} {...item} badge={item.href === "/notifications" ? unreadCount : 0} />
          ))}
        </nav>
        {admin ? (
          <>
            <Separator className="my-4" />
            <p className="mb-2 px-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Admin</p>
            <nav className="flex flex-col gap-1">
              {adminNav.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>
          </>
        ) : null}
        <div className="mt-auto pt-6">
          <div className="flex items-center gap-3 rounded-lg border border-border/70 p-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name || user.username}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">{user.referralSlug}</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="post" className="mt-3">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border/70 px-4 py-3 lg:hidden">
          <BrandWordmark compact href="/dashboard" />
          <MobileMenu isAdmin={admin} unreadCount={unreadCount} />
        </header>
        <main className="flex-1 px-4 py-6 pb-24 sm:px-8 lg:pb-6">{children}</main>
        <MobileTabs />
      </div>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  badge = 0,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/85 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
      {badge ? (
        <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1 text-[10px]">
          {badge}
        </Badge>
      ) : null}
    </Link>
  );
}
