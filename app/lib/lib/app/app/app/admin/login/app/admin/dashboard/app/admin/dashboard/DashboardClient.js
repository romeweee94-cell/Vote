"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const emptyCandidate = () => ({ name: "", file: null, preview: "" });

export default function DashboardClient({ initialSession, initialCandidates }) {
  const [session, setSession] = useState(initialSession);
  const [candidates, setCandidates] = useState(initialCandidates);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [newCandidates, setNewCandidates] = useState([emptyCandidate(), emptyCandidate()]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  function updateCandidate(idx, patch) {
    setNewCandidates((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    );
  }

  function addCandidateRow() {
    setNewCandidates((prev) => [...prev, emptyCandidate()]);
  }

  function removeCandidateRow(idx) {
    setNewCandidates((prev) => prev.filter((_, i) => i !== idx));
  }

  function onFileChange(idx, file) {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    updateCandidate(idx, { file, preview });
  }

  async function uploadFile(file) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) throw new Error("อัพโหลดรูปไม่สำเร็จ");
    const data = await res.json();
    return data.url;
  }

  async function createVote(e) {
    e.preventDefault();
    setError("");

    const valid = newCandidates.filter((c) => c.name.trim());
    if (!title.trim() || !startTime || valid.length < 2) {
      setError("กรุณากรอกชื่อรอบโหวต เวลาเริ่ม และผู้เข้าแข่งขันอย่างน้อย 2 คน");
      return;
    }

    setCreating(true);
    try {
      const candidatesPayload = [];
      for (const c of valid) {
        let imageUrl = "";
        if (c.file) {
          imageUrl = await uploadFile(c.file);
        }
        candidatesPayload.push({ name: c.name.trim(), imageUrl });
      }

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          startTime: new Date(startTime).toISOString(),
          candidates: candidatesPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "สร้างรอบโหวตไม่สำเร็จ");
      } else {
        setSession(data.session);
        setCandidates(
          candidatesPayload.map((c, i) => ({ id: `tmp-${i}`, ...c, vote_count: 0 }))
        );
        setTitle("");
        setStartTime("");
        setNewCandidates([emptyCandidate(), emptyCandidate()]);
        router.refresh();
      }
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setCreating(false);
    }
  }

  async function endVote() {
    if (!confirm("ยืนยันปิดรอบโหวตนี้? ผลจะถูกเก็บไว้ในประวัติ")) return;
    await fetch(`/api/sessions/${session.id}/end`, { method: "POST" });
    router.refresh();
    setSession(null);
    setCandidates([]);
  }

  async function deleteVote() {
    if (!confirm("ยืนยันลบรอบโหวตนี้ถาวร? ข้อมูลจะหายไปทั้งหมด")) return;
    await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
    router.refresh();
    setSession(null);
    setCandidates([]);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold text-brand-redDark">แผงควบคุมแอดมิน</h1>
        <div className="flex gap-3">
          <Link href="/admin/history" className="btn-outline">
            ประวัติย้อนหลัง
          </Link>
          <button onClick={logout} className="btn-outline">
            ออกจากระบบ
          </button>
        </div>
      </div>

      {session ? (
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">{session.title}</h2>
              <p className="text-sm text-gray-500">
                สถานะ:{" "}
                <span className="font-semibold text-brand-red">
                  {session.status === "scheduled" ? "รอเริ่ม" : "กำลังเปิดโหวต"}
                </span>
                {" • "}เริ่ม {new Date(session.start_time).toLocaleString("th-TH")}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={endVote} className="btn-outline text-sm">
                จบการโหวต
              </button>
              <button
                onClick={deleteVote}
                className="text-sm px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                ลบ
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {candidates.map((c) => (
              <div key={c.id} className="flex items-center gap-3 border rounded-xl p-3">
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image_url}
                    alt={c.name}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-brand-yellowLight/50" />
                )}
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.vote_count} คะแนน</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 mb-8">ยังไม่มีรอบโหวตที่ใช้งานอยู่ กรุณาสร้างใหม่ด้านล่าง</p>
      )}

      {!session && (
        <form onSubmit={createVote} className="card p-6">
          <h2 className="font-bold text-lg mb-4">➕ สร้างรอบโหวตใหม่</h2>

          <label className="block text-sm font-semibold mb-1">ชื่อรอบโหวต</label>
          <input
            className="input mb-4"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น โหวตภาพถ่ายยอดเยี่ยมประจำเดือน"
          />

          <label className="block text-sm font-semibold mb-1">วันเวลาที่จะเริ่มโหวต</label>
          <input
            type="datetime-local"
            className="input mb-6"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />

          <label className="block text-sm font-semibold mb-2">ผู้เข้าแข่งขัน / รูปภาพ</label>
          <div className="space-y-3 mb-4">
            {newCandidates.map((c, idx) => (
              <div key={idx} className="flex items-center gap-3 border rounded-xl p-3">
                {c.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.preview} alt="" className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-brand-yellowLight/50 flex items-center justify-center text-[10px] text-gray-400">
                    รูปภาพ
                  </div>
                )}
                <input
                  className="input flex-1"
                  placeholder={`ชื่อผู้เข้าแข่งขัน ${idx + 1}`}
                  value={c.name}
                  onChange={(e) => updateCandidate(idx, { name: e.target.value })}
                />
                <label className="btn-outline text-sm cursor-pointer whitespace-nowrap">
                  เลือกรูป
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFileChange(idx, e.target.files?.[0])}
                  />
                </label>
                {newCandidates.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeCandidateRow(idx)}
                    className="text-gray-400 hover:text-red-600 px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button type="button" onClick={addCandidateRow} className="btn-outline text-sm mb-6">
            + เพิ่มผู้เข้าแข่งขัน
          </button>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <button className="btn-primary w-full" disabled={creating}>
            {creating ? "กำลังสร้าง..." : "เริ่มสร้างรอบโหวต"}
          </button>
        </form>
      )}
    </div>
  );
    }
