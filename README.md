# สมุดโทรศัพท์องค์กร (Organization Phonebook)

ระบบสมุดโทรศัพท์กลางสำหรับหน่วยงาน พัฒนาด้วย Next.js (App Router) + TypeScript +
Tailwind CSS + Supabase (PostgreSQL, Auth, RLS) รองรับการใช้งานบนมือถือ แท็บเล็ต
และคอมพิวเตอร์ ผู้ใช้หลายคนเข้าถึงฐานข้อมูลกลางเดียวกันตามสิทธิ์ที่ได้รับ

## 1. ภาพรวมเทคโนโลยี

| ส่วนประกอบ        | เทคโนโลยี                                  |
| ------------------ | ------------------------------------------- |
| Framework          | Next.js 16 (App Router, Server Actions)     |
| ภาษา               | TypeScript                                  |
| UI                 | Tailwind CSS v4, Lucide Icons, ฟอนต์ Sarabun |
| ฐานข้อมูล          | Supabase PostgreSQL                         |
| ยืนยันตัวตน        | Supabase Auth (อีเมล/รหัสผ่าน)              |
| ตรวจสอบข้อมูล      | Zod                                         |
| นำเข้าข้อมูล CSV   | PapaParse                                   |
| ทดสอบ              | Vitest (unit), Playwright (e2e, ไม่ได้ติดตั้งในชุดนี้) |

## 2. โครงสร้างโฟลเดอร์

```
phonebook/
├─ src/
│  ├─ app/
│  │  ├─ login/                  หน้าเข้าสู่ระบบ (public)
│  │  └─ (app)/                  กลุ่มหน้าที่ต้อง login (มี Sidebar/BottomNav)
│  │     ├─ page.tsx             หน้า B: สมุดโทรศัพท์ (ค้นหา)
│  │     ├─ favorites/           รายการโปรด
│  │     ├─ contacts/[id]/       หน้า C: รายละเอียดบุคคล
│  │     ├─ contacts/new|edit/   ฟอร์มเพิ่ม/แก้ไข
│  │     ├─ manage/              หน้า D: จัดการรายชื่อ + นำเข้า CSV
│  │     └─ admin/               หน้า E: ผู้ดูแลระบบ (ผู้ใช้/หน่วยงาน/ประวัติ)
│  ├─ components/                UI components แยกตามโดเมน (ui, layout, phonebook, contacts, manage, admin)
│  ├─ lib/
│  │  ├─ supabase/               client.ts (browser), server.ts (SSR), admin.ts (service role), types.ts
│  │  ├─ actions/                Server Actions ทั้งหมด (ตรวจสิทธิ์ซ้ำฝั่ง server ทุกจุด)
│  │  ├─ validation/             Zod schemas
│  │  └─ auth.ts                 requireSession()/requireRole() ใช้ตรวจสิทธิ์จริงฝั่ง server
│  └─ proxy.ts                   Middleware (Next 16 เรียกว่า Proxy) — refresh session + guard route
├─ supabase/migrations/          SQL migrations (schema, functions, audit triggers, RLS policies)
├─ scripts/                      migrate.ts, create-admin.ts, seed.ts
├─ tests/
│  ├─ unit/                      Vitest — ผ่าน 27/27
│  ├─ rls/verify-rls.ts          สคริปต์ตรวจ RLS จริงกับ Supabase project — ผ่าน 9/9
│  └─ e2e/                       Playwright specs — ผ่าน 14/14 (ดูหัวข้อ 9)
└─ .env.example
```

## 3. การติดตั้ง (Visual Studio Code / เครื่อง local)

### 3.1 ติดตั้ง dependencies

```bash
npm install
```

### 3.2 สร้างโปรเจกต์ Supabase และเชื่อมต่อฐานข้อมูล

1. สร้างโปรเจกต์ใหม่ที่ [supabase.com](https://supabase.com) (หรือรัน Supabase ในเครื่องด้วย Supabase CLI)
2. ไปที่ **Project Settings > API** คัดลอกค่า `Project URL`, `anon public key`, และ
   `service_role key` (เก็บเป็นความลับ ห้ามเผยแพร่)
3. คัดลอก `.env.example` เป็น `.env.local` แล้วกรอกค่าที่ได้จากขั้นตอนที่ 2 (ดูตัวอย่างในข้อ 4 ด้านล่าง)
4. รัน migration ด้วยวิธีใดวิธีหนึ่ง:

   **วิธีที่ A — สคริปต์อัตโนมัติ (แนะนำ)**: เติม `SUPABASE_DB_PASSWORD` และ
   `SUPABASE_DB_REGION` (รหัสภูมิภาคของโปรเจกต์ เช่น `ap-south-1`, ดูได้จาก
   Settings > Database) ใน `.env.local` แล้วรัน
   ```bash
   npm run migrate
   ```
   สคริปต์จะรันไฟล์ทั้ง 5 ไฟล์ใน `supabase/migrations/` ตามลำดับให้อัตโนมัติ
   ผ่าน Session Pooler (จำเป็นต้องใช้ pooler เพราะ host `db.<ref>.supabase.co`
   แบบเชื่อมต่อตรงเป็น IPv6-only ในโปรเจกต์ใหม่ และบางเครือข่ายอาจ resolve ไม่ได้)
   ปลอดภัยที่จะรันซ้ำได้เสมอ (ทุกไฟล์ใช้ `if not exists` / `create or replace`)

   **วิธีที่ B — ด้วยมือ**: เปิด **SQL Editor** ใน Supabase Dashboard แล้วรันไฟล์
   ตามลำดับเลขทีละไฟล์: `0001_init_schema.sql` → `0002_functions_and_audit.sql`
   → `0003_rls_policies.sql` → `0004_contacts_actor_guard.sql` → `0005_import_log_rpc.sql`
   → `0006_public_read_access.sql`

5. (ไม่บังคับ) ลบ `SUPABASE_DB_PASSWORD`/`SUPABASE_DB_REGION`/`DATABASE_URL`
   ออกจาก `.env.local` หลังรัน migrate เสร็จ — แอปไม่ได้ใช้ค่าเหล่านี้ตอนรันจริง
   ใช้แค่ตอนรันสคริปต์ migrate/seed/create-admin เท่านั้น

ตัวอย่าง `.env.local`:
```bash
cp .env.example .env.local
```
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx   # เก็บเป็นความลับ ใช้เฉพาะสคริปต์ฝั่ง server
NEXT_PUBLIC_ORG_NAME=ชื่อหน่วยงานของคุณ
SUPABASE_DB_PASSWORD=xxxxx        # ใช้ชั่วคราวสำหรับ npm run migrate เท่านั้น
SUPABASE_DB_REGION=ap-south-1     # ใช้ชั่วคราวสำหรับ npm run migrate เท่านั้น
```

### 3.3 สร้างบัญชีผู้ดูแลระบบ (Admin) คนแรก

ระบบนี้**ไม่มีการสมัครสมาชิกเอง** จึงต้องสร้างบัญชี Admin คนแรกผ่านสคริปต์ที่ใช้
Service Role Key (รันจากเครื่อง/เทอร์มินัลที่เชื่อถือได้เท่านั้น):

```bash
npx tsx scripts/create-admin.ts --email admin@yourorg.go.th --name "ผู้ดูแลระบบ" --password "TempPass123!"
```

จากนั้นแจ้งอีเมล/รหัสผ่านชั่วคราวให้ผู้ดูแลระบบผ่านช่องทางที่ปลอดภัย และให้เปลี่ยน
รหัสผ่านทันทีหลังเข้าสู่ระบบครั้งแรก (เปลี่ยนรหัสผ่านได้ผ่านหน้า Supabase Auth
หรือจะเพิ่มฟีเจอร์ "เปลี่ยนรหัสผ่านตนเอง" ในระบบภายหลัง — ดูหัวข้อ 11)

### 3.4 ข้อมูลตัวอย่างสำหรับทดสอบ (Seed Data)

สร้างหน่วยงาน/ผู้ใช้/รายชื่อตัวอย่าง (**ข้อมูลสมมติทั้งหมด**) เพื่อทดสอบระบบ:

```bash
npm run seed
```

จะได้บัญชีตัวอย่าง 3 บทบาท (รหัสผ่าน `DemoPass123!`):

- `admin.demo@example.org` — ผู้ดูแลระบบ
- `editor.demo@example.org` — เจ้าหน้าที่ข้อมูล (สังกัดฝ่าย IT)
- `viewer.demo@example.org` — ผู้ใช้งานทั่วไป (สังกัดฝ่ายบุคคล)

### 3.5 รันระบบ

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) — ระบบจะพาไปหน้า `/login` อัตโนมัติ

## 4. คำสั่งที่ใช้บ่อย

| คำสั่ง                  | คำอธิบาย                                             |
| ----------------------- | ------------------------------------------------------ |
| `npm run dev`           | รันเซิร์ฟเวอร์พัฒนา                                     |
| `npm run build`         | Build สำหรับ production (รวม type-check)              |
| `npm run start`         | รันเซิร์ฟเวอร์ production (ต้อง build ก่อน)            |
| `npm run lint`          | ตรวจสอบ ESLint                                         |
| `npm run test`          | รัน Unit tests (Vitest)                                |
| `npm run test:rls`      | ตรวจสอบ RLS จริงกับ Supabase project (ต้อง seed ก่อน)  |
| `npm run test:e2e`      | รัน E2E tests (Playwright)                             |
| `npm run migrate`       | รัน SQL migrations อัตโนมัติกับฐานข้อมูลจริง           |
| `npm run seed`          | สร้างข้อมูลตัวอย่าง (หน่วยงาน/ผู้ใช้/รายชื่อสมมติ)      |
| `npm run create-admin`  | สร้างบัญชีผู้ดูแลระบบคนแรก                             |

## 5. บทบาทผู้ใช้และสิทธิ์

> **การตัดสินใจเชิงนโยบาย**: ตามคำขอของผู้ดูแลระบบ หน้าค้นหา/ดูรายละเอียดบุคคล
> (`/` และ `/contacts/<id>`) **เปิดเป็นสาธารณะ ไม่ต้องเข้าสู่ระบบ** — ใครก็เข้าดูได้
> โดยตรง นี่เป็นการเบี่ยงเบนจากข้อกำหนดเดิมที่ระบุว่า "ห้ามเปิดเผยข้อมูลส่วนบุคคล
> ผ่าน Public API โดยไม่มีการตรวจสอบสิทธิ์" อย่างจงใจ และได้แจ้งความเสี่ยงให้
> ผู้ดูแลระบบทราบและยืนยันแล้วก่อนดำเนินการ การแก้ไข/เพิ่ม/ลบข้อมูล, รายการโปรด,
> และหน้าผู้ดูแลระบบยังคงต้องเข้าสู่ระบบตามปกติ เบอร์มือถือที่ตั้งเป็น "private"
> ยังคงถูกซ่อนจากผู้เข้าชมที่ไม่ได้ login เช่นเดิม (ผ่าน `contacts_view`)

| บทบาท          | สิทธิ์                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| *(ไม่ login)*  | ค้นหา/ดูรายชื่อที่เปิดใช้งานเท่านั้น (ไม่เห็นเบอร์ที่ตั้งเป็น private, ไม่มีรายการโปรด/แก้ไข) |
| `viewer`       | ทำทุกอย่างข้างต้น + เห็นเบอร์ private ไม่ได้เพิ่มเติม + บันทึกรายการโปรด  |
| `editor`       | ทำทุกอย่างของ viewer + เพิ่ม/แก้ไข/ปิดใช้งานรายชื่อ **ในหน่วยงานตนเอง** + นำเข้า CSV |
| `admin`        | ทำทุกอย่างของ editor ในทุกหน่วยงาน + จัดการผู้ใช้/หน่วยงาน + ดูประวัติการแก้ไข (Audit Log) |

สิทธิ์ทั้งหมดถูกบังคับใช้ที่ **สองชั้น**:

1. **Row Level Security (RLS)** ในฐานข้อมูล — ชั้นที่เชื่อถือได้จริง แก้ไข client ไม่ได้
2. **Server Actions** (`src/lib/auth.ts`, `src/lib/actions/*.ts`) — ตรวจสิทธิ์ซ้ำก่อนเรียกฐานข้อมูลทุกครั้ง ไม่เชื่อ role ที่ส่งมาจาก client

การซ่อนปุ่ม/เมนูในหน้าจอ (เช่น Sidebar ไม่แสดง "จัดการรายชื่อ" ให้ viewer) เป็นเพียง
**UX** เท่านั้น — ไม่ใช่การป้องกันสิทธิ์ที่แท้จริง การป้องกันจริงอยู่ที่ RLS + Server Actions

## 6. การค้นหา

- ค้นหาจากฐานข้อมูลจริงผ่าน `contacts_view` (ไม่ดึงข้อมูลทั้งหมดมาประมวลผลที่ client)
- รองรับค้นหาบางส่วนของชื่อ/นามสกุล/ชื่อเล่น/ยศ/ตำแหน่ง (ไทย+อังกฤษ, ไม่สนตัวพิมพ์เล็ก/ใหญ่) ผ่านคอลัมน์ `search_text` (GIN trigram index)
- รองรับค้นหาเบอร์โทรแบบพิมพ์บางส่วนผ่านคอลัมน์ `phone_digits` (ตัดอักขระที่ไม่ใช่ตัวเลขออกทั้งสองฝั่ง)
- Debounce การค้นหาที่ 350ms ฝั่ง client ก่อนยิง query
- มี Pagination (20 รายการ/หน้า) และปุ่มล้างตัวกรอง
- กรองตามหน่วยงาน/หน่วยงานย่อย (recursive) ผ่านฟังก์ชัน `department_and_descendants`

## 7. การนำเข้าข้อมูล (CSV Import)

หน้า **จัดการรายชื่อ > นำเข้าข้อมูล** (`/manage/import`, เฉพาะ editor/admin):

1. ดาวน์โหลดไฟล์ตัวอย่างได้จากหน้าเดียวกัน (`/templates/contacts-import-template.csv`)
2. อัปโหลดไฟล์ CSV — ระบบตรวจคอลัมน์ที่จำเป็น (`first_name`, `last_name`) และ Preview
   ทุกแถวพร้อมสถานะ (ถูกต้อง/ผิดพลาด/อาจซ้ำ) ก่อนยืนยัน
3. เลือกข้ามรายการที่ซ้ำโดยอัตโนมัติได้ (เทียบชื่อ-นามสกุล และเบอร์มือถือ ทั้งในไฟล์เดียวกันและกับข้อมูลเดิมในระบบ)
4. ยืนยันนำเข้า — ระบบรายงานจำนวนสำเร็จ/ข้าม/ผิดพลาด พร้อมเหตุผลรายแถว
5. รองรับเฉพาะ `.csv` ในเวอร์ชันนี้ — โครงสร้างโค้ด (`src/lib/validation/import.ts`,
   `src/lib/actions/import.ts`) ออกแบบให้เพิ่มตัวอ่าน `.xlsx` ได้โดยไม่ต้องแก้ส่วน validate/preview/confirm

## 8. การ Deploy

**Deploy อยู่แล้วที่: https://phonebook-mu.vercel.app** (Vercel project `sarat-team/phonebook`,
เชื่อมกับ GitHub repo นี้โดยตรง — push ขึ้น `main` แล้ว Vercel จะ deploy ให้อัตโนมัติทุกครั้ง)

ขั้นตอนที่ทำไปแล้ว (สำหรับ deploy โปรเจกต์ใหม่/ทำซ้ำที่อื่น):

1. Push โค้ดขึ้น Git repository (ทำแล้ว — GitHub)
2. `npx vercel link` เชื่อมโฟลเดอร์นี้กับ Vercel project (ทำแล้ว — สร้าง + เชื่อม GitHub repo ให้อัตโนมัติ)
3. ตั้งค่า Environment Variables ผ่าน `vercel env add <NAME> production` (และ `preview`)
   ให้ตรงกับ `.env.local` (ทำแล้วทั้ง 4 ตัว: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_ORG_NAME`)
   — หรือตั้งผ่านหน้าเว็บ Vercel Dashboard > Project Settings > Environment Variables ก็ได้
4. `npx vercel deploy --prod` (ทำแล้ว — build ผ่าน, ตรวจสอบแล้วว่าหน้า `/login` ตอบ 200
   และหน้าแรกไม่ login จะ redirect ไป `/login` ตามที่ตั้งใจ)
5. รัน migrations บน Supabase project จริงแยกต่างหาก (ตามหัวข้อ 3.2) ก่อน deploy ครั้งแรก — ทำแล้ว

**Deploy ครั้งต่อไป**: แค่ `git push` ขึ้น `main` ปกติ Vercel จะ build/deploy ให้อัตโนมัติ
(ไม่ต้องรันคำสั่ง `vercel` เองอีก เว้นแต่ต้องการ deploy แบบ manual หรือ preview)

หากต้องการ self-host (เช่น Docker/VM) แทน Vercel: รัน `npm run build` แล้ว `npm run start`
(ต้องตั้งค่า Environment Variables ในเครื่อง/คอนเทนเนอร์เช่นเดียวกัน)

## 9. การทดสอบ

### 9.1 Unit tests

```bash
npm run test
```

ครอบคลุม: ตรวจสอบรูปแบบเบอร์โทรไทย, Zod schema ของฟอร์มรายชื่อ, Zod schema หน้า
login, การตรวจสอบแถว CSV นำเข้า (ชื่อ/นามสกุล/เบอร์โทร/หน่วยงาน/ค่าที่ไม่ถูกต้อง)

**ผลการรันจริงล่าสุด: ผ่านทั้งหมด 27/27 เคส**

### 9.2 ตรวจสอบ RLS จริง (ต้องมี Supabase project + .env.local + seed แล้ว)

```bash
npm run test:rls
```

เข้าสู่ระบบจริงด้วยบัญชีตัวอย่างทั้ง 3 บทบาทจาก `npm run seed` แล้วลองอ่าน/เขียนข้อมูล
จริงผ่าน RLS เพื่อยืนยันว่า: viewer อ่านได้แต่เขียนไม่ได้และมองไม่เห็น audit log,
editor เพิ่ม/แก้ไขได้แต่เปลี่ยนบทบาทตัวเองไม่ได้และลบ (hard delete) ไม่ได้, admin
เข้าถึง audit log ได้

**ผลการรันจริงล่าสุด (กับ Supabase project จริง): ผ่านทั้งหมด 9/9 ข้อ** — รวมถึง
ยืนยันแล้วว่า editor ไม่สามารถ UPDATE บทบาทตัวเองเป็น admin ได้จริง (ไม่ใช่แค่ปุ่มถูกซ่อน)

### 9.3 E2E tests (Playwright)

```bash
npx playwright install   # ดาวน์โหลด browser ครั้งแรกเท่านั้น
npm run seed             # ให้มีบัญชี/รายชื่อตัวอย่างสำหรับ spec อ้างอิง
npm run test:e2e
```

ครอบคลุม (`tests/e2e/`): เข้าสู่ระบบ/ออกจากระบบ, ค้นหาชื่อภาษาไทยแบบไม่เต็มคำ,
ค้นหาด้วยเบอร์โทรบางส่วน, เปิดดูรายละเอียดบุคคล, เพิ่มรายชื่อโดย editor, viewer
ถูกกันไม่ให้เข้าหน้าจัดการรายชื่อ, admin เข้าหน้าผู้ดูแลระบบได้, responsive layout
(bottom nav บนมือถือ/sidebar บนเดสก์ท็อป), empty state เมื่อค้นหาไม่พบ

**ผลการรันจริงล่าสุด (กับ Supabase project จริง + dev server จริง): ผ่านทั้งหมด 14/14 เคส**
(ระหว่างพัฒนาเจอ 3 เคสที่ล้มเหลวเพราะตัว test เองอ้างอิง selector ผิด — เช่น
`getByRole('alert')` ชนกับ route-announcer ของ Next.js, และ label ที่มี `*`
ทำให้ `getByLabel` แบบ exact match ไม่ตรง — แก้ไขแล้วทั้งหมด ไม่ใช่บั๊กของแอป)

## 10. Backup และ Restore

ใช้เครื่องมือมาตรฐานของ Supabase/Postgres:

**Backup:**
```bash
# ผ่าน Supabase Dashboard: Database > Backups (รายวันอัตโนมัติสำหรับ paid plan)
# หรือ pg_dump ตรงด้วย connection string จาก Project Settings > Database
pg_dump "postgresql://postgres:[password]@[host]:5432/postgres" -F c -f backup.dump
```

**Restore:**
```bash
pg_restore --clean --if-exists -d "postgresql://postgres:[password]@[host]:5432/postgres" backup.dump
```

⚠️ ควรทดสอบ restore บน Supabase project แยกต่างหาก (staging) ก่อนทำกับ production จริงเสมอ

## 11. ข้อจำกัดและงานที่ยังไม่เสร็จ

สิ่งที่ **ทำเสร็จแล้วและทดสอบจริงแล้ว**: โครงสร้าง DB + migrations + RLS ครบทุกตาราง
(deploy จริงบน Supabase project `phonebookcsd2`), Server Actions ครบทุก flow (auth,
contacts CRUD+soft-delete, favorites, departments, admin users/roles, audit log,
CSV import+preview+dedup), UI ทุกหน้าตาม spec (A-E) พร้อม responsive +
loading/empty/error state, บัญชี Admin จริงใช้งานได้, build production ผ่านจริง
(type-check + lint สะอาด) — **unit tests 27/27, RLS verification 9/9, E2E 14/14
ผ่านทั้งหมดกับฐานข้อมูลจริง** (รายละเอียดหัวข้อ 9)

สิ่งที่ **ยังไม่เสร็จ/เป็นข้อจำกัด** (ควรทำต่อก่อนเปิดใช้งานในวงกว้าง):

1. **Realtime Subscription** ยังไม่เปิดใช้ — ปัจจุบันใช้ revalidate หลังบันทึก (ตามที่ spec
   ระบุให้เริ่มจากวิธีนี้ก่อน) schema/RLS ออกแบบรองรับการเพิ่ม Supabase Realtime ได้ภายหลังโดยไม่ต้องแก้ตาราง
2. **รองรับเฉพาะไฟล์ CSV** — โค้ด import แยก validate/preview/confirm ไว้พร้อมต่อขยาย
   เป็น `.xlsx` (เช่นด้วย `xlsx`/`exceljs`) แต่ยังไม่ได้เขียนตัวอ่านไฟล์ Excel จริง
3. **ไม่มีหน้า "เปลี่ยนรหัสผ่านตนเอง" หรือ "ลืมรหัสผ่าน"** — ปัจจุบัน admin ต้องสร้าง/รีเซ็ต
   บัญชีผ่านสคริปต์ที่ใช้ service role key เท่านั้น (ตั้งใจให้ "ไม่เปิดสมัครเอง") ควรเพิ่ม
   Supabase Auth password-reset flow ตามมาตรฐานก่อนใช้งานจริง
4. **ยังไม่ได้ตั้งค่า custom SMTP** สำหรับ Supabase Auth (เช่น reset password, magic
   link ในอนาคต) — ค่าเริ่มต้นของ Supabase มี rate limit ต่ำ ไม่เหมาะกับ production จริง
5. **ข้อมูลตัวอย่าง (seed) ที่อยู่ในฐานข้อมูลตอนนี้คือข้อมูลสมมติทั้งหมด** (บัญชี
   `*.demo@example.org`, รายชื่อ 5 คน) — ควรลบออกก่อนเปิดใช้งานจริงกับข้อมูลองค์กร
   (`DELETE FROM contacts WHERE email LIKE '%.demo@example.org'` และลบบัญชีผ่าน
   หน้า Admin > ผู้ใช้งาน)
6. **จำนวนรายชื่อสูงสุดต่อการนำเข้า CSV ครั้งเดียว** จำกัดไว้ที่ 2,000 แถวเพื่อกันคำขอค้างนาน
   — หากต้องนำเข้าไฟล์ใหญ่กว่านี้ให้แบ่งไฟล์ หรือปรับค่า `MAX_ROWS` ใน `src/lib/actions/import.ts`
7. **การนับผลค้นหา (`count: "exact"`)** จะช้าลงเมื่อข้อมูลมีหลักหลายแสนแถว — หากองค์กรมีข้อมูล
   ขนาดใหญ่มาก ควรพิจารณาเปลี่ยนเป็น `count: "estimated"` หรือทำ cursor pagination
8. **ยังไม่มี rate-limiting ที่หน้า login** ฝั่งแอป (อิง Supabase Auth's ภายในเท่านั้น) — หากต้องการ
   ป้องกัน brute-force เพิ่มเติมควรใส่ที่ระดับ reverse proxy/WAF หรือ Supabase Auth rate limit settings
9. **หน้าโปรไฟล์ผู้ใช้ปัจจุบัน** (เปลี่ยนชื่อที่แสดง/ภาษา) ยังไม่มี — ปัจจุบัน `display_name`
   แก้ไขได้โดย admin เท่านั้นผ่านหน้า `/admin/users`

## 12. หมายเหตุด้านความปลอดภัย

- `SUPABASE_SERVICE_ROLE_KEY` ใช้เฉพาะไฟล์ที่มี `import "server-only"` กำกับ
  (`src/lib/supabase/admin.ts`) และสคริปต์ `scripts/*.ts` เท่านั้น — ไม่ถูกส่งไปยัง browser
- ทุก Server Action ตรวจสอบสิทธิ์ซ้ำด้วย `requireSession()`/`requireRole()` ก่อนแตะฐานข้อมูล
  ไม่เชื่อค่า role ใดๆ ที่ client ส่งมา
- Audit log (`audit_logs`) เขียนได้จาก SECURITY DEFINER triggers ในฐานข้อมูลเท่านั้น
  ไม่มี client role ใดมี policy ให้ insert/update/delete ตรงได้ — ผู้ใช้ทั่วไปไม่สามารถ
  แก้ไข/ลบประวัติของตนเองได้ตามข้อกำหนด
- ข้อมูลตัวอย่างทั้งหมดใน `scripts/seed.ts` และไฟล์ template เป็น**ข้อมูลสมมติ**
  ไม่ใช่ข้อมูลบุคคลจริง
