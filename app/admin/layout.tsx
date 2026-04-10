"use client";

import { useRouter } from "next/navigation";
import { adminLogout } from "@/actions/admin-auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    await adminLogout();
    router.push("/admin/login");
  }

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1 className="admin-header__title">Admin Dashboard</h1>
        <button
          type="button"
          className="big-button big-button--secondary admin-header__logout"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
