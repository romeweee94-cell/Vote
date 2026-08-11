import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "admin_session";

function getSecretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createAdminToken() {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecretKey());
}

export async function verifyAdminToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export function checkPassword(password) {
  const expected = process.env.ADMIN_PASSWORD || "";
  return password === expected;
}

export { COOKIE_NAME };
