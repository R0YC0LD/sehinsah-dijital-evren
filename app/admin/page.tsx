import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const metadata: Metadata = {
  title: "Yönetim — Şehinşah",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="main">
      <AdminPanel />
    </main>
  );
}
