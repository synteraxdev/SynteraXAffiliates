"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { adminNav, mobileTabs, userNav } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileMenu({
  isAdmin,
  unreadCount,
}: {
  isAdmin: boolean;
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-2">
            {userNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm",
                  pathname === item.href ? "bg-muted text-foreground" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/notifications" && unreadCount ? (
                  <Badge variant="secondary">{unreadCount}</Badge>
                ) : null}
              </Link>
            ))}
          </nav>
          {isAdmin ? (
            <nav className="mt-4 flex flex-col gap-1 border-t border-border/70 px-2 pt-4">
              <p className="mb-1 px-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Admin</p>
              {adminNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm",
                    pathname === item.href ? "bg-muted text-foreground" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
          <form action="/api/auth/logout" method="post" className="mt-auto p-4">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </SheetContent>
      </Sheet>
  );
}

export function MobileTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border/70 bg-background/95 px-1 py-1 backdrop-blur lg:hidden">
      {mobileTabs.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px]",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
