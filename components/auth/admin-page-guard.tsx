"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAdmin } from "@/lib/auth";

/**
 * 仅管理员可访问的页面包裹层：非 admin 会重定向到 /dashboard。
 * 用于 /dashboard/users 等管理员专属页面。
 */
export function AdminPageGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin()) {
      router.replace("/dashboard");
    }
  }, [router]);

  if (!isAdmin()) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <p className="text-muted-foreground">正在检查权限...</p>
      </div>
    );
  }

  return <>{children}</>;
}
