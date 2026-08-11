"use client";

import { useEffect, useMemo, useState } from "react";

function useCountdown(targetIso) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const target = new Date(targetIso).getTime();
  const diff = Math.max(0, target - now);
  const totalSec = Math.floor(diff / 1000);
  return {
    reached: diff <= 0,
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

export default function VoteClient({ initialSession, initialCandidates }) {
  const [session, setSession] = useState(initialSession);
  const [candidates, setCandidates] = useState(initialCandidates);
  const [votedId, setVotedId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const showCountdown = session && session.status === "scheduled";
  const countdown = useCountdown(session?.start_time || new Date().toISOString());

  useEffect(() => {
    if (showCountdown && countdown.reached) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown.reached]);

  async function refresh() {
    const res = await fetch("/api/sessions", { cache: "no-store" });
    const data = await res.json();
    setSession(data.session);
    if (data.session) {
      const detail = await fetch(`/api/sessions/${data.session.id}`, {
        cache: "no-store",
      }).then((r) => r.json());
      setCandidates(detail.candidates || []);
    }
  }

  async function vote(candidateId) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
      } else {
        setVotedId(candidateId);
        await refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  const totalVotes = useMemo(
    () => candidates.reduce((sum, c) => sum + c.vote_count, 0),
    [candidates]
  );

  if (!session) {
    return (
      <div className="card p-8 text-center text-gray-500">
        ขณะนี้ยังไม่มีรอบโหวตที่เปิดใช้งาน กรุณากลับมาใหม่ภายหลัง
      </div>
    );
  }

  return (
    <div>
      <div className="card p-6 mb-6 text-center">
        <h2 className="text-xl font-bold text-brand-red">{session.title}</h2>

        {session.status === "scheduled" && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">การโหวตจะเริ่มในอีก</p>
            <div className="flex justify-center gap-3 text-brand-redDark font-bold text-2xl">
              <span>{countdown.days}วัน</span>
              <span>{String(countdown.hours).padStart(2, "0")}:</span>
              <span>{String(countdown.minutes).padStart(2, "0")}:</span>
              <span>{String(countdown.seconds).padStart(2, "0")}</span>
            </div>
          </div>
        )}

        {session.status === "active" && (
          <p className="text-sm text-green-600 font-semibold mt-2">
            🟢 เปิดโหวตอยู่ • รวม {totalVotes} คะแนน
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        {candidates.map((c) => {
          const pct = totalVotes ? Math.round((c.vote_count / totalVotes) * 100) : 0;
          const isVoted = votedId === c.id;
          return (
            <div key={c.id} className="card overflow-hidden flex flex-col">
              <div className="aspect-square bg-brand-yellowLight/40">
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image_url}
                    alt={c.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    ไม่มีรูปภาพ
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-lg mb-2">{c.name}</h3>

                {session.status === "active" && (
                  <div className="mb-3">
                    <div className="h-2 bg-brand-yellowLight/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-gradient"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {c.vote_count} คะแนน ({pct}%)
                    </p>
                  </div>
                )}

                <button
                  className="btn-primary mt-auto"
                  disabled={session.status !== "active" || loading || votedId !== null}
                  onClick={() => vote(c.id)}
                >
                  {isVoted ? "โหวตแล้ว ✓" : "โหวต"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
        }
