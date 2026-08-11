"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HistoryClient({ initialSessions }) {
  const [sessions, setSessions] = useState(initialSessions);
  const router = useRouter();

  async function remove(id) {
    if (!confirm("ยืนยันลบรอบโหวตนี้ถาวร?")) return;
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold text-brand-redDark">ประวัติการโหวต</h1>
        <Link href="/admin/dashboard" className="btn-outline">
          กลับแผงควบคุม
        </Link>
      </div>

      {sessions.length === 0 && (
        <p className="text-gray-500">ยังไม่มีประวัติการโหวตที่จบแล้ว</p>
      )}

      <div className="space-y-6">
        {sessions.map((s) => {
          const total = s.candidates.reduce((sum, c) => sum + c.vote_count, 0);
          const winner = [...s.candidates].sort((a, b) => b.vote_count - a.vote_count)[0];
          return (
            <div key={s.id} className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-bold text-lg">{s.title}</h2>
                  <p className="text-xs text-gray-500">
                    จบเมื่อ {new Date(s.ended_at).toLocaleString("th-TH")} • รวม {total} คะแนน
                  </p>
                </div>
                <button
                  onClick={() => remove(s.id)}
                  className="text-sm px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
                >
                  ลบ
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {s.candidates.map((c) => {
                  const pct = total ? Math.round((c.vote_count / total) * 100) : 0;
                  const isWinner = winner && c.id === winner.id && total > 0;
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center gap-3 border rounded-xl p-3 ${
                        isWinner ? "border-brand-yellow bg-brand-yellowLight/20" : ""
                      }`}
                    >
                      {c.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.image_url}
                          alt={c.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-brand-yellowLight/50" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {isWinner ? "🏆 " : ""}
                          {c.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {c.vote_count} คะแนน ({pct}%)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
