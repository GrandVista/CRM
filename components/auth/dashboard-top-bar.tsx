"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUser, getUserRole, logout } from "@/lib/auth";
import { LogOut } from "lucide-react";

export function DashboardTopBar() {
  const router = useRouter();
  const user = getUser();
  const role = getUserRole();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="flex items-center justify-end gap-2 border-b border-border bg-card px-6 py-2 h-12 shrink-0">
      {role && (
        <Badge variant="secondary" className="font-normal">
          {role === "admin" ? "管理员" : "员工"}
        </Badge>
      )}
      {user && (
        <span className="text-sm text-muted-foreground mr-2">
          {user.name || user.email}
        </span>
      )}
      <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
        <LogOut className="h-4 w-4" />
        退出登录
      </Button>
    </div>
  );
}
