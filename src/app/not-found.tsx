import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <SearchX className="size-12 text-muted-foreground" aria-hidden />
      <div>
        <p className="text-lg font-medium text-foreground">ไม่พบหน้าที่คุณต้องการ</p>
        <p className="mt-1 text-sm text-muted-foreground">ลิงก์อาจไม่ถูกต้อง หรือข้อมูลนี้อาจถูกย้ายหรือลบไปแล้ว</p>
      </div>
      <Link href="/" className="text-sm text-accent hover:underline">
        กลับไปหน้าหลัก
      </Link>
    </div>
  );
}
