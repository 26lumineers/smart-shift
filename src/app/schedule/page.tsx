import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getMonthView, getSetting } from "@/lib/db/queries";
import { MonthPicker } from "@/components/schedule/month-picker";
import { MonthTable } from "@/components/schedule/month-table";
import { TableFooter } from "@/components/schedule/table-footer";
import { PrintButton } from "@/components/schedule/print-button";
import { todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

function normalizeMonth(value: string | undefined): string {
  if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value;
  return todayISO().slice(0, 7);
}

/** ตารางเต็มเดือน (เลื่อนแนวนอน + พิมพ์ A4 แนวนอน) */
export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const month = normalizeMonth(sp.month);
  const view = await getMonthView(month);
  const organizerName =
    (await getSetting<string>("organizer_name")) ?? "……………………";
  const organizerTitle =
    (await getSetting<string>("organizer_title")) ?? "……………………";
  const controllerName =
    (await getSetting<string>("controller_name")) ?? "……………………";
  const controllerTitle =
    (await getSetting<string>("controller_title")) ?? "นักเทคนิคการแพทย์ชำนาญการ";

  return (
    <main className="schedule-page print-full w-full max-w-none px-2 py-3 sm:px-4">
      <header className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/my" className="text-sm text-slate-500 underline underline-offset-2">
            ← ตารางของฉัน
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker month={month} basePath="/schedule" />
          <PrintButton />
        </div>
      </header>

      <h1 className="page-title print-block mb-2 text-center text-base font-bold text-slate-900">
        ตารางปฏิบัติงานนอกเวลาราชการและวันหยุดราชการ
        <span className="ml-2 text-sm font-normal text-slate-600">
          กลุ่มงานเทคนิคการแพทย์ รพ.สมเด็จพระยุพราชกระนวน
        </span>
      </h1>

      {view.exists ? (
        <>
          <MonthTable view={view} highlightStaffId={session.staffId} />
          <TableFooter
            view={view}
            organizerName={organizerName}
            organizerTitle={organizerTitle}
            controllerName={controllerName}
            controllerTitle={controllerTitle}
          />
        </>
      ) : (
        <p className="rounded-xl bg-white px-4 py-8 text-center text-slate-600 shadow-sm ring-1 ring-slate-200">
          ยังไม่มีตารางเดือนนี้
        </p>
      )}
    </main>
  );
}
