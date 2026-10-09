import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { ImportWizard } from "@/components/manage/ImportWizard";

export default async function ImportPage() {
  await requireRole(["admin", "editor"]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 md:p-6">
      <Link href="/manage" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> กลับไปจัดการรายชื่อ
      </Link>
      <div>
        <h1 className="text-xl font-semibold text-foreground">นำเข้าข้อมูลจากไฟล์ CSV</h1>
        <p className="text-sm text-muted-foreground">
          ระบบจะแสดงตัวอย่างข้อมูลก่อนนำเข้าจริง และแจ้งแถวที่ผิดพลาดหรือซ้ำกับข้อมูลเดิม
        </p>
      </div>
      <ImportWizard />
    </div>
  );
}
