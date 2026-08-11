import { NextResponse } from "next/server";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { endSession } from "@/lib/db";

export async function POST(request, { params }) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isAdmin = token ? await verifyAdminToken(token) : false;
  if (!isAdmin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await endSession(params.id);
  return NextResponse.json({ ok: true });
}
