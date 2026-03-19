import { Sidebar } from "@/components/layout/sidebar";
import { DashboardAuthGuard } from "@/components/auth/dashboard-auth-guard";
import { DashboardTopBar } from "@/components/auth/dashboard-top-bar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pl-56 flex flex-col min-h-screen">
          <DashboardTopBar />
          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>
    </DashboardAuthGuard>
  );
}
