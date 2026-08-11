import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { castVote, getCurrentSession } from "@/lib/db";

const VOTER_COOKIE = "voter_id";

export async function POST(request) {
  const { candidateId } = await request.json();
  if (!candidateId) {
    return NextResponse.json({ error: "missing candidateId" }, { status: 400 });
  }

  const session = await getCurrentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json(
      { error: "ขณะนี้ยังไม่เปิดให้โหวต" },
      { status: 400 }
    );
  }

  let voterToken = request.cookies.get(VOTER_COOKIE)?.value;
  if (!voterToken) {
    voterToken = randomUUID();
  }

  try {
    await castVote({ sessionId: session.id, candidateId, voterToken });
  } catch (err) {
    if (err.message === "ALREADY_VOTED") {
      return NextResponse.json(
        { error: "คุณโหวตไปแล้วสำหรับรอบนี้" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(VOTER_COOKIE, voterToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
