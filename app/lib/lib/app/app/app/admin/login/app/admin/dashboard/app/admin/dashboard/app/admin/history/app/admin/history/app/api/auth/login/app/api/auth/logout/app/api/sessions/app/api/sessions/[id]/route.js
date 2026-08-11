import { NextResponse } from "next/server";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { getSessionById, getCandidates, deleteSession } from "@/lib/db";

async function requireAdmin(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return token ? await verifyAdminToken(token) : false;
}

export async function GET(request, { params }) {
  const session = await getSessionById(params.id);
  if (!session) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const candidates = await getCandidates(params.id);
  return NextResponse.json({ session, candidates });
}

export async function DELETE(request, { params }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await deleteSession(params.id);
  return NextResponse.json({ ok: true });
        }
