import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TrackingProvider } from "@/components/providers/TrackingProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden pl-64 transition-all duration-300">
        <Header />
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden p-6 relative">
          <TrackingProvider>
            {children}
          </TrackingProvider>
        </main>
      </div>
    </div>
  );
}
