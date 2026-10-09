import { z } from "zod";
import { isValidExtension, isValidThaiPhone } from "@/lib/utils/phone";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `ความยาวต้องไม่เกิน ${max} ตัวอักษร`)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null));

export const contactSchema = z.object({
  prefix: optionalText(50),
  first_name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(100, "ชื่อยาวเกินไป"),
  last_name: z.string().trim().min(1, "กรุณากรอกนามสกุล").max(100, "นามสกุลยาวเกินไป"),
  nickname: optionalText(50),
  rank: optionalText(100),
  position: optionalText(150),
  department_id: z
    .string()
    .uuid("หน่วยงานไม่ถูกต้อง")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  mobile_phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || isValidThaiPhone(v), {
      message: "เบอร์มือถือไม่ถูกต้อง (ต้องเป็นตัวเลข 9-10 หลัก)",
    }),
  mobile_visibility: z.enum(["public", "private"]).default("public"),
  office_phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || isValidThaiPhone(v), {
      message: "เบอร์สำนักงานไม่ถูกต้อง (ต้องเป็นตัวเลข 9-10 หลัก)",
    }),
  extension: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || isValidExtension(v), {
      message: "เบอร์ภายในไม่ถูกต้อง (ตัวเลข 1-10 หลัก)",
    }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.string().email().safeParse(v).success, {
      message: "รูปแบบอีเมลไม่ถูกต้อง",
    }),
  work_location: optionalText(200),
  notes: optionalText(1000),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

export const contactSearchParamsSchema = z.object({
  q: z.string().trim().max(200).optional().default(""),
  department_id: z.string().uuid().optional(),
  include_inactive: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().min(1).optional().default(1),
  page_size: z.coerce.number().int().min(1).max(100).optional().default(20),
});
