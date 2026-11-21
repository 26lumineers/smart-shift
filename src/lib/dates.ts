/** วันที่: เก็บใน DB เป็น ISO ค.ศ. (YYYY-MM-DD) แสดงผลเป็น พ.ศ. */

export const BE_OFFSET = 543;
const TZ = "Asia/Bangkok";

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/** ชื่อวันแบบไทย 0 = อาทิตย์ */
export const THAI_DAYS = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

/** วันนี้ (เวลาไทย) เป็น ISO YYYY-MM-DD */
export function todayISO(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA ให้ format YYYY-MM-DD
}

/** ปีพุทธศักราชจากปีค.ศ. */
export function beYear(adYear: number): number {
  return adYear + BE_OFFSET;
}

/** วันที่ ISO → วันในสัปดาห์ 0=อาทิตย์ ... 6=เสาร์ */
export function dayOfWeek(dateISO: string): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isWeekend(dateISO: string): boolean {
  const dow = dayOfWeek(dateISO);
  return dow === 0 || dow === 6;
}

/** "2026-10" → ทุกวันในเดือนเป็น ISO array */
export function monthDays(yearMonth: string): string[] {
  const [y, m] = yearMonth.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    days.push(`${yearMonth}-${String(d).padStart(2, "0")}`);
  }
  return days;
}

/** เดือนถัดไป "2026-10" → "2026-11" */
export function nextMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

/** เดือนก่อน "2026-10" → "2026-09" */
export function prevMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

/** วันถัดไปแบบ ISO */
export function nextDate(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

/** "2026-10" → "ตุลาคม 2569" */
export function monthLabelThai(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  return `${THAI_MONTHS[m - 1]} ${beYear(y)}`;
}

/** "2026-10-05" → "จันทร์ 5 ต.ค. 2569" */
export function dateLabelThai(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return `${THAI_DAYS[dayOfWeek(dateISO)]} ${d} ${THAI_MONTHS_SHORT[m - 1]} ${beYear(y)}`;
}

/** ตัวเลขวันที่อย่างเดียว (หัวคอลัมน์ตาราง) */
export function dayNumber(dateISO: string): number {
  return Number(dateISO.slice(8, 10));
}

/** ชื่อวันย่อ 2 ตัวอักษร สำหรับหัวคอลัมน์ตาราง */
export function dayShortThai(dateISO: string): string {
  return THAI_DAYS[dayOfWeek(dateISO)].slice(0, 2);
}

/** รูปแบบเดือนสำหรับ display เช่น ต.ค. 2569 */
export function monthShortThai(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  return `${THAI_MONTHS_SHORT[m - 1]} ${beYear(y)}`;
}

/** ตรวจว่าเป็นวันราชการ (จ-ศ ไม่ใช่วันหยุดนักขัตฤกษ์) */
export function isWorkingDay(dateISO: string, holidayDates: Set<string>): boolean {
  return !isWeekend(dateISO) && !holidayDates.has(dateISO);
}

/** แปลงวันที่ JS Date เป็น ISO (ค.ศ.) */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
