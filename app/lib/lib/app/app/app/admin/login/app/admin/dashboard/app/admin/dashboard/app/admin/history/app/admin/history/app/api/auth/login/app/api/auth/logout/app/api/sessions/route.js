import { NextResponse } from "next/server";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { createSession, getCurrentSession, getHistorySessions } from "@/lib/db";

async function requireAdmin(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return token ? await verifyAdminToken(token) : false;
}

export async function GET(request) {
  const url = new URL(request.url);
  if (url.searchParams.get("history") === "1") {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const sessions = await getHistorySessions();
    return NextResponse.json({ sessions });
  }
  const session = await getCurrentSession();
  return NextResponse.json({ session });
}

export async function POST(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { title, startTime, candidates } = body;

  if (!title || !startTime || !Array.isArray(candidates) || candidates.length < 2) {
    return NextResponse.json(
      { error: "กรุณากรอกชื่อโหวต เวลาเริ่ม และผู้เข้าแข่งขันอย่างน้อย 2 คน" },
      { status: 400 }
    );
  }

  const session = await createSession({ title, startTime, candidates });
  return NextResponse.json({ session });
    }
