"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMenuItemsForRole } from "@/lib/menu-config";
import { getUserRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const role = getUserRole();
  const navItems = getMenuItemsForRole(role);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r border-border bg-card">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/dashboard" className="font-semibold text-foreground">
          景峻 CRM
        </Link>
      </div>
      <nav className="flex flex-col gap-0.5 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
