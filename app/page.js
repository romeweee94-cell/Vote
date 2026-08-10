import { getCurrentSession, getCandidates } from "@/lib/db";
import VoteClient from "./VoteClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getCurrentSession();
  const candidates = session ? await getCandidates(session.id) : [];

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-redDark">
          🗳️ ระบบโหวตออนไลน์
        </h1>
        <p className="text-gray-500 mt-2">ร่วมโหวตให้กับตัวเลือกที่คุณชื่นชอบ</p>
      </header>

      <VoteClient initialSession={session} initialCandidates={candidates} />

      <footer className="text-center text-xs text-gray-400 mt-16">
        <a href="/admin/login" className="hover:text-brand-red">
          สำหรับผู้ดูแลระบบ
        </a>
      </footer>
    </main>
  );
    }
