import { cellKey, type MonthView } from "@/lib/db/queries";
import { dayNumber, dayShortThai, todayISO } from "@/lib/dates";

/** ตารางเต็มเดือน: แถว = บุคลากร, คอลัมน์ = วัน, เลื่อนแนวนอนได้ หัวตาราง/คอลัมน์ชื่อ sticky */
export function MonthTable({ view }: { view: MonthView }) {
  const today = todayISO();

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="schedule-table min-w-max border-collapse text-center text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-30 min-w-40 border-b border-slate-300 bg-slate-100 px-2 py-2 text-left font-bold">
              ชื่อ-นามสกุล
            </th>
            {view.days.map((d) => (
              <th
                key={d.date}
                title={d.holiday ?? undefined}
                className={[
                  "sticky top-0 z-20 w-8 border-b border-l border-slate-300 px-0.5 py-1 font-bold",
                  d.holiday ? "bg-amber-200" : d.weekend ? "bg-amber-100" : "bg-slate-100",
                  d.date === today ? "outline-2 outline-offset-[-2px] outline-indigo-500" : "",
                ].join(" ")}
              >
                <div>{dayNumber(d.date)}</div>
                <div className="text-[9px] font-normal">{dayShortThai(d.date)}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {view.staff.map((s) => (
            <tr key={s.id}>
              <th
                scope="row"
                className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-2 py-1.5 text-left font-normal whitespace-nowrap"
              >
                <span className="font-medium">{s.name}</span>
                <span
                  className={[
                    "ml-1 rounded px-1 py-0.5 text-[9px]",
                    s.roleType === "MT" ? "bg-violet-100 text-violet-700" : "bg-teal-100 text-teal-700",
                  ].join(" ")}
                >
                  {s.roleType === "MT" ? "MT" : "ผช"}
                </span>
              </th>
              {view.days.map((d) => {
                const cell = view.cells.get(cellKey(s.id, d.date));
                const weekendBg = d.holiday ? "bg-amber-100" : d.weekend ? "bg-amber-50" : "";
                let content: React.ReactNode = null;
                let cellClass = weekendBg;

                if (cell?.kind === "shifts") {
                  content = cell.codes.join("/");
                  cellClass = cell.codes.some((c) => c === "ด")
                    ? "bg-slate-800 font-bold text-white"
                    : "bg-white font-bold text-slate-900";
                } else if (cell?.kind === "LEAVE") {
                  content = "ลา";
                  cellClass = "bg-emerald-100 font-bold text-emerald-800";
                } else if (cell?.kind === "OFF") {
                  content = "OFF";
                  cellClass = "bg-sky-100 font-bold text-sky-800";
                }

                return (
                  <td
                    key={d.date}
                    className={[
                      "border-b border-l border-slate-200 px-0.5 py-1.5 whitespace-nowrap",
                      cellClass,
                      d.date === today ? "outline-2 outline-offset-[-2px] outline-indigo-500" : "",
                    ].join(" ")}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
