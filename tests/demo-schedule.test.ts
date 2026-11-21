import { describe, expect, it } from "vitest";
import {
  DEMO_REQUESTS_SEED,
  HOLIDAYS_SEED,
  STAFF_SEED,
} from "@/lib/demo-data";
import {
  dayOfWeek,
  isWeekend,
  monthDays,
  nextDate,
} from "@/lib/dates";
import {
  generateDemoMonth,
  type GenAssignment,
  type GenStaff,
} from "@/lib/demo-schedule";

const staff: GenStaff[] = STAFF_SEED.map((s) => ({
  id: s.orderNo, // seed แทรกตาม orderNo จึงใช้ id = orderNo ใน test
  orderNo: s.orderNo,
  roleType: s.roleType,
  allowedShifts: s.allowedShifts,
}));

const holidays = HOLIDAYS_SEED.map((h) => h.date);
const requests = DEMO_REQUESTS_SEED.map((r) => ({
  staffId: r.orderNo,
  date: r.date,
  type: r.type,
}));

/** สร้าง ต.ค. + พ.ย. 2569 ต่อกัน (carry ข้ามเดือน เหมือน seed จริง) */
function buildDemo() {
  const oct = generateDemoMonth({
    yearMonth: "2026-10",
    staff,
    holidays,
    requests,
    smcPointer: 6,
  });
  const nov = generateDemoMonth({
    yearMonth: "2026-11",
    staff,
    holidays,
    requests,
    smcPointer: oct.smcPointer,
    carry: oct.carry,
  });
  return { oct, nov, all: [...oct.assignments, ...nov.assignments] };
}

const isOffDay = (date: string) =>
  isWeekend(date) || holidays.includes(date);

const THINYAPHA = 4; // นางธิญาภา จันทร์เทพ ห้ามเวรดึกทุกกรณี

function byDate(assignments: GenAssignment[]) {
  const map = new Map<string, GenAssignment[]>();
  for (const a of assignments) {
    if (!map.has(a.date)) map.set(a.date, []);
    map.get(a.date)!.push(a);
  }
  return map;
}

function staffOf(id: number) {
  return staff.find((s) => s.id === id)!;
}

/** รหัสเวรบ่าย (กฎ 3/4/6 ใช้กับกลุ่มนี้) */
const EVENING_CODES = ["บ1", "บ2", "ด", "BD", "SMC"];

describe("ตารางตัวอย่าง: ความครบถ้วนและโควตา", () => {
  const { oct, nov, all } = buildDemo();

  it("จัดได้ครบทุกช่อง ไม่มี gap", () => {
    expect(oct.gaps).toEqual([]);
    expect(nov.gaps).toEqual([]);
  });

  it("โควตาวันราชการ (จ-ศ ไม่ใช่วันหยุด): MT CKD 2, ส3 1, บ1 1, บ2 1, ด 1, Asst CKD 1, BD 1", () => {
    const map = byDate(all);
    for (const date of monthDays("2026-10").concat(monthDays("2026-11"))) {
      if (isOffDay(date)) continue;
      const rows = map.get(date) ?? [];
      const count = (code: string, role?: "MT" | "ASST") =>
        rows.filter(
          (r) =>
            r.shiftCode === code &&
            (role ? staffOf(r.staffId).roleType === role : true),
        ).length;
      expect(count("CKD", "MT"), date).toBe(2);
      expect(count("ส3"), date).toBe(1);
      expect(count("บ1"), date).toBe(1);
      expect(count("บ2"), date).toBe(1);
      expect(count("ด"), date).toBe(1);
      expect(count("CKD", "ASST"), date).toBe(1);
      expect(count("BD"), date).toBe(1);
      // SMC เฉพาะพฤหัส +1
      const expectSmc = dayOfWeek(date) === 4 ? 1 : 0;
      expect(count("SMC"), date).toBe(expectSmc);
    }
  });

  it("โควตาวันหยุด: MT ช1/ช2/ช3 + บ1/บ2/ด อย่างละ 1, Asst ช1 1 + BD 1 + ช2 1", () => {
    const map = byDate(all);
    const offDays = [...monthDays("2026-10"), ...monthDays("2026-11")].filter(
      isOffDay,
    );
    expect(offDays.length).toBeGreaterThan(0);
    for (const date of offDays) {
      const rows = map.get(date) ?? [];
      const count = (code: string, role?: "MT" | "ASST") =>
        rows.filter(
          (r) =>
            r.shiftCode === code &&
            (role ? staffOf(r.staffId).roleType === role : true),
        ).length;
      expect(count("ช1", "MT"), date).toBe(1);
      expect(count("ช2", "MT"), date).toBe(1);
      expect(count("ช3", "MT"), date).toBe(1);
      expect(count("บ1"), date).toBe(1);
      expect(count("บ2"), date).toBe(1);
      expect(count("ด"), date).toBe(1);
      expect(count("ช1", "ASST"), date).toBe(1);
      expect(count("ช2", "ASST"), date).toBe(1);
      expect(count("BD"), date).toBe(1);
    }
  });

  it("วันหยุด MT มี 3 คน คนละ 1 เช้า + 1 คู่บ่าย/ดึก (รวม 6 ช่อง ไม่มีใครได้ 2 คู่)", () => {
    const map = byDate(all);
    for (const date of [...monthDays("2026-10"), ...monthDays("2026-11")]) {
      if (!isOffDay(date)) continue;
      const mtRows = (map.get(date) ?? []).filter(
        (r) => staffOf(r.staffId).roleType === "MT",
      );
      const persons = new Set(mtRows.map((r) => r.staffId));
      expect(persons.size, date).toBe(3);
      for (const id of persons) {
        const codes = mtRows.filter((r) => r.staffId === id).map((r) => r.shiftCode);
        expect(
          codes.length,
          `${date} คน ${id}`,
        ).toBe(2);
        expect(
          codes.filter((c) => ["ช1", "ช2", "ช3"].includes(c)).length,
          `${date} คน ${id}`,
        ).toBe(1);
        expect(
          codes.filter((c) => ["บ1", "บ2", "ด"].includes(c)).length,
          `${date} คน ${id}`,
        ).toBe(1);
      }
    }
  });

  it("ธิญาภาไม่มีเวรดึก (ด) เลย และได้เวรวันหยุดเป็นคู่บ่ายเท่านั้น", () => {
    expect(all.filter((a) => a.staffId === THINYAPHA && a.shiftCode === "ด")).toEqual([]);
    const map = byDate(all);
    for (const date of [...monthDays("2026-10"), ...monthDays("2026-11")]) {
      if (!isOffDay(date)) continue;
      const herCodes = (map.get(date) ?? [])
        .filter((r) => r.staffId === THINYAPHA)
        .map((r) => r.shiftCode);
      if (herCodes.length > 0) {
        expect(herCodes, date).toContain("ช3");
        expect(herCodes, date).toEqual(["ช3", expect.stringMatching(/^[บ]([12])$/)]);
      }
    }
  });
});

describe("ตารางตัวอย่าง: กฎเด็ดขาด", () => {
  const { all } = buildDemo();
  const map = byDate(all);
  const allDays = [...monthDays("2026-10"), ...monthDays("2026-11")];

  const codesOf = (date: string, staffId: number) =>
    (map.get(date) ?? []).filter((r) => r.staffId === staffId).map((r) => r.shiftCode);

  it("กฎ 1+2: บ่าย/ด วันนี้ → วันถัดไปห้าม CKD หรือ ส3", () => {
    for (const date of allDays) {
      const tomorrow = nextDate(date);
      if (!map.has(tomorrow)) continue;
      for (const r of map.get(date) ?? []) {
        if (EVENING_CODES.includes(r.shiftCode)) {
          const tmr = codesOf(tomorrow, r.staffId);
          expect(
            tmr.some((c) => c === "CKD" || c === "ส3"),
            `${date} คน ${r.staffId} ${r.shiftCode} → ${tomorrow} ${tmr}`,
          ).toBe(false);
        }
      }
    }
  });

  it("กฎ 3+4: บ่าย (บ1/บ2/SMC) ห้ามติดกัน 2 วัน, BD ห้ามติดกัน 2 วัน", () => {
    for (const date of allDays) {
      const tomorrow = nextDate(date);
      if (!map.has(tomorrow)) continue;
      for (const r of map.get(date) ?? []) {
        if (["บ1", "บ2", "SMC", "BD"].includes(r.shiftCode)) {
          const tmr = codesOf(tomorrow, r.staffId);
          const sameClass =
            r.shiftCode === "BD"
              ? tmr.includes("BD")
              : ["บ1", "บ2", "SMC"].some((c) => tmr.includes(c));
          expect(
            sameClass,
            `${date} คน ${r.staffId} ${r.shiftCode} → ${tomorrow} ${tmr}`,
          ).toBe(false);
        }
      }
    }
  });

  it("กฎ 5: ด ห้ามติดกัน 2 วัน (ด→ด)", () => {
    for (const date of allDays) {
      const tomorrow = nextDate(date);
      if (!map.has(tomorrow)) continue;
      for (const r of map.get(date) ?? []) {
        if (r.shiftCode === "ด") {
          expect(
            codesOf(tomorrow, r.staffId).includes("ด"),
            `${date} คน ${r.staffId} ด→ด ${tomorrow}`,
          ).toBe(false);
        }
      }
    }
  });

  it("กฎ 6: ด วันนี้ → วันถัดไปห้ามเวรบ่ายทุกชนิด", () => {
    for (const date of allDays) {
      const tomorrow = nextDate(date);
      if (!map.has(tomorrow)) continue;
      for (const r of map.get(date) ?? []) {
        if (r.shiftCode === "ด") {
          const tmr = codesOf(tomorrow, r.staffId);
          expect(
            tmr.some((c) => ["บ1", "บ2", "SMC", "BD"].includes(c)),
            `${date} คน ${r.staffId} ด→บ่าย ${tomorrow} ${tmr}`,
          ).toBe(false);
        }
      }
    }
  });

  it("กฎ 7: ส3 คนเดิมห้ามติดกัน 2 วัน", () => {
    for (const date of allDays) {
      const tomorrow = nextDate(date);
      if (!map.has(tomorrow)) continue;
      for (const r of map.get(date) ?? []) {
        if (r.shiftCode === "ส3") {
          expect(
            codesOf(tomorrow, r.staffId).includes("ส3"),
            `${date} คน ${r.staffId} ส3→ส3 ${tomorrow}`,
          ).toBe(false);
        }
      }
    }
  });

  it("กฎ 8: ไม่มีใครเวรทั้งสองวันหยุดติดกัน (เสาร์+อาทิตย์ รวมวันหยุดนักขัตฤกษ์)", () => {
    for (const date of allDays) {
      const tomorrow = nextDate(date);
      if (!isOffDay(date) || !isOffDay(tomorrow)) continue;
      const todayWorkers = new Set((map.get(date) ?? []).map((r) => r.staffId));
      const tomorrowWorkers = new Set((map.get(tomorrow) ?? []).map((r) => r.staffId));
      for (const id of todayWorkers) {
        expect(
          tomorrowWorkers.has(id),
          `${date}+${tomorrow} คน ${id} ทำวันหยุดติดกัน 2 วัน`,
        ).toBe(false);
      }
    }
  });

  it("กฎ 11: คนที่ลา/OFF ไม่ถูกจัดเวรวันนั้น", () => {
    for (const req of requests) {
      expect(
        map.get(req.date)?.filter((r) => r.staffId === req.staffId) ?? [],
        `${req.date} คน ${req.staffId} (${req.type})`,
      ).toEqual([]);
    }
  });

  it("ห้ามคนเดียว บ+ด ในวันเดียวกัน (16 ชม. ติดกัน)", () => {
    for (const date of allDays) {
      for (const rows of map.get(date) ?? []) {
        const codes = codesOf(date, rows.staffId);
        const hasB = codes.some((c) => c === "บ1" || c === "บ2" || c === "BD" || c === "SMC");
        const hasNight = codes.includes("ด");
        expect(
          hasB && hasNight,
          `${date} คน ${rows.staffId} บ+ด ${codes}`,
        ).toBe(false);
      }
    }
  });
});

describe("ตารางตัวอย่าง: วงหมุน SMC", () => {
  it("พฤหัสแรกของเดือนแรก = ลำดับ 6 ตามหัวข้อ 8", () => {
    const { all } = buildDemo();
    const smc = all.find(
      (a) => a.date === "2026-10-01" && a.shiftCode === "SMC",
    );
    expect(smc).toBeTruthy();
    expect(staffOf(smc!.staffId).orderNo).toBe(6);
  });

  it("ทุกพฤหัสได้ 'คนแรกในวง 5-11 ที่ผ่านเงื่อนไข' นับจากตัวชี้ และเลื่อนตัวชี้ตามคนที่ได้จริง", () => {
    const { all } = buildDemo();
    const map = byDate(all);
    const ring = [5, 6, 7, 8, 9, 10, 11];
    let pointer = 6; // ค่าเริ่มต้น: พฤหัสแรก ต.ค. = ลำดับ 6

    const thursdays = [...monthDays("2026-10"), ...monthDays("2026-11")].filter(
      (d) => dayOfWeek(d) === 4,
    );
    expect(thursdays.length).toBe(9); // ต.ค. 5 พฤหัส + พ.ย. 4 พฤหัส

    for (const thu of thursdays) {
      const smc = (map.get(thu) ?? []).find((r) => r.shiftCode === "SMC");
      expect(smc, `${thu} ต้องมี SMC`).toBeTruthy();
      const assignedOrder = staffOf(smc!.staffId).orderNo;

      // คนแรกในวงที่ผ่านเงื่อนไข: ลง SMC ได้, ไม่ลา/OFF, ไม่มีบ่าย/ดึกเมื่อวาน
      let expected: number | null = null;
      const startIdx = ring.indexOf(pointer);
      for (let step = 0; step < ring.length; step++) {
        const order = ring[(startIdx + step) % ring.length];
        const cand = STAFF_SEED.find((s) => s.orderNo === order)!;
        const canSmc =
          cand.allowedShifts.length === 0 || cand.allowedShifts.includes("SMC");
        if (!canSmc) continue; // ภัทรานุช ถูกข้ามอัตโนมัติ
        if (requests.some((r) => r.staffId === order && r.date === thu)) continue; // กฎ 11
        const prevDayRows = (map.get(prevDateLocal(thu)) ?? []).filter(
          (r) => r.staffId === order,
        );
        const hadEveningOrNight = prevDayRows.some((r) =>
          ["บ1", "บ2", "ด", "SMC", "BD"].includes(r.shiftCode),
        );
        if (hadEveningOrNight) continue; // บ่าย/ดึกเมื่อวาน → ข้ามตามเกณฑ์เวรบ่าย
        expected = order;
        break;
      }
      expect(
        assignedOrder,
        `${thu} วงหมุน SMC ผิด (ตัวชี้ ${pointer})`,
      ).toBe(expected);

      // เลื่อนตัวชี้ตามคนที่ได้จริง (หมุนต่อข้ามเดือน ไม่รีเซ็ต)
      pointer = ring[(ring.indexOf(assignedOrder) + 1) % ring.length];
    }
  });

  it("ภัทรานุช (ลำดับ 5) ไม่มี SMC เลย", () => {
    const { all } = buildDemo();
    expect(all.filter((a) => a.staffId === 5 && a.shiftCode === "SMC")).toEqual([]);
  });
});

function prevDateLocal(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

describe("ตารางตัวอย่าง: carry ข้ามเดือน", () => {
  it("ด วันสุดท้ายของเดือน → วันแรกเดือนถัดไปห้ามเวร 07.00/เช้าวันหยุด", () => {
    // ตรวจโดยตรงว่า carry ของ ต.ค. มีข้อมูลคนเวรดึก 31 ต.ค. ส่งต่อให้ พ.ย.
    const { oct, nov } = buildDemo();
    const nightOct31 = oct.assignments.filter(
      (a) => a.date === "2026-10-31" && a.shiftCode === "ด",
    );
    if (nightOct31.length > 0) {
      const id = nightOct31[0].staffId;
      const nov1 = (nov.assignments ?? []).filter((a) => a.date === "2026-11-01");
      // 31 ต.ค. = เสาร์, 1 พ.ย. = อาทิตย์ → กฎ 8 กันอยู่แล้ว แต่ ด 31 ต.ค. ต้องไม่โผล่วันอาทิตย์
      expect(nov1.some((a) => a.staffId === id)).toBe(false);
    }
  });
});
