import { describe, expect, it } from "vitest";
import {
  beYear,
  dayOfWeek,
  isWeekend,
  isWorkingDay,
  monthDays,
  monthLabelThai,
  nextDate,
  nextMonth,
  prevMonth,
  todayISO,
} from "@/lib/dates";

describe("dates", () => {
  it("beYear แปลง พ.ศ.", () => {
    expect(beYear(2026)).toBe(2569);
    expect(beYear(2025)).toBe(2568);
  });

  it("monthDays ครบทุกวันของเดือน", () => {
    const days = monthDays("2026-10");
    expect(days).toHaveLength(31);
    expect(days[0]).toBe("2026-10-01");
    expect(days[30]).toBe("2026-10-31");
    expect(monthDays("2026-11")).toHaveLength(30);
    expect(monthDays("2028-02")).toHaveLength(29); // ปีอธิกสุรทิน
  });

  it("dayOfWeek 2026-10-01 = พฤหัสบดี, 2026-10-23 = ศุกร์", () => {
    expect(dayOfWeek("2026-10-01")).toBe(4);
    expect(dayOfWeek("2026-10-23")).toBe(5);
  });

  it("isWeekend", () => {
    expect(isWeekend("2026-10-03")).toBe(true); // เสาร์
    expect(isWeekend("2026-10-04")).toBe(true); // อาทิตย์
    expect(isWeekend("2026-10-05")).toBe(false); // จันทร์
  });

  it("isWorkingDay รวมวันหยุดนักขัตฤกษ์", () => {
    const holidays = new Set(["2026-10-23"]);
    expect(isWorkingDay("2026-10-23", holidays)).toBe(false);
    expect(isWorkingDay("2026-10-22", holidays)).toBe(true);
    expect(isWorkingDay("2026-10-24", holidays)).toBe(false); // เสาร์
  });

  it("monthLabelThai", () => {
    expect(monthLabelThai("2026-10")).toBe("ตุลาคม 2569");
    expect(monthLabelThai("2026-01")).toBe("มกราคม 2569");
  });

  it("nextMonth/prevMonth ข้ามปี", () => {
    expect(nextMonth("2026-12")).toBe("2027-01");
    expect(prevMonth("2027-01")).toBe("2026-12");
  });

  it("nextDate ข้ามเดือน", () => {
    expect(nextDate("2026-10-31")).toBe("2026-11-01");
    expect(nextDate("2026-11-30")).toBe("2026-12-01");
  });

  it("todayISO รูปแบบ YYYY-MM-DD", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
