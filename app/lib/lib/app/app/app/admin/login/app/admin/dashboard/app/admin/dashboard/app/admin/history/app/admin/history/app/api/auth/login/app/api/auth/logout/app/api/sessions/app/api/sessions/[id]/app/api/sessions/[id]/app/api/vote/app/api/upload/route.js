import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isAdmin = token ? await verifyAdminToken(token) : false;
  if (!isAdmin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!file) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }

  const blob = await put(`vote-images/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
