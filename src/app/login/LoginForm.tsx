"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { loginAction, type LoginResult } from "@/lib/actions/auth";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState: LoginResult = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />

      <Field label="อีเมล" htmlFor="email" error={state.fieldErrors?.email} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="name@organization.go.th"
          error={!!state.fieldErrors?.email}
          required
        />
      </Field>

      <Field label="รหัสผ่าน" htmlFor="password" error={state.fieldErrors?.password} required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={!!state.fieldErrors?.password}
          required
        />
      </Field>

      {state.error && (
        <div role="alert" className="rounded-md bg-red-50 px-3 py-2.5 text-sm text-danger">
          {state.error}
        </div>
      )}

      <Button type="submit" size="lg" loading={pending} className="mt-1 w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        เข้าสู่ระบบ
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        ระบบนี้ไม่เปิดให้สมัครสมาชิกเอง หากยังไม่มีบัญชีผู้ใช้ กรุณาติดต่อผู้ดูแลระบบ
      </p>
    </form>
  );
}
