import type { MonthView } from "@/lib/db/queries";

type Props = {
  view: MonthView;
  organizerName: string;
  organizerTitle: string;
  controllerName: string;
  controllerTitle: string;
};

type LegendRow = { code: string; text: string };

/**
 * ข้อความท้ายตารางตามแบบฟอร์ม F-OPR-012 (คงข้อความตามเอกสารจริง)
 * ส่วนชื่อ/เบอร์โทร/ผู้ลงนาม ดึงจากฐานข้อมูล
 */
const SHARED_LEGEND: LegendRow[] = [
  { code: "CKD/DM/HT", text: "หมายถึง เวรปฏิบัติราชการ เวลา 07.00 - 08.00 น" },
  {
    code: "B*",
    text: "หมายถึง เวรตรวจเลือด ANC และลงข้อมูลโครงการให้บริการผู้ติดเชื้อ / ผู้ป่วยเอดส์ของ สปสช.",
  },
  {
    code: "ส3 (เสริมชั้น3)",
    text: "หมายถึง เวรปฏิบัติราชการ เวลา 07.00 - 08.00 น ที่ห้องปฏิบัติการชั้น 3",
  },
  {
    code: "SMC",
    text: "หมายถึง เวรปฏิบัติราชการคลินิกเฉพาะทางนอกเวลา เวลา 16.00 - 20.00 น ที่ห้องปฏิบัติการชั้น 3",
  },
];

const MT_LEGEND: LegendRow[] = [
  { code: "ช1", text: "หมายถึง เวรปฏิบัติราชการ เวลา 08.00 - 16.00 น. ลงพัก 11.00 น" },
  { code: "ช2", text: "หมายถึง เวรปฏิบัติราชการ เวลา 08.00 - 16.00 น. ลงพัก 12.00 น" },
  { code: "ช3", text: "หมายถึง เวรปฏิบัติราชการเฉพาะเชื้อ เวลา 08.00 - 16.00 น. ลงพัก 12.00 น" },
  { code: "บ1", text: "หมายถึง เวรปฏิบัติราชการ เวลา 16.00 - 24.00 น. ลงพัก 17.00 น." },
  { code: "บ2", text: "หมายถึง เวรปฏิบัติราชการ เวลา 16.00 - 24.00 น. ลงพัก 18.00 น." },
  { code: "ด", text: "หมายถึง เวรปฏิบัติราชการ เวลา 00.00 - 08.00 น." },
];

const ASST_LEGEND: LegendRow[] = [
  { code: "ช1", text: "หมายถึง เวรปฏิบัติราชการ เวลา 07.00 - 15.00 น. ลงพัก 11.00 น" },
  { code: "ช2", text: "หมายถึง เวรปฏิบัติราชการ เวลา 08.00 - 16.00 น. ลงพัก 12.00 น" },
  { code: "BD", text: "หมายถึง เวรปฏิบัติราชการ เวลา 16.00 - 20.00 น." },
];

/** ตัดคำนำหน้าชื่อและนามสกุลออก ให้เหลือชื่อจริงอย่างในแบบฟอร์ม */
function firstName(name: string) {
  return (
    name
      .replace(/^(นางสาว|นาง|นาย|น\.ส\.|นส\.)\s*/, "")
      .split(/\s+/)[0] ?? ""
  );
}

function Legend({ title, rows }: { title: string; rows: LegendRow[] }) {
  return (
    <section>
      <p className="font-bold">{title}</p>
      <div className="mt-0.5 space-y-0.5 print:mt-0 print:space-y-0">
        {rows.map((r) => (
          <div
            key={r.code}
            className="grid grid-cols-[7rem_1fr] gap-x-1.5 print:grid-cols-[78pt_1fr]"
          >
            <span className="whitespace-nowrap">{r.code}</span>
            <span>{r.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SignatureBlock({
  role,
  name,
  title,
}: {
  role: string;
  name: string;
  title: string;
}) {
  return (
    <div className="text-center">
      <p className="whitespace-nowrap">
        (ลงชื่อ){" "}
        <span className="inline-block w-36 border-b border-dotted border-slate-500 align-baseline print:w-[96px]">
          &nbsp;
        </span>{" "}
        {role}
      </p>
      <p>({name})</p>
      <p>ตำแหน่ง {title}</p>
      <p>
        วันที่{" "}
        <span className="inline-block w-28 border-b border-dotted border-slate-500 align-baseline print:w-[80px]">
          &nbsp;
        </span>
      </p>
    </div>
  );
}

/** ท้ายตารางตามรูปแบบ F-OPR-012: คำอธิบายเวลาเวร เบอร์โทร ช่องลงชื่อ */
export function TableFooter({
  view,
  organizerName,
  organizerTitle,
  controllerName,
  controllerTitle,
}: Props) {
  const mtStaff = view.staff.filter((s) => s.roleType === "MT");
  const half = Math.floor(mtStaff.length / 2);
  const phoneColumns = [mtStaff.slice(0, half), mtStaff.slice(half)];
  const phoneRows = Math.max(...phoneColumns.map((c) => c.length), 0);

  return (
    <footer className="form-footer print-block mt-4 rounded-xl bg-white p-4 text-[11px] leading-snug text-slate-800 shadow-sm ring-1 ring-slate-200 print:mt-1 print:rounded-none print:p-0 print:text-[7pt] print:leading-tight print:shadow-none print:ring-0">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-12 print:gap-x-4 print:gap-y-1">
        <div className="space-y-2.5 sm:col-span-5 print:space-y-1">
          <Legend title="เวลาการปฏิบัติงาน" rows={SHARED_LEGEND} />
          <Legend title="เวลาปฏิบัติงานนักเทคนิคการแพทย์" rows={MT_LEGEND} />
          <p>F-OPR-012 (แก้ไขครั้งที่ 01 15 / 10 / 42)</p>
        </div>

        <div className="space-y-2.5 sm:col-span-4 print:space-y-1">
          <Legend title="เวลาปฏิบัติงานผู้ช่วยห้องปฏิบัติการ" rows={ASST_LEGEND} />
          <section>
            <p className="font-bold">เบอร์โทรติดต่อ</p>
            <table className="mt-0.5 w-full table-fixed border-collapse">
              <tbody>
                {Array.from({ length: phoneRows }).map((_, i) => (
                  <tr key={i}>
                    {phoneColumns.map((col, ci) => {
                      const s = col[i];
                      return (
                        <td
                          key={ci}
                          className="border border-slate-500 px-1.5 py-0.5 print:px-1 print:py-0"
                        >
                          <span className="flex justify-between gap-2">
                            <span>{s ? firstName(s.name) : "\u00a0"}</span>
                            <span>{s?.phone ?? "\u00a0"}</span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <div className="flex flex-col justify-around gap-6 sm:col-span-3 print:gap-2">
          <SignatureBlock role="ผู้จัดเวร" name={organizerName} title={organizerTitle} />
          <SignatureBlock role="ผู้ควบคุม" name={controllerName} title={controllerTitle} />
        </div>
      </div>
    </footer>
  );
}