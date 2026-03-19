"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api-client";

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const res = await authFetch("/api/me");
      if (cancelled) return;
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      setAllowed(true);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">正在检查登录状态...</p>
      </div>
    );
  }

  return <>{children}</>;
}
