"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { previewImportAction, confirmImportAction, type ConfirmImportResult } from "@/lib/actions/import";
import type { ImportRowValidated } from "@/lib/validation/import";

type Step = "select" | "preview" | "done";

export function ImportWizard() {
  const router = useRouter();
  const { show } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("select");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRowValidated[]>([]);
  const [included, setIncluded] = useState<Set<number>>(new Set());
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [result, setResult] = useState<ConfirmImportResult | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    const formData = new FormData();
    formData.set("file", file);
    const res = await previewImportAction(formData);
    setLoading(false);

    if (!res.success || !res.rows) {
      show("error", res.error ?? "ไม่สามารถอ่านไฟล์ได้");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setRows(res.rows);
    setIncluded(new Set(res.rows.filter((r) => r.errors.length === 0).map((r) => r.rowNumber)));
    setStep("preview");
  }

  function toggleRow(rowNumber: number) {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  }

  async function handleConfirm() {
    setLoading(true);
    const selected = rows.filter((r) => included.has(r.rowNumber));
    const res = await confirmImportAction(selected, skipDuplicates);
    setLoading(false);
    if (!res.success) {
      show("error", res.error ?? "นำเข้าข้อมูลไม่สำเร็จ");
      return;
    }
    setResult(res);
    setStep("done");
    show("success", `นำเข้าข้อมูลสำเร็จ ${res.insertedCount} รายการ`);
  }

  function reset() {
    setStep("select");
    setRows([]);
    setIncluded(new Set());
    setResult(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  const invalidCount = rows.length - validCount;
  const duplicateCount = rows.filter((r) => r.isDuplicateInFile || r.isDuplicateInDb).length;

  if (step === "select") {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border py-12 text-center">
          <FileSpreadsheet className="size-10 text-muted-foreground" aria-hidden />
          <div>
            <p className="font-medium text-foreground">เลือกไฟล์ CSV เพื่อนำเข้ารายชื่อ</p>
            <p className="text-sm text-muted-foreground">รองรับไฟล์ .csv (รองรับ .xlsx ในอนาคต)</p>
          </div>
          <label>
            <input ref={fileInputRef} type="file" accept=".csv" className="sr-only" onChange={handleFileChange} />
            <Button type="button" onClick={() => fileInputRef.current?.click()} loading={loading}>
              <Upload className="size-4" /> เลือกไฟล์
            </Button>
          </label>
          {fileName && <p className="text-xs text-muted-foreground">ไฟล์ที่เลือก: {fileName}</p>}
        </div>
        <a
          href="/templates/contacts-import-template.csv"
          download
          className="flex items-center justify-center gap-1.5 text-sm text-accent hover:underline"
        >
          <Download className="size-4" /> ดาวน์โหลดไฟล์ตัวอย่าง (Template)
        </a>
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="success">ถูกต้อง {validCount}</Badge>
          <Badge tone="danger">ผิดพลาด {invalidCount}</Badge>
          <Badge tone="warning">ซ้ำ {duplicateCount}</Badge>
          <span className="text-sm text-muted-foreground">รวม {rows.length} แถว</span>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={skipDuplicates}
            onChange={(e) => setSkipDuplicates(e.target.checked)}
            className="size-4 accent-accent"
          />
          ข้ามรายการที่ซ้ำโดยอัตโนมัติ (ป้องกันการนำเข้าข้อมูลซ้ำ)
        </label>

        <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">นำเข้า</th>
                <th className="px-3 py-2">แถว</th>
                <th className="px-3 py-2">ชื่อ-นามสกุล</th>
                <th className="px-3 py-2">เบอร์มือถือ</th>
                <th className="px-3 py-2">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowNumber} className="border-t border-border">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={included.has(row.rowNumber)}
                      onChange={() => toggleRow(row.rowNumber)}
                      disabled={row.errors.length > 0}
                      className="size-4 accent-accent"
                    />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{row.rowNumber}</td>
                  <td className="px-3 py-2">
                    {row.data.first_name} {row.data.last_name}
                  </td>
                  <td className="px-3 py-2">{row.data.mobile_phone ?? "—"}</td>
                  <td className="px-3 py-2">
                    {row.errors.length > 0 ? (
                      <span className="flex items-center gap-1 text-danger">
                        <AlertCircle className="size-3.5" /> {row.errors.join("; ")}
                      </span>
                    ) : row.isDuplicateInFile || row.isDuplicateInDb ? (
                      <span className="text-warning">อาจซ้ำกับข้อมูลที่มีอยู่</span>
                    ) : (
                      <span className="flex items-center gap-1 text-success">
                        <CheckCircle2 className="size-3.5" /> พร้อมนำเข้า
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between">
          <Button variant="secondary" onClick={reset}>
            <ArrowLeft className="size-4" /> เลือกไฟล์ใหม่
          </Button>
          <Button onClick={handleConfirm} loading={loading} disabled={included.size === 0}>
            ยืนยันนำเข้า {included.size} รายการ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-8 text-center">
      <CheckCircle2 className="size-12 text-success" />
      <div>
        <p className="font-medium text-foreground">นำเข้าข้อมูลเสร็จสิ้น</p>
        <p className="mt-1 text-sm text-muted-foreground">
          สำเร็จ {result?.insertedCount ?? 0} รายการ · ข้าม {result?.skippedCount ?? 0} รายการ · ผิดพลาด{" "}
          {result?.failedRows?.length ?? 0} รายการ
        </p>
      </div>
      {result?.failedRows && result.failedRows.length > 0 && (
        <div className="w-full rounded-md bg-red-50 p-3 text-left text-sm text-danger">
          <p className="font-medium">แถวที่ผิดพลาด:</p>
          <ul className="mt-1 list-disc pl-4">
            {result.failedRows.map((f) => (
              <li key={f.rowNumber}>
                แถว {f.rowNumber}: {f.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={reset}>
          นำเข้าไฟล์อื่น
        </Button>
        <Button onClick={() => router.push("/manage")}>ไปที่หน้าจัดการรายชื่อ</Button>
      </div>
    </div>
  );
}
