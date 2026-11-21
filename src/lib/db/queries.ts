import { asc, eq, like } from "drizzle-orm";
import { isWeekend, monthDays } from "@/lib/dates";
import { getDb } from "./client";
import * as schema from "./schema";

export type CellEntry =
  | { kind: "shifts"; codes: string[] } // ควบเวร = หลาย code
  | { kind: "LEAVE" }
  | { kind: "OFF" };

export type StaffInfo = {
  id: number;
  orderNo: number;
  name: string;
  roleType: "MT" | "ASST";
  phone: string | null;
};

export type MonthView = {
  yearMonth: string;
  exists: boolean; // มีตารางเดือนนี้ไหม
  status: "DRAFT" | "PUBLISHED" | null;
  staff: StaffInfo[];
  days: { date: string; weekend: boolean; holiday: string | null }[];
  cells: Map<string, CellEntry>; // key: `${staffId}|${date}`
};

export function cellKey(staffId: number, date: string) {
  return `${staffId}|${date}`;
}

export async function getMonthView(yearMonth: string): Promise<MonthView> {
  const db = getDb();

  const staffRows = await db
    .select()
    .from(schema.staff)
    .where(eq(schema.staff.active, true))
    .orderBy(asc(schema.staff.orderNo));

  const days = monthDays(yearMonth).map((date) => ({
    date,
    weekend: isWeekend(date),
    holiday: null as string | null,
  }));

  // วันหยุดนักขัตฤกษ์ = ปฏิบัติเหมือนวันอาทิตย์
  const holidayRows = await db
    .select()
    .from(schema.holidays)
    .where(like(schema.holidays.date, `${yearMonth}%`));
  const holidayByDate = new Map(holidayRows.map((h) => [h.date, h.name]));
  for (const d of days) {
    const h = holidayByDate.get(d.date);
    if (h) {
      d.holiday = h;
      d.weekend = true;
    }
  }

  const cells = new Map<string, CellEntry>();
  const [sched] = await db
    .select()
    .from(schema.schedules)
    .where(eq(schema.schedules.yearMonth, yearMonth));
  if (sched) {
    const asg = await db
      .select()
      .from(schema.assignments)
      .where(eq(schema.assignments.scheduleId, sched.id));
    const codes = new Map<string, string[]>();
    for (const a of asg) {
      const k = cellKey(a.staffId, a.date);
      if (!codes.has(k)) codes.set(k, []);
      codes.get(k)!.push(a.shiftCode);
    }
    for (const [k, v] of codes) {
      cells.set(k, { kind: "shifts", codes: v });
    }
  }

  // ลา/OFF แสดงเฉพาะช่องที่ไม่มีเวร (กฎ 11 ทำให้ไม่ชนกันอยู่แล้ว)
  const reqRows = await db
    .select()
    .from(schema.requests)
    .where(like(schema.requests.date, `${yearMonth}%`));
  for (const r of reqRows) {
    const k = cellKey(r.staffId, r.date);
    if (!cells.has(k)) {
      cells.set(k, r.type === "LEAVE" ? { kind: "LEAVE" } : { kind: "OFF" });
    }
  }

  return {
    yearMonth,
    exists: !!sched,
    status: sched?.status ?? null,
    staff: staffRows.map((s) => ({
      id: s.id,
      orderNo: s.orderNo,
      name: s.name,
      roleType: s.roleType,
      phone: s.phone,
    })),
    days,
    cells,
  };
}

export type ShiftTypeInfo = {
  code: string;
  appliesTo: "MT" | "ASST";
  label: string;
  startTime: string;
  endTime: string;
  note: string | null;
};

/** ตารางอธิบายเวลาเวรสำหรับท้ายตาราง (F-OPR-012) */
export async function getShiftLegend(): Promise<ShiftTypeInfo[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.shiftTypes)
    .orderBy(asc(schema.shiftTypes.appliesTo), asc(schema.shiftTypes.sortNo));
  return rows.map((r) => ({
    code: r.code,
    appliesTo: r.appliesTo,
    label: r.label,
    startTime: r.startTime,
    endTime: r.endTime,
    note: r.note,
  }));
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, key));
  if (!row) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}
