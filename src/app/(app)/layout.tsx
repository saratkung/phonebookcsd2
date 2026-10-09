import { getOptionalSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/Toast";

const orgName = process.env.NEXT_PUBLIC_ORG_NAME || "องค์กร";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getOptionalSession();

  if (!session) {
    // Anonymous visitor: only the public read-only pages (home search,
    // contact detail) reach this layout at all — the proxy/middleware
    // already redirects every other path to /login. No role-based
    // Sidebar/BottomNav makes sense here, so render a minimal public shell.
    return (
      <ToastProvider>
        <div className="flex min-h-screen w-full flex-col">
          <Header session={null} orgName={orgName} />
          <main className="flex-1">{children}</main>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar role={session.profile.role} orgName={orgName} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Header
            session={{ displayName: session.profile.display_name, role: session.profile.role }}
            orgName={orgName}
          />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
        </div>
        <BottomNav role={session.profile.role} />
      </div>
    </ToastProvider>
  );
}
