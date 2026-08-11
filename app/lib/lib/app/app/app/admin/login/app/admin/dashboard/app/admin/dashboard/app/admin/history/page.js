import { getHistorySessions, getCandidates } from "@/lib/db";
import HistoryClient from "./HistoryClient";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const sessions = await getHistorySessions();
  const withCandidates = await Promise.all(
    sessions.map(async (s) => ({
      ...s,
      candidates: await getCandidates(s.id),
    }))
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <HistoryClient initialSessions={withCandidates} />
    </main>
  );
}
