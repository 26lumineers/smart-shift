import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * บุคลากร 15 คน (MT 11 / Asst 4)
 * ข้อจำกัดเฉพาะบุคคลเก็บเป็นข้อมูล ไม่ hardcode ในโค้ด
 * - allowedShifts: JSON array รหัสเวรที่ลงได้ (เช่น ["CKD"] หมายถึงลงได้เฉพาะ CKD)
 *   ค่าว่าง [] = ลงได้ทุกเวรตามประเภทตัวเอง
 * - flags: JSON object ข้อจำกัดพิเศษ เช่น { "noNight": true } = ห้ามเวรดึกทุกกรณี
 */
export const staff = sqliteTable("staff", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNo: integer("order_no").notNull().unique(),
  name: text("name").notNull(),
  roleType: text("role_type", { enum: ["MT", "ASST"] }).notNull(),
  allowedShifts: text("allowed_shifts").notNull().default("[]"),
  flags: text("flags").notNull().default("{}"),
  phone: text("phone"),
  pinHash: text("pin_hash"),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

/**
 * ประเภทเวรและเวลา (แก้ไขได้ผ่าน DB ไม่ hardcode)
 * PK = (code, appliesTo) เพราะรหัสเดียวกันเวลาต่างกันตามประเภท
 * เช่น ช1 ของ MT = 08.00-16.00 แต่ ช1 ของ Asst = 07.00-15.00
 */
export const shiftTypes = sqliteTable(
  "shift_types",
  {
    code: text("code").notNull(),
    appliesTo: text("applies_to", { enum: ["MT", "ASST"] }).notNull(),
    label: text("label").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    hours: real("hours").notNull(),
    weekdayOnly: integer("weekday_only", { mode: "boolean" })
      .notNull()
      .default(false),
    holidayOnly: integer("holiday_only", { mode: "boolean" })
      .notNull()
      .default(false),
    sortNo: integer("sort_no").notNull().default(0),
    note: text("note"),
  },
  (t) => [primaryKey({ columns: [t.code, t.appliesTo] })],
);

/** วันหยุดนักขัตฤกษ์ (Admin บันทึกเอง) ปฏิบัติเหมือนวันอาทิตย์ */
export const holidays = sqliteTable("holidays", {
  date: text("date").primaryKey(), // ISO YYYY-MM-DD
  name: text("name").notNull(),
});

/** คำขอ OFF (ไม่เอาเวร) / ลา */
export const requests = sqliteTable("requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id),
  date: text("date").notNull(), // ISO YYYY-MM-DD
  type: text("type", { enum: ["OFF", "LEAVE"] }).notNull(),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** ตารางเวรรายเดือน */
export const schedules = sqliteTable("schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  yearMonth: text("year_month").notNull().unique(), // YYYY-MM
  status: text("status", { enum: ["DRAFT", "PUBLISHED"] })
    .notNull()
    .default("DRAFT"),
  seed: text("seed"),
  generatedAt: integer("generated_at", { mode: "timestamp_ms" }),
});

/**
 * ช่องเวร: 1 คน ได้หลายเวรต่อวัน (ควบเวรวันหยุด เช้า+บ่าย/ดึก)
 * แต่ 1 คน 1 วัน ห้ามมีรหัสเวรซ้ำ
 */
export const assignments = sqliteTable(
  "assignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    scheduleId: integer("schedule_id")
      .notNull()
      .references(() => schedules.id),
    date: text("date").notNull(),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id),
    shiftCode: text("shift_code").notNull(),
    locked: integer("locked", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    uniqueIndex("assignments_schedule_staff_date_code_uq").on(
      t.scheduleId,
      t.staffId,
      t.date,
      t.shiftCode,
    ),
  ],
);

/** ค่าตั้งค่าระบบ เช่น smc_pointer, off_limit_per_day, ค่าชั่วโมงถ่วงน้ำหนัก */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(), // JSON
});
