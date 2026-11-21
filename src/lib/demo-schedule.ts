/**
 * ตัวสร้างตารางเวรตัวอย่าง (เฟส 1) — pure function, deterministic
 * หมุนแบบ round-robin ให้กระจายเท่าๆ กัน และบังคับกฎเด็ดขาดทุกข้อ:
 *  กฎ 1  บ่าย (บ1/บ2/BD/SMC) วันนี้ → วันถัดไปห้าม CKD/ส3
 *  กฎ 2  ด(D) → วัน D+1 ห้าม CKD/ส3
 *  กฎ 3  บ่าย (บ1/บ2 รวม SMC) ห้ามติดกัน 2 วัน
 *  กฎ 4  BD ห้ามติดกัน 2 วัน
 *  กฎ 5  ด ห้ามติดกัน 2 วัน
 *  กฎ 6  ด(D) → วัน D+1 ห้ามบ่าย
 *  กฎ 7  ส3 คนเดิมห้ามติดกัน 2 วัน
 *  กฎ 8  ห้ามคนเดิมเวรทั้งวันเสาร์และอาทิตย์ (รวมวันหยุดติดกัน)
 *  กฎ 10 เคารพ allowedShifts ของแต่ละคน
 *  กฎ 11 คนที่ลา/OFF วันนั้นห้ามถูกจัดเวร
 *  เพิ่มเติม (ตกลงกับผู้ใช้): ห้ามคนเดียว บ+ด วันเดียวกัน (16 ชม. ติดกัน)
 *  เพิ่มเติม: ด(D-1) → ห้ามเวรเช้าวันหยุด D (จบด 08.00 แล้วเข้าเช้า 08.00 ติดกัน)
 *
 * วันหยุด: MT 3 คน คนละ 1 เช้า (ช1/ช2/ช3) ควบ 1 บ่าย/ดึก (บ1/บ2/ด) จับคู่อิสระ
 * Asst: 1 คน ช1+BD, 1 คน ช2
 * ดในช่องวัน D = กะ 00.00 ท้ายวัน D ถึง 08.00 ของ D+1
 */

import { dayOfWeek, isWeekend, monthDays } from "./dates";

export type GenStaff = {
  id: number;
  orderNo: number;
  roleType: "MT" | "ASST";
  allowedShifts: string[]; // ว่าง = ลงได้ทุกเวรของประเภทตัวเอง
};

export type GenRequest = {
  staffId: number;
  date: string;
  type: "OFF" | "LEAVE";
};

/** สถานะวันก่อนหน้า ส่งต่อข้ามเดือนได้ */
export type DayCarry = {
  evening: Set<number>; // เมื่อวานมีเวรบ่าย (บ1/บ2/BD/SMC)
  night: Set<number>; // เมื่อวานมีเวรดึก (ด)
  s3: Set<number>; // เมื่อวานได้ ส3
  offDayWorkers: Set<number> | null; // ทำงานในวันหยุดก่อนหน้า (กฎ 8/9)
};

export function emptyCarry(): DayCarry {
  return {
    evening: new Set(),
    night: new Set(),
    s3: new Set(),
    offDayWorkers: null,
  };
}

export type GenInput = {
  yearMonth: string; // YYYY-MM
  staff: GenStaff[];
  holidays: string[]; // ISO dates
  requests: GenRequest[];
  smcPointer: number; // orderNo ที่ถึงคิว SMC
  smcRing?: number[]; // ลำดับในวงหมุน SMC ค่าเริ่มต้น 5-11
  carry?: DayCarry;
};

export type GenAssignment = {
  date: string;
  staffId: number;
  shiftCode: string;
};

export type GenOutput = {
  assignments: GenAssignment[];
  gaps: string[]; // ช่องที่จัดไม่ได้ ต้องรายงาน ไม่ละเมิดกฎเงียบๆ
  smcPointer: number; // ตัวชี้ล่าสุด (orderNo คนที่ได้ SMC ล่าสุด)
  carry: DayCarry;
};

const MORNING_CODES = ["ช1", "ช2", "ช3"] as const;
const EVENING_CODES = ["ด", "บ1", "บ2"] as const; // เติม ด ก่อน (จำกัดที่สุด)

/**
 * ตัวเลือกคนแบบยุติธรรม: เลือกผู้ที่ได้เวรประเภทนี้น้อยที่สุดก่อน
 * tie-break ด้วยภาระ OT รวม (ทุกเวร) แล้วจึงหมุนตามลำดับ
 * - คนที่ติดกฎ/ลาในวันหนึ่งไม่เสียสิทธิ์ถาวร
 * - คนที่ทำได้หลายเวรจะไม่ถูกกวาดไปจนคนที่ทำได้เวรเดียวได้เปรียบสะสม
 */
class Rotator {
  private counts = new Map<number, number>();
  private idx = 0;
  constructor(
    private pool: GenStaff[],
    private load: Map<number, number>,
  ) {}

  pick(pred: (s: GenStaff) => boolean): GenStaff | null {
    const n = this.pool.length;
    if (n === 0) return null;
    let best: GenStaff | null = null;
    let bestScore = Infinity;
    let bestPos = -1;
    for (let i = 0; i < n; i++) {
      const s = this.pool[(this.idx + i) % n];
      if (!pred(s)) continue;
      const score = (this.counts.get(s.id) ?? 0) * 1000 + (this.load.get(s.id) ?? 0);
      if (score < bestScore) {
        best = s;
        bestScore = score;
        bestPos = i;
      }
    }
    if (!best) return null;
    this.counts.set(best.id, (this.counts.get(best.id) ?? 0) + 1);
    this.load.set(best.id, (this.load.get(best.id) ?? 0) + 1);
    this.idx = (this.idx + bestPos + 1) % n;
    return best;
  }
}

function allowed(s: GenStaff, code: string): boolean {
  return s.allowedShifts.length === 0 || s.allowedShifts.includes(code);
}

function canDoMorning(s: GenStaff): boolean {
  return MORNING_CODES.some((c) => allowed(s, c));
}

export function generateDemoMonth(input: GenInput): GenOutput {
  const { yearMonth, staff, holidays, requests } = input;
  const holidaySet = new Set(holidays);
  const ring = input.smcRing ?? [5, 6, 7, 8, 9, 10, 11];

  const requestByDate = new Map<string, Set<number>>();
  for (const r of requests) {
    if (!requestByDate.has(r.date)) requestByDate.set(r.date, new Set());
    requestByDate.get(r.date)!.add(r.staffId);
  }

  const byOrder = (a: GenStaff, b: GenStaff) => a.orderNo - b.orderNo;
  const mts = staff.filter((s) => s.roleType === "MT").sort(byOrder);
  const assts = staff.filter((s) => s.roleType === "ASST").sort(byOrder);

  // pool รายเวร แยกหมุนให้กระจาย — ใช้ภาระรวมร่วมกันเป็น tie-break
  const load = new Map<number, number>();
  const rotCkdMt = new Rotator(mts, load);
  const rotS3 = new Rotator(mts.filter((s) => allowed(s, "ส3")), load);
  const rotB1 = new Rotator(mts.filter((s) => allowed(s, "บ1")), load);
  const rotB2 = new Rotator(mts.filter((s) => allowed(s, "บ2")), load);
  const rotNight = new Rotator(mts.filter((s) => allowed(s, "ด")), load);
  const rotCkdAsst = new Rotator(assts.filter((s) => allowed(s, "CKD")), load);
  const rotBd = new Rotator(assts.filter((s) => allowed(s, "BD")), load);
  const rotWeekendMt = new Rotator(mts.filter(canDoMorning), load);
  const rotWeekendAsst = new Rotator(assts.filter(canDoMorning), load);

  const assignments: GenAssignment[] = [];
  const gaps: string[] = [];
  let smcPointer = input.smcPointer;
  let prev: DayCarry = input.carry ?? emptyCarry();

  for (const date of monthDays(yearMonth)) {
    const isOffDay = isWeekend(date) || holidaySet.has(date);
    const assignedToday = new Set<number>();
    const morningToday = new Set<number>();
    const eveningToday = new Set<number>();
    const nightToday = new Set<number>();
    const s3Today = new Set<number>();

    // กฎ 11: ลา/OFF ห้ามถูกจัด + กฎ 8/9: ห้ามทำวันหยุดติดกัน 2 วัน
    const busy = new Set<number>(requestByDate.get(date) ?? []);
    if (isOffDay && prev.offDayWorkers) {
      for (const id of prev.offDayWorkers) busy.add(id);
    }
    const free = (s: GenStaff) => !busy.has(s.id) && !assignedToday.has(s.id);
    // เวรเช้า 07.00 (CKD/ส3) ทำคู่กับเวรบ่ายของวันเดียวกันได้ (ไม่ชนเวลา)
    // แต่ห้ามคู่กับเวรดึกของวันเดียวกัน (จะกลายเป็นงานยาวข้ามคืน) และห้ามมีเวรเช้าซ้ำ
    const freeMorning = (s: GenStaff) =>
      !busy.has(s.id) && !morningToday.has(s.id) && !nightToday.has(s.id);

    const push = (s: GenStaff, code: string) => {
      assignments.push({ date, staffId: s.id, shiftCode: code });
      assignedToday.add(s.id);
      if (code === "ด") nightToday.add(s.id);
      else if (["บ1", "บ2", "BD", "SMC"].includes(code)) eveningToday.add(s.id);
      else if (code === "ส3") {
        morningToday.add(s.id);
        s3Today.add(s.id);
      } else if (code === "CKD") morningToday.add(s.id);
    };

    if (!isOffDay) {
      // ---------- วันราชการ ----------
      // เติมช่องแคบก่อน (pool เล็ก) แล้วค่อยช่องกว้าง: SMC → ด → บ1 → บ2 → ส3 → CKD×2
      // MT: CKD 2, ส3 1, บ1 1, บ2 1, ด 1 (+SMC 1 ถ้าพฤหัส) / Asst: CKD 1, BD 1

      if (dayOfWeek(date) === 4) {
        // ---------- SMC วงหมุน 5-11 ข้ามผู้ไม่มีสิทธิ์ ----------
        // เงื่อนไขข้ามตามหัวข้อ 8: ลา/OFF หรือบ่าย/ดึกเมื่อวาน (เวรเช้า 07.00 ของวันเดียวกันไม่ห้าม)
        const startIdx = ring.indexOf(smcPointer);
        let done = false;
        if (startIdx >= 0) {
          for (let step = 0; step < ring.length && !done; step++) {
            const orderNo = ring[(startIdx + step) % ring.length];
            const cand = mts.find((m) => m.orderNo === orderNo);
            if (
              cand &&
              allowed(cand, "SMC") &&
              !busy.has(cand.id) && // กฎ 11
              !prev.evening.has(cand.id) && // กฎ 3 (เกณฑ์เหมือนเวรบ่าย)
              !prev.night.has(cand.id) // กฎ 6 (ด เมื่อวาน → บ่ายวันนี้ห้าม)
            ) {
              push(cand, "SMC");
              const nextIdx = (startIdx + step + 1) % ring.length;
              smcPointer = ring[nextIdx];
              done = true;
            }
          }
        }
        if (!done) gaps.push(`${date} MT SMC ว่าง`);
      }

      const night = rotNight.pick(
        (x) =>
          free(x) &&
          allowed(x, "ด") &&
          !prev.night.has(x.id), // กฎ 5
      );
      if (night) push(night, "ด");
      else gaps.push(`${date} MT ด ว่าง`);

      for (const [code, rot] of [
        ["บ1", rotB1],
        ["บ2", rotB2],
      ] as const) {
        const s = rot.pick(
          (x) =>
            free(x) &&
            allowed(x, code) &&
            !prev.evening.has(x.id) && // กฎ 3
            !prev.night.has(x.id), // กฎ 6
        );
        if (s) push(s, code);
        else gaps.push(`${date} MT ${code} ว่าง`);
      }

      const s3 = rotS3.pick(
        (x) =>
          freeMorning(x) &&
          allowed(x, "ส3") &&
          !prev.evening.has(x.id) && // กฎ 1
          !prev.night.has(x.id) && // กฎ 2
          !prev.s3.has(x.id), // กฎ 7
      );
      if (s3) push(s3, "ส3");
      else gaps.push(`${date} MT ส3 ว่าง`);

      for (let k = 0; k < 2; k++) {
        const s = rotCkdMt.pick(
          (x) =>
            freeMorning(x) &&
            allowed(x, "CKD") &&
            !prev.evening.has(x.id) && // กฎ 1
            !prev.night.has(x.id), // กฎ 2
        );
        if (s) push(s, "CKD");
        else gaps.push(`${date} MT CKD ว่าง`);
      }

      const ckdAsst = rotCkdAsst.pick(
        (x) =>
          freeMorning(x) &&
          allowed(x, "CKD") &&
          !prev.evening.has(x.id) && // กฎ 1 (BD เมื่อวาน)
          !prev.night.has(x.id), // กฎ 2
      );
      if (ckdAsst) push(ckdAsst, "CKD");
      else gaps.push(`${date} Asst CKD ว่าง`);

      const bd = rotBd.pick(
        (x) =>
          free(x) &&
          allowed(x, "BD") &&
          !prev.evening.has(x.id) && // กฎ 4
          !prev.night.has(x.id), // กฎ 6
      );
      if (bd) push(bd, "BD");
      else gaps.push(`${date} Asst BD ว่าง`);
    } else {
      // ---------- วันหยุด/สุดสัปดาห์ ----------
      // MT 3 คน ควบเวร: 1 คนทำ ด ได้ + 2 คนทำ บ ได้ (คนที่บ่ายเมื่อวานยังควบ ด ได้)
      // ห้ามคนทำวันหยุดก่อนหน้า (กฎ 8/9) และคนเวรดึกเมื่อคืน (จบ 08.00 ติดเช้า 08.00)
      const capableToday = (x: GenStaff, code: string) => {
        if (!allowed(x, code)) return false;
        if (code === "ด") return !prev.night.has(x.id); // กฎ 5
        return !prev.evening.has(x.id) && !prev.night.has(x.id); // กฎ 3/4, 6
      };
      const nightRest = (x: GenStaff) => !prev.night.has(x.id);
      const baseOk = (x: GenStaff) =>
        free(x) && canDoMorning(x) && nightRest(x);
      const canEvening = (x: GenStaff) =>
        capableToday(x, "บ1") || capableToday(x, "บ2");

      const trio: GenStaff[] = [];
      const nightPick = rotWeekendMt.pick(
        (x) => baseOk(x) && capableToday(x, "ด"),
      );
      if (nightPick) trio.push(nightPick);
      else gaps.push(`${date} MT ควบเวรดึก ว่าง`);
      for (let k = 0; k < 2; k++) {
        const s = rotWeekendMt.pick((x) => baseOk(x) && canEvening(x));
        if (s) trio.push(s);
        else gaps.push(`${date} MT ควบเวรบ่าย ว่าง`);
      }
      // แจกเช้า ช1/ช2/ช3 — คนตัวเลือกน้อยได้ก่อน (ธิญาภา → ช3)
      const remaining = [...trio];
      const morningFlex = (s: GenStaff) =>
        MORNING_CODES.filter((c) => allowed(s, c)).length;
      for (const code of MORNING_CODES) {
        const cands = remaining.filter((s) => allowed(s, code));
        if (cands.length === 0) {
          gaps.push(`${date} MT ${code} ว่าง`);
          continue;
        }
        cands.sort(
          (a, b) => morningFlex(a) - morningFlex(b) || a.orderNo - b.orderNo,
        );
        const s = cands[0];
        push(s, code);
        remaining.splice(remaining.indexOf(s), 1);
      }

      // ควบเวร: จับคู่เช้ากับ ด/บ1/บ2 แบบอิสระ — เลือกคนที่ตัวเลือกวันนี้น้อยที่สุดก่อน
      // (คนที่บ่ายเมื่อวานเหลือแค่ ด → รับ ด, ธิญาภาเหลือบ่าย → รับบ่าย)
      const freeTrio = [...trio];
      const flexToday = (s: GenStaff) =>
        EVENING_CODES.filter((c) => capableToday(s, c)).length;
      for (const code of EVENING_CODES) {
        const cands = freeTrio.filter((s) => capableToday(s, code));
        if (cands.length === 0) {
          gaps.push(`${date} MT ${code} ว่าง`);
          continue;
        }
        cands.sort(
          (a, b) => flexToday(a) - flexToday(b) || a.orderNo - b.orderNo,
        );
        const s = cands[0];
        push(s, code);
        freeTrio.splice(freeTrio.indexOf(s), 1);
      }

      // Asst 2 คน: ช1+BD และ ช2
      const a1 = rotWeekendAsst.pick(
        (x) =>
          free(x) &&
          allowed(x, "ช1") &&
          allowed(x, "BD") &&
          !prev.evening.has(x.id) && // กฎ 4 (BD ติดกัน)
          !prev.night.has(x.id),
      );
      if (a1) {
        push(a1, "ช1");
        push(a1, "BD");
      } else {
        gaps.push(`${date} Asst ช1/BD ว่าง`);
      }
      const a2 = rotWeekendAsst.pick((x) => free(x) && allowed(x, "ช2"));
      if (a2) push(a2, "ช2");
      else gaps.push(`${date} Asst ช2 ว่าง`);
    }

    prev = {
      evening: eveningToday,
      night: nightToday,
      s3: s3Today,
      offDayWorkers: isOffDay ? new Set(assignedToday) : null,
    };
  }

  return { assignments, gaps, smcPointer, carry: prev };
}
