import { cellKey, type MonthView } from "@/lib/db/queries";
import type { ShiftTypeInfo } from "@/lib/db/queries";
import { dateLabelThai, dayNumber, dayShortThai, todayISO } from "@/lib/dates";

type Props = {
  view: MonthView;
  staffId: number;
  legend: ShiftTypeInfo[];
};

/** มุมมองมือถือ: การ์ดรายวันของคนเดียว */
export function DayCards({ view, staffId, legend }: Props) {
  const today = todayISO();
  const timeByCode = new Map(legend.map((l) => [l.code, `${l.startTime}–${l.endTime}`]));
  const target = view.staff.find((s) => s.id === staffId);

  return (
    <ul className="space-y-2">
      {view.days.map((d) => {
        const cell = view.cells.get(cellKey(staffId, d.date));
        const isToday = d.date === today;

        return (
          <li
            key={d.date}
            className={[
              "rounded-xl bg-white p-3 shadow-sm ring-1",
              isToday ? "ring-2 ring-indigo-500" : "ring-slate-200",
              d.weekend ? "bg-amber-50" : "",
            ].join(" ")}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-base font-bold text-slate-900">
                {dateLabelThai(d.date)}
              </span>
              {isToday && (
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                  วันนี้
                </span>
              )}
            </div>

            <div className="mt-2">
              {cell?.kind === "shifts" ? (
                <div className="flex flex-wrap gap-1.5">
                  {cell.codes.map((code) => (
                    <span
                      key={code}
                      className="rounded-lg bg-slate-900 px-2.5 py-1 text-sm font-bold text-white"
                    >
                      {code}
                      <span className="ml-1 text-[10px] font-normal opacity-70">
                        {timeByCode.get(code) ?? ""}
                      </span>
                    </span>
                  ))}
                </div>
              ) : cell?.kind === "LEAVE" ? (
                <span className="inline-block rounded-lg bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
                  ลา
                </span>
              ) : cell?.kind === "OFF" ? (
                <span className="inline-block rounded-lg bg-sky-100 px-3 py-1 text-sm font-bold text-sky-800">
                  OFF
                </span>
              ) : d.weekend ? (
                <span className="text-sm text-amber-700">วันหยุด — ไม่มีเวร</span>
              ) : (
                <span className="text-sm text-slate-400">
                  งานราชการปกติ 08.00–16.00 (ไม่มีเวร OT)
                </span>
              )}
            </div>

            {d.holiday && (
              <p className="mt-1 text-xs text-amber-700">วันหยุดนักขัตฤกษ์: {d.holiday}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
