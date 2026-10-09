"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="th">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center font-sans">
        <p className="text-lg font-medium">เกิดข้อผิดพลาดร้ายแรง</p>
        <p className="text-sm text-gray-500">กรุณาโหลดหน้านี้ใหม่ หากยังพบปัญหากรุณาติดต่อผู้ดูแลระบบ</p>
        <button onClick={reset} className="rounded-md bg-red-800 px-4 py-2 text-sm text-white">
          ลองใหม่อีกครั้ง
        </button>
      </body>
    </html>
  );
}
