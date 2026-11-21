/**
 * Seed ข้อมูลลง D1 แบบ local (ไฟล์ .wrangler/state ของ wrangler d1 --local)
 * รัน: npm run seed
 * - รายชื่อ 15 คน + ประเภทเวร + วันหยุด + settings
 * - PIN สุ่ม 6 หลัก hash แล้วพิมพ์ทาง console ครั้งเดียว (ไม่เก็บใน repo)
 * - ตารางเวรตัวอย่าง ต.ค. + พ.ย. 2569 จาก lib/demo-schedule
 * รันซ้ำ = ล้างข้อมูลเดิมทั้งหมดแล้ว seed ใหม่ (PIN ใหม่ด้วย)
 */

import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/lib/db/schema";
import { hashPin, randomPin } from "../src/lib/auth/pin";
import {
  DEFAULT_SETTINGS,
  DEMO_MONTHS,
  DEMO_REQUESTS_SEED,
  HOLIDAYS_SEED,
  SHIFT_TYPES_SEED,
  STAFF_SEED,
} from "../src/lib/demo-data";
import {
  emptyCarry,
  generateDemoMonth,
  type DayCarry,
} from "../src/lib/demo-schedule";

function findLocalD1Sqlite(): string {
  const root = path.resolve(import.meta.dirname, "..");
  const dir = path.join(root, ".wrangler", "state", "v3", "d1");
  const files: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".sqlite")) files.push(full);
    }
  };
  walk(dir);
  if (files.length === 0) {
    throw new Error(
      `ไม่พบไฟล์ D1 local ใน ${dir}\n` +
        "ให้รัน `npm run db:migrate:local` ก่อนแล้วค่อย seed",
    );
  }
  // ถ้ามีหลายไฟล์ เอาไฟล์ใหม่สุด
  files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return files[0];
}

async function main() {
  const sqlitePath = findLocalD1Sqlite();
  console.log(`ใช้ฐานข้อมูล local: ${sqlitePath}\n`);
  const sqlite = new Database(sqlitePath);
  const db = drizzle(sqlite, { schema });

  // ล้างข้อมูลเดิม
  for (const table of [
    "assignments",
    "schedules",
    "requests",
    "settings",
    "holidays",
    "shift_types",
    "staff",
  ]) {
    sqlite.exec(`DELETE FROM ${table}`);
  }
  sqlite.exec("DELETE FROM sqlite_sequence WHERE name IN ('staff','schedules','requests','assignments')");

  // ---------- รายชื่อ + PIN ----------
  const pinTable: { name: string; pin: string }[] = [];
  for (const s of STAFF_SEED) {
    const pin = randomPin();
    pinTable.push({ name: s.name, pin });
    await db.insert(schema.staff).values({
      orderNo: s.orderNo,
      name: s.name,
      roleType: s.roleType,
      allowedShifts: JSON.stringify(s.allowedShifts),
      flags: JSON.stringify(s.flags),
      phone: null, // Admin กรอกเองผ่านหน้าจัดการ (เฟสถัดไป)
      pinHash: await hashPin(pin),
      isAdmin: s.isAdmin,
      active: true,
    });
  }
  const staffRows = await db.select().from(schema.staff);
  const staffIdByOrder = new Map(staffRows.map((r) => [r.orderNo, r.id]));

  // ---------- ประเภทเวร ----------
  await db.insert(schema.shiftTypes).values(
    SHIFT_TYPES_SEED.map((t) => ({
      code: t.code,
      appliesTo: t.appliesTo,
      label: t.label,
      startTime: t.startTime,
      endTime: t.endTime,
      hours: t.hours,
      weekdayOnly: t.weekdayOnly,
      holidayOnly: t.holidayOnly,
      sortNo: t.sortNo,
      note: t.note,
    })),
  );

  // ---------- วันหยุด + settings + คำขอ ----------
  await db.insert(schema.holidays).values(HOLIDAYS_SEED);
  await db.insert(schema.settings).values(
    Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
      key,
      value: JSON.stringify(value),
    })),
  );
  await db.insert(schema.requests).values(
    DEMO_REQUESTS_SEED.map((r) => ({
      staffId: staffIdByOrder.get(r.orderNo)!,
      date: r.date,
      type: r.type,
      note: r.note,
      createdAt: new Date(),
    })),
  );

  // ---------- ตารางเวรตัวอย่าง ----------
  const genStaff = staffRows.map((r) => ({
    id: r.id,
    orderNo: r.orderNo,
    roleType: r.roleType,
    allowedShifts: JSON.parse(r.allowedShifts) as string[],
  }));
  const requests = DEMO_REQUESTS_SEED.map((r) => ({
    staffId: staffIdByOrder.get(r.orderNo)!,
    date: r.date,
    type: r.type,
  }));

  let smcPointer = DEFAULT_SETTINGS.smc_pointer as number;
  let carry: DayCarry = emptyCarry();
  let totalAssignments = 0;
  const allGaps: string[] = [];

  for (const yearMonth of DEMO_MONTHS) {
    const out = generateDemoMonth({
      yearMonth,
      staff: genStaff,
      holidays: HOLIDAYS_SEED.map((h) => h.date),
      requests,
      smcPointer,
      carry,
    });
    const [sched] = await db
      .insert(schema.schedules)
      .values({
        yearMonth,
        status: "PUBLISHED",
        seed: null, // ตารางตัวอย่าง deterministic ไม่ใช่ตัวจัดเวรจริง
        generatedAt: new Date(),
      })
      .returning();
    await db.insert(schema.assignments).values(
      out.assignments.map((a) => ({
        scheduleId: sched.id,
        date: a.date,
        staffId: a.staffId,
        shiftCode: a.shiftCode,
        locked: false,
      })),
    );
    totalAssignments += out.assignments.length;
    allGaps.push(...out.gaps);
    smcPointer = out.smcPointer;
    carry = out.carry;
    console.log(
      `ตาราง ${yearMonth}: ${out.assignments.length} ช่อง${out.gaps.length ? ` (ช่องว่าง ${out.gaps.length})` : ""}`,
    );
  }

  // อัปเดตตัวชี้ SMC ล่าสุด
  await db
    .update(schema.settings)
    .set({ value: JSON.stringify(smcPointer) })
    .where(eq(schema.settings.key, "smc_pointer"));

  // ---------- สรุป ----------
  console.log(`\nรวม ${totalAssignments} ช่องเวร`);
  if (allGaps.length > 0) {
    console.log("!! มีช่องที่จัดไม่ได้:");
    for (const g of allGaps) console.log(`   ${g}`);
  }

  console.log("\n=== โปรดตรวจการสะกดชื่อกับแบบฟอร์ม F-OPR-012 ===");
  for (const s of staffRows) {
    console.log(`   ${String(s.orderNo).padStart(2)}. ${s.name}`);
  }

  console.log("\n=== PIN เริ่มต้น (เก็บไว้ใช้เอง ห้ามลง repo) ===");
  for (const p of pinTable) {
    console.log(`   ${p.name}  →  ${p.pin}`);
  }
  console.log(
    "\nเบอร์โทรยังไม่ได้กรอก (NULL) — ให้ Admin เพิ่มภายหลัง\n",
  );

  sqlite.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
