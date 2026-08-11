import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "admin_session";

function getSecretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/admin/dashboard") || pathname.startsWith("/admin/history");

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== "admin") throw new Error("not admin");
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/admin/history/:path*"],
};
