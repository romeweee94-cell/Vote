import { getCurrentSession, getCandidates } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const candidates = session ? await getCandidates(session.id) : [];

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <DashboardClient initialSession={session} initialCandidates={candidates} />
    </main>
  );
}
