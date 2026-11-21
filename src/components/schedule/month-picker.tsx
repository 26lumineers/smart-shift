import Link from "next/link";
import { monthLabelThai, nextMonth, prevMonth } from "@/lib/dates";

type Props = {
  month: string; // YYYY-MM
  basePath: string;
  extra?: Record<string, string | number | undefined>;
};

/** ตัวเลือกเดือน ก่อนหน้า/ถัดไป (ลิงก์ธรรมดา ใช้ได้ทั้ง server component) */
export function MonthPicker({ month, basePath, extra = {} }: Props) {
  const build = (m: string) => {
    const params = new URLSearchParams();
    params.set("month", m);
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== "") params.set(k, String(v));
    }
    return `${basePath}?${params.toString()}`;
  };

  return (
    <nav className="no-print flex items-center justify-between gap-2">
      <Link
        href={build(prevMonth(month))}
        aria-label="เดือนก่อนหน้า"
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 active:bg-slate-100"
      >
        ←
      </Link>
      <span className="font-bold text-slate-900">{monthLabelThai(month)}</span>
      <Link
        href={build(nextMonth(month))}
        aria-label="เดือนถัดไป"
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 active:bg-slate-100"
      >
        →
      </Link>
    </nav>
  );
}
