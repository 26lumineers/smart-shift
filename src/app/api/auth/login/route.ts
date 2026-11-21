import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { verifyPin } from "@/lib/auth/pin";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { isBlocked, recordFailure, reset, sweep } from "@/lib/auth/rate-limit";

export async function POST(req: Request) {
  sweep();
  let body: { staffId?: number; pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const staffId = Number(body.staffId);
  const pin = String(body.pin ?? "");
  if (!Number.isInteger(staffId) || !/^\d{4,8}$/.test(pin)) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const key = `login:${staffId}`;
  if (isBlocked(key)) {
    return NextResponse.json(
      { error: "พยายามเข้าสู่ระบบบ่อยเกินไป โปรดลองใหม่ใน 5 นาที" },
      { status: 429 },
    );
  }

  const db = getDb();
  const [staff] = await db
    .select()
    .from(schema.staff)
    .where(eq(schema.staff.id, staffId));

  if (!staff || !staff.active) {
    return NextResponse.json({ error: "ไม่พบรายชื่อนี้" }, { status: 401 });
  }
  if (!staff.pinHash) {
    return NextResponse.json(
      { error: "ผู้ใช้นี้ยังไม่ได้ตั้ง PIN โปรดติดต่อ Admin" },
      { status: 401 },
    );
  }

  const ok = await verifyPin(pin, staff.pinHash);
  if (!ok) {
    const remaining = recordFailure(key);
    return NextResponse.json(
      {
        error:
          remaining > 0
            ? `PIN ไม่ถูกต้อง (เหลือโอกาสอีก ${remaining} ครั้ง)`
            : "PIN ไม่ถูกต้อง โปรดลองใหม่ใน 5 นาที",
      },
      { status: 401 },
    );
  }

  reset(key);
  const token = await createSessionToken({
    staffId: staff.id,
    name: staff.name,
    role: staff.roleType,
    admin: staff.isAdmin,
  });
  const res = NextResponse.json({ ok: true, name: staff.name, admin: staff.isAdmin });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
