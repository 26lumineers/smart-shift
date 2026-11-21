import { cellKey, type MonthView } from "@/lib/db/queries";
import { dayNumber, dayShortThai, todayISO } from "@/lib/dates";

/** ตารางเต็มเดือน: แถว = บุคลากร, คอลัมน์ = วัน, เลื่อนแนวนอนได้ หัวตาราง/คอลัมน์ชื่อ sticky */
export function MonthTable({
  view,
  highlightStaffId,
}: {
  view: MonthView;
  highlightStaffId?: number;
}) {
  const today = todayISO();

  return (
    <div className="w-full overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="schedule-table w-full min-w-max border-collapse text-center text-[13px]">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-30 min-w-36 border-b border-slate-300 bg-slate-100 px-3 py-2 text-left font-bold">
              ชื่อ-นามสกุล
            </th>
            {view.days.map((d) => (
              <th
                key={d.date}
                title={d.holiday ?? undefined}
                className={[
                  "sticky top-0 z-20 min-w-9 border-b border-l border-slate-300 px-1 py-1.5 font-bold",
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
          {view.staff.map((s) => {
            const isMe = s.id === highlightStaffId;

            return (
              <tr key={s.id}>
                <th
                  scope="row"
                  className={[
                    "sticky left-0 z-10 px-3 py-2 text-left whitespace-nowrap",
                    isMe
                      ? "border-y-2 border-l-4 border-y-indigo-500 border-l-indigo-600 border-r border-r-slate-200 bg-indigo-100 font-bold text-indigo-950"
                      : "border-b border-r border-slate-200 bg-white font-normal",
                  ].join(" ")}
                >
                  <span className={isMe ? "font-bold" : "font-medium"}>{s.name}</span>
                  {isMe && (
                    <span className="ml-1 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      ฉัน
                    </span>
                  )}
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
                  let content: React.ReactNode = null;

                  let bg = d.holiday ? "bg-amber-100" : d.weekend ? "bg-amber-50" : "";
                  let extra = "";
                  // เซลล์ที่พื้นหลังอ่อน (ว่าง/เวรปกติ) เปลี่ยนเป็นสีไฮไลต์ได้
                  let softBg = true;

                  if (cell?.kind === "shifts") {
                    content = cell.codes.join("/");
                    if (cell.codes.some((c) => c === "ด")) {
                      bg = "bg-slate-800";
                      extra = "font-bold text-white";
                      softBg = false;
                    } else {
                      bg = "bg-white";
                      extra = "font-bold text-slate-900";
                    }
                  } else if (cell?.kind === "LEAVE") {
                    content = "ลา";
                    bg = "bg-emerald-100";
                    extra = "font-bold text-emerald-800";
                    softBg = false;
                  } else if (cell?.kind === "OFF") {
                    content = "OFF";
                    bg = "bg-sky-100";
                    extra = "font-bold text-sky-800";
                    softBg = false;
                  }

                  if (isMe && softBg) bg = "bg-indigo-50";

                  return (
                    <td
                      key={d.date}
                      className={[
                        "border-b border-l border-slate-200 px-1 py-2 whitespace-nowrap",
                        bg,
                        extra,
                        isMe ? "border-y-2 border-y-indigo-500" : "",
                        d.date === today ? "outline-2 outline-offset-[-2px] outline-indigo-500" : "",
                      ].join(" ")}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}