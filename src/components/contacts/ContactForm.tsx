"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Search, AlertTriangle, Save } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { checkDuplicateContact, type MutationResult } from "@/lib/actions/contacts";
import type { Contact, Department } from "@/lib/supabase/types";

const initialState: MutationResult = { success: false };

export function ContactForm({
  contact,
  departments,
  canChooseAnyDepartment,
  defaultDepartmentId,
  action,
}: {
  contact?: Contact;
  departments: Department[];
  canChooseAnyDepartment: boolean;
  defaultDepartmentId: string | null;
  action: (prev: MutationResult, formData: FormData) => Promise<MutationResult>;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [state, formAction, pending] = useActionState(action, initialState);

  const [firstName, setFirstName] = useState(contact?.first_name ?? "");
  const [lastName, setLastName] = useState(contact?.last_name ?? "");
  const [mobilePhone, setMobilePhone] = useState(contact?.mobile_phone ?? "");
  const [dupResult, setDupResult] = useState<Contact[] | null>(null);
  const [checkingDup, setCheckingDup] = useState(false);

  useEffect(() => {
    if (state.success && state.contactId) {
      show("success", contact ? "บันทึกการแก้ไขเรียบร้อยแล้ว" : "เพิ่มรายชื่อเรียบร้อยแล้ว");
      router.push(`/contacts/${state.contactId}`);
    } else if (state.error) {
      show("error", state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function handleCheckDuplicate() {
    if (!firstName.trim() || !lastName.trim()) {
      show("warning", "กรุณากรอกชื่อและนามสกุลก่อนตรวจสอบ");
      return;
    }
    setCheckingDup(true);
    try {
      const result = await checkDuplicateContact(firstName, lastName, mobilePhone || null, contact?.id);
      setDupResult(result.possibleDuplicates);
      if (result.possibleDuplicates.length === 0) show("success", "ไม่พบรายชื่อซ้ำในระบบ");
    } finally {
      setCheckingDup(false);
    }
  }

  const departmentOptions = canChooseAnyDepartment
    ? departments
    : departments.filter((d) => d.id === defaultDepartmentId);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {dupResult && dupResult.length > 0 && (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">พบรายชื่อที่อาจซ้ำกัน {dupResult.length} รายการ</p>
            <ul className="mt-1 list-disc pl-4">
              {dupResult.map((d) => (
                <li key={d.id}>
                  <Link href={`/contacts/${d.id}`} target="_blank" className="underline">
                    {[d.prefix, d.first_name, d.last_name].filter(Boolean).join(" ")}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="ยศ / คำนำหน้า" htmlFor="prefix">
          <Input id="prefix" name="prefix" defaultValue={contact?.prefix ?? ""} placeholder="เช่น นาย, นาง, ร.ต.อ." />
        </Field>
        <Field label="ชื่อเล่น" htmlFor="nickname">
          <Input id="nickname" name="nickname" defaultValue={contact?.nickname ?? ""} />
        </Field>

        <Field label="ชื่อ" htmlFor="first_name" error={state.fieldErrors?.first_name} required>
          <Input
            id="first_name"
            name="first_name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={!!state.fieldErrors?.first_name}
            required
          />
        </Field>
        <Field label="นามสกุล" htmlFor="last_name" error={state.fieldErrors?.last_name} required>
          <Input
            id="last_name"
            name="last_name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={!!state.fieldErrors?.last_name}
            required
          />
        </Field>

        <Field label="ตำแหน่ง" htmlFor="position">
          <Input id="position" name="position" defaultValue={contact?.position ?? ""} />
        </Field>
        <Field label="หน่วยงาน" htmlFor="department_id">
          <Select id="department_id" name="department_id" defaultValue={contact?.department_id ?? defaultDepartmentId ?? ""}>
            <option value="">— ไม่ระบุ —</option>
            {departmentOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="เบอร์มือถือ" htmlFor="mobile_phone" error={state.fieldErrors?.mobile_phone}>
          <Input
            id="mobile_phone"
            name="mobile_phone"
            value={mobilePhone}
            onChange={(e) => setMobilePhone(e.target.value)}
            placeholder="08x-xxx-xxxx"
            error={!!state.fieldErrors?.mobile_phone}
          />
        </Field>
        <Field label="การแสดงผลเบอร์มือถือ" htmlFor="mobile_visibility">
          <Select id="mobile_visibility" name="mobile_visibility" defaultValue={contact?.mobile_visibility ?? "public"}>
            <option value="public">แสดงให้ทุกคนเห็น</option>
            <option value="private">แสดงเฉพาะเจ้าหน้าที่ข้อมูล/ผู้ดูแลระบบ</option>
          </Select>
        </Field>

        <Field label="เบอร์สำนักงาน" htmlFor="office_phone" error={state.fieldErrors?.office_phone}>
          <Input
            id="office_phone"
            name="office_phone"
            defaultValue={contact?.office_phone ?? ""}
            error={!!state.fieldErrors?.office_phone}
          />
        </Field>
        <Field label="เบอร์ภายใน" htmlFor="extension" error={state.fieldErrors?.extension}>
          <Input id="extension" name="extension" defaultValue={contact?.extension ?? ""} error={!!state.fieldErrors?.extension} />
        </Field>

        <Field label="อีเมล" htmlFor="email" error={state.fieldErrors?.email}>
          <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ""} error={!!state.fieldErrors?.email} />
        </Field>
        <Field label="สถานที่ปฏิบัติงาน" htmlFor="work_location">
          <Input id="work_location" name="work_location" defaultValue={contact?.work_location ?? ""} />
        </Field>
      </div>

      <Field label="หมายเหตุ" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={contact?.notes ?? ""} />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <Button type="button" variant="secondary" onClick={handleCheckDuplicate} loading={checkingDup}>
          <Search className="size-4" /> ตรวจสอบรายชื่อซ้ำ
        </Button>
        <div className="flex gap-2">
          <Link href={contact ? `/contacts/${contact.id}` : "/manage"}>
            <Button type="button" variant="ghost">
              ยกเลิก
            </Button>
          </Link>
          <Button type="submit" loading={pending}>
            <Save className="size-4" /> บันทึก
          </Button>
        </div>
      </div>
    </form>
  );
}
