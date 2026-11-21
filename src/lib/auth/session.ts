import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const SESSION_COOKIE = "ss_session";
const SESSION_DAYS = 30;

export type SessionPayload = {
  staffId: number;
  name: string;
  role: "MT" | "ASST";
  admin: boolean;
};

function getSecret(): Uint8Array {
  const { env } = getCloudflareContext();
  const secret =
    (env as { SESSION_SECRET?: string }).SESSION_SECRET ??
    "dev-only-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(p: SessionPayload): Promise<string> {
  return new SignJWT({ name: p.name, role: p.role, admin: p.admin })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(p.staffId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const staffId = Number(payload.sub);
    if (!Number.isInteger(staffId)) return null;
    return {
      staffId,
      name: String(payload.name ?? ""),
      role: payload.role === "ASST" ? "ASST" : "MT",
      admin: payload.admin === true,
    };
  } catch {
    return null;
  }
}

/** อ่าน session ปัจจุบันจาก cookie (ใช้ใน server component / route handler) */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}
