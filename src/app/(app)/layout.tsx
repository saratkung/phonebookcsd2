import { redirect } from "next/navigation";
import { AuthError, requireSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/Toast";

const orgName = process.env.NEXT_PUBLIC_ORG_NAME || "องค์กร";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await requireSession();
  } catch (e) {
    if (e instanceof AuthError) {
      redirect("/login");
    }
    throw e;
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar role={session.profile.role} orgName={orgName} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Header displayName={session.profile.display_name} role={session.profile.role} orgName={orgName} />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
        </div>
        <BottomNav role={session.profile.role} />
      </div>
    </ToastProvider>
  );
}
