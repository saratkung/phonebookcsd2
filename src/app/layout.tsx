import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const orgName = process.env.NEXT_PUBLIC_ORG_NAME || "องค์กร";

export const metadata: Metadata = {
  title: `สมุดโทรศัพท์ ${orgName}`,
  description: `ระบบสมุดโทรศัพท์กลางของ ${orgName}`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
