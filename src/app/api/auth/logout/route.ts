import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

/** ออกจากระบบ: ลบ cookie แล้วกลับหน้า login */
export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
