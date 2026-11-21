/**
 * ข้อมูลตั้งต้นสำหรับ seed (เฟส 1)
 * ชื่อ-นามสกุลอ้างอิงแบบฟอร์ม F-OPR-012 — โปรดตรวจการสะกดกับเอกสารจริงอีกครั้ง
 * ข้อจำกัดบุคคลอยู่ใน allowedShifts/flags เพื่อให้ Admin แก้ได้จาก DB
 * allowedShifts ว่าง [] = ลงได้ทุกเวรตามประเภทของตัวเอง
 * เบอร์โทรและ PIN ไม่อยู่ที่นี่ (Admin กรอกเบอร์เอง / seed สุ่ม PIN แล้วพิมพ์ทาง console)
 */

export type StaffSeed = {
  orderNo: number;
  name: string;
  roleType: "MT" | "ASST";
  allowedShifts: string[];
  flags: Record<string, boolean>;
  isAdmin: boolean;
};

export const STAFF_SEED: StaffSeed[] = [
  { orderNo: 1, name: "นส.นวลจันทร์ พลเสนา", roleType: "MT", allowedShifts: ["CKD"], flags: {}, isAdmin: true },
  { orderNo: 2, name: "นางดารุณี ทองเดช", roleType: "MT", allowedShifts: ["CKD"], flags: {}, isAdmin: false },
  { orderNo: 3, name: "นายชยพล ดีไพร", roleType: "MT", allowedShifts: [], flags: {}, isAdmin: false },
  { orderNo: 4, name: "นางธิญาภา จันทร์เทพ", roleType: "MT", allowedShifts: ["ช3", "บ1", "บ2", "ส3", "CKD", "SMC"], flags: { noNight: true }, isAdmin: false },
  { orderNo: 5, name: "น.ส.ภัทรานุช รักษาเคน", roleType: "MT", allowedShifts: ["CKD", "ส3"], flags: {}, isAdmin: false },
  { orderNo: 6, name: "น.ส.วุฒิชัย บุญแสนขัน", roleType: "MT", allowedShifts: [], flags: {}, isAdmin: false },
  { orderNo: 7, name: "น.ส.เรียวลดา กัญญาบัณฑิตย์", roleType: "MT", allowedShifts: [], flags: {}, isAdmin: false },
  { orderNo: 8, name: "น.ส.อัจฉริยา สุวรรณสังข์", roleType: "MT", allowedShifts: [], flags: {}, isAdmin: false },
  { orderNo: 9, name: "น.ส.รัตนิยา พรหมชัย", roleType: "MT", allowedShifts: [], flags: {}, isAdmin: false },
  { orderNo: 10, name: "น.ส.อรฤทัย มาตรา", roleType: "MT", allowedShifts: [], flags: {}, isAdmin: false },
  { orderNo: 11, name: "น.ส.ปิยรัตน์ โยธิน", roleType: "MT", allowedShifts: [], flags: {}, isAdmin: false },
  { orderNo: 12, name: "นายทองหลาง บุษราคำ", roleType: "ASST", allowedShifts: [], flags: {}, isAdmin: false },
  { orderNo: 13, name: "น.ส.รัตติยา พลชัยมาตย์", roleType: "ASST", allowedShifts: [], flags: {}, isAdmin: false },
  { orderNo: 14, name: "น.ส.นรมน ผิวจันดา", roleType: "ASST", allowedShifts: [], flags: {}, isAdmin: false },
  { orderNo: 15, name: "นส.กัณธิญารักษ์ เดือนกอง", roleType: "ASST", allowedShifts: [], flags: {}, isAdmin: false },
];

export type ShiftTypeSeed = {
  code: string;
  appliesTo: "MT" | "ASST";
  label: string;
  startTime: string;
  endTime: string;
  hours: number;
  weekdayOnly: boolean;
  holidayOnly: boolean;
  sortNo: number;
  note: string | null;
};

export const SHIFT_TYPES_SEED: ShiftTypeSeed[] = [
  // MT
  { code: "CKD", appliesTo: "MT", label: "CKD/DM/HT", startTime: "07:00", endTime: "08:00", hours: 1, weekdayOnly: false, holidayOnly: false, sortNo: 1, note: null },
  { code: "ส3", appliesTo: "MT", label: "ห้องปฏิบัติการชั้น 3", startTime: "07:00", endTime: "08:00", hours: 1, weekdayOnly: false, holidayOnly: false, sortNo: 2, note: null },
  { code: "ช1", appliesTo: "MT", label: "เวรเช้า", startTime: "08:00", endTime: "16:00", hours: 8, weekdayOnly: false, holidayOnly: true, sortNo: 3, note: "พัก 11.00 (วันหยุดเท่านั้น)" },
  { code: "ช2", appliesTo: "MT", label: "เวรเช้า", startTime: "08:00", endTime: "16:00", hours: 8, weekdayOnly: false, holidayOnly: true, sortNo: 4, note: "พัก 12.00 (วันหยุดเท่านั้น)" },
  { code: "ช3", appliesTo: "MT", label: "เพาะเชื้อ", startTime: "08:00", endTime: "16:00", hours: 8, weekdayOnly: false, holidayOnly: true, sortNo: 5, note: "พัก 12.00 (วันหยุดเท่านั้น)" },
  { code: "บ1", appliesTo: "MT", label: "เวรบ่าย", startTime: "16:00", endTime: "24:00", hours: 8, weekdayOnly: false, holidayOnly: false, sortNo: 6, note: "พัก 17.00" },
  { code: "บ2", appliesTo: "MT", label: "เวรบ่าย", startTime: "16:00", endTime: "24:00", hours: 8, weekdayOnly: false, holidayOnly: false, sortNo: 7, note: "พัก 18.00" },
  { code: "ด", appliesTo: "MT", label: "เวรดึก", startTime: "00:00", endTime: "08:00", hours: 8, weekdayOnly: false, holidayOnly: false, sortNo: 8, note: "ลงในช่องวันที่ D = กะ 00.00 ท้ายวัน D ถึง 08.00 ของ D+1" },
  { code: "SMC", appliesTo: "MT", label: "SMC ชั้น 3", startTime: "16:00", endTime: "20:00", hours: 4, weekdayOnly: true, holidayOnly: false, sortNo: 9, note: "เฉพาะวันพฤหัสบดี" },
  // Asst
  { code: "CKD", appliesTo: "ASST", label: "CKD/DM/HT", startTime: "07:00", endTime: "08:00", hours: 1, weekdayOnly: false, holidayOnly: false, sortNo: 1, note: null },
  { code: "ช1", appliesTo: "ASST", label: "เวรเช้า", startTime: "07:00", endTime: "15:00", hours: 8, weekdayOnly: false, holidayOnly: true, sortNo: 2, note: "วันหยุด พัก 11.00" },
  { code: "ช2", appliesTo: "ASST", label: "เวรเช้า", startTime: "08:00", endTime: "16:00", hours: 8, weekdayOnly: false, holidayOnly: true, sortNo: 3, note: "วันหยุด พัก 12.00" },
  { code: "BD", appliesTo: "ASST", label: "เวรบ่าย", startTime: "16:00", endTime: "20:00", hours: 4, weekdayOnly: false, holidayOnly: false, sortNo: 4, note: "ตามแบบฟอร์ม F-OPR-012" },
];

export const DEFAULT_SETTINGS: Record<string, unknown> = {
  off_limit_per_day: 3,
  hours_weight: { CKD: 1, "ส3": 1, "บ1": 8, "บ2": 8, "ด": 8, BD: 4, SMC: 4 },
  smc_pointer: 6,
  smc_ring: [5, 6, 7, 8, 9, 10, 11],
  controller_name: "นางสาวนวลจันทร์ พลเสนา",
  controller_title: "นักเทคนิคการแพทย์ชำนาญการ",
  organizer_name: "นางสาวเรียวลดา กัญญาบัณฑิตย์",
  organizer_title: "นักเทคนิคการแพทย์ปฏิบัติการ",
};

/** วันหยุดนักขัตฤกษ์ (Admin แก้ไขได้จากหน้าจัดการ) */
export const HOLIDAYS_SEED = [{ date: "2026-10-23", name: "วันปิยมหาราช" }];

/** คำขอ ลา/OFF ตัวอย่างสำหรับตารางเดโม (อ้างอิง orderNo ใน STAFF_SEED) */
export const DEMO_REQUESTS_SEED = [
  { orderNo: 6, date: "2026-10-12", type: "LEAVE" as const, note: "ตัวอย่าง: ลากิจ" },
  { orderNo: 8, date: "2026-10-19", type: "OFF" as const, note: "ตัวอย่าง: ขอ OFF" },
  { orderNo: 7, date: "2026-11-09", type: "LEAVE" as const, note: "ตัวอย่าง: ลาป่วย" },
  { orderNo: 9, date: "2026-11-16", type: "OFF" as const, note: "ตัวอย่าง: ขอ OFF" },
];

/** เดือนของตารางเดโม (ต.ค. + พ.ย. 2569) */
export const DEMO_MONTHS = ["2026-10", "2026-11"];
