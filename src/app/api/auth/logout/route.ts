import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

/** ออกจากระบบ: ลบ cookie แล้วกลับหน้า login (POST เท่านั้น — GET ถูก Next prefetch แล้วลบ session) */
export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
