import { BookUser } from "lucide-react";
import { LoginForm } from "./LoginForm";

const orgName = process.env.NEXT_PUBLIC_ORG_NAME || "องค์กร";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") ? params.next : "/";

  return (
    <div className="flex min-h-screen w-full">
      <div className="relative hidden w-1/2 flex-col justify-between bg-sidebar-bg p-10 text-sidebar-fg lg:flex">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-accent" aria-hidden />
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
            <BookUser className="size-5 text-white" aria-hidden />
          </div>
          <span className="text-lg font-semibold">สมุดโทรศัพท์ {orgName}</span>
        </div>
        <div>
          <p className="text-2xl font-semibold leading-snug">
            ค้นหาและติดต่อบุคลากร
            <br />
            ได้อย่างรวดเร็วในที่เดียว
          </p>
          <p className="mt-3 max-w-md text-sm text-sidebar-muted">
            ฐานข้อมูลกลางของหน่วยงาน เข้าถึงได้ทั้งคอมพิวเตอร์ แท็บเล็ต และมือถือ
            ตามสิทธิ์การใช้งานที่ได้รับอนุญาต
          </p>
        </div>
        <p className="text-xs text-sidebar-muted">© {new Date().getFullYear()} {orgName}</p>
      </div>

      <div className="flex w-full flex-1 flex-col items-center justify-center bg-background p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
            <div className="flex size-12 items-center justify-center rounded-lg bg-accent">
              <BookUser className="size-6 text-white" aria-hidden />
            </div>
            <h1 className="text-lg font-semibold text-foreground">สมุดโทรศัพท์ {orgName}</h1>
          </div>
          <h2 className="mb-1 hidden text-xl font-semibold text-foreground lg:block">เข้าสู่ระบบ</h2>
          <p className="mb-6 hidden text-sm text-muted-foreground lg:block">
            กรอกอีเมลและรหัสผ่านที่ได้รับจากผู้ดูแลระบบ
          </p>
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
