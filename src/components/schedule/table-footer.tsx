import type { MonthView, ShiftTypeInfo } from "@/lib/db/queries";

type Props = {
  legend: ShiftTypeInfo[];
  view: MonthView;
  controllerName: string;
  controllerTitle: string;
};

/** ท้ายตารางตามรูปแบบ F-OPR-012: คำอธิบายเวลาเวร เบอร์โทร ช่องลงชื่อ */
export function TableFooter({ legend, view, controllerName, controllerTitle }: Props) {
  const mt = legend.filter((l) => l.appliesTo === "MT");
  const asst = legend.filter((l) => l.appliesTo === "ASST");
  const withPhone = view.staff.filter((s) => s.phone);

  const line = (l: ShiftTypeInfo) =>
    `${l.code} = ${l.startTime}–${l.endTime} (${l.label})${l.note ? ` — ${l.note}` : ""}`;

  return (
    <footer className="print-block mt-4 space-y-3 rounded-xl bg-white p-4 text-xs text-slate-700 shadow-sm ring-1 ring-slate-200">
      <div>
        <p className="font-bold">คำอธิบายเวร (MT)</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          {mt.map((l) => (
            <li key={`${l.code}-mt`}>{line(l)}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-bold">คำอธิบายเวร (ผู้ช่วยห้องปฏิบัติการ)</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          {asst.map((l) => (
            <li key={`${l.code}-asst`}>{line(l)}</li>
          ))}
        </ul>
        <p className="mt-1 text-slate-500">
          เวรดึก (ด) ในช่องวันที่ D หมายถึงกะ 00.00 ท้ายวัน D ถึง 08.00 ของวันถัดไป
        </p>
      </div>

      <div>
        <p className="font-bold">เบอร์โทร</p>
        {withPhone.length > 0 ? (
          <ul className="mt-1 space-y-0.5">
            {withPhone.map((s) => (
              <li key={s.id}>
                {s.name} {s.phone}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-slate-500">ยังไม่ได้กรอกเบอร์โทร (Admin เพิ่มได้ภายหลัง)</p>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <p>
          จัดตารางโดย{" "}
          <span className="inline-block w-48 border-b border-dotted border-slate-500 align-bottom">
            &nbsp;
          </span>
        </p>
        <p>
          ผู้ควบคุม: {controllerName} ({controllerTitle})
        </p>
      </div>
    </footer>
  );
}
