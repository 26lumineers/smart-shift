import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { hashPin, isValidPin, PIN_LENGTH, verifyPin } from "@/lib/auth/pin";
import { getSession } from "@/lib/auth/session";
import { isBlocked, recordFailure, reset, sweep } from "@/lib/auth/rate-limit";

/** เปลี่ยน PIN ของตัวเอง: ต้องมี session + PIN ปัจจุบันถูกต้อง */
export async function POST(req: Request) {
  sweep();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  }

  let body: { currentPin?: string; newPin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const currentPin = String(body.currentPin ?? "");
  const newPin = String(body.newPin ?? "");
  if (!isValidPin(currentPin) || !isValidPin(newPin)) {
    return NextResponse.json(
      { error: `PIN ต้องเป็นตัวเลข ${PIN_LENGTH} หลัก` },
      { status: 400 },
    );
  }

  const key = `pin-change:${session.staffId}`;
  if (isBlocked(key)) {
    return NextResponse.json(
      { error: "ใส่ PIN ผิดบ่อยเกินไป โปรดลองใหม่ใน 5 นาที" },
      { status: 429 },
    );
  }

  const db = getDb();
  const [staff] = await db
    .select()
    .from(schema.staff)
    .where(eq(schema.staff.id, session.staffId));

  if (!staff || !staff.active) {
    return NextResponse.json({ error: "ไม่พบบัญชีนี้" }, { status: 401 });
  }
  if (!staff.pinHash) {
    return NextResponse.json(
      { error: "บัญชีนี้ยังไม่ได้ตั้ง PIN โปรดติดต่อ Admin" },
      { status: 401 },
    );
  }

  const ok = await verifyPin(currentPin, staff.pinHash);
  if (!ok) {
    const remaining = recordFailure(key);
    return NextResponse.json(
      {
        error:
          remaining > 0
            ? `PIN ปัจจุบันไม่ถูกต้อง (เหลือโอกาสอีก ${remaining} ครั้ง)`
            : "PIN ปัจจุบันไม่ถูกต้อง โปรดลองใหม่ใน 5 นาที",
      },
      { status: 401 },
    );
  }

  reset(key);
  await db
    .update(schema.staff)
    .set({ pinHash: await hashPin(newPin) })
    .where(eq(schema.staff.id, session.staffId));

  return NextResponse.json({ ok: true });
}