"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-gradient px-4">
      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-sm">
        <h1 className="text-2xl font-extrabold text-center text-brand-redDark mb-6">
          🔐 เข้าสู่ระบบแอดมิน
        </h1>
        <input
          type="password"
          className="input mb-4"
          placeholder="รหัสผ่านแอดมิน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
    </main>
  );
    }
