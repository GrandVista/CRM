/**
 * Full-width layout without sidebar.
 * Used only for /contracts/[id]/edit to maximize horizontal space for edit + preview.
 */

import { DashboardAuthGuard } from "@/components/auth/dashboard-auth-guard";
import { DashboardTopBar } from "@/components/auth/dashboard-top-bar";

export const dynamic = "force-dynamic";

export default function DashboardFullLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGuard>
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardTopBar />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </DashboardAuthGuard>
  );
}
