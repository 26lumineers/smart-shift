import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getMonthView, getShiftLegend } from "@/lib/db/queries";
import { DayCards } from "@/components/schedule/day-cards";
import { MonthPicker } from "@/components/schedule/month-picker";
import { StaffSelect } from "@/components/schedule/staff-select";
import { todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

function normalizeMonth(value: string | undefined): string {
  if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value;
  return todayISO().slice(0, 7);
}

type Props = {
  searchParams: Promise<{ month?: string; staff?: string }>;
};

/** "ตารางของฉัน" — มุมมองมือถือ (ค่าเริ่มต้น) */
export default async function MyPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const month = normalizeMonth(sp.month);
  const view = await getMonthView(month);
  const legend = await getShiftLegend();

  const targetId = sp.staff && view.staff.some((s) => s.id === Number(sp.staff))
    ? Number(sp.staff)
    : session.staffId;
  const target = view.staff.find((s) => s.id === targetId) ?? null;

  return (
    <main className="print-full mx-auto max-w-md px-3 py-4">
      <header className="no-print space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">
            {targetId === session.staffId ? "ตารางของฉัน" : `ตารางของ ${target?.name ?? ""}`}
          </h1>
          <form method="post" action="/api/auth/logout">
            <button
              type="submit"
              className="text-sm text-slate-500 underline underline-offset-2"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
        <MonthPicker month={month} basePath="/my" extra={{ staff: targetId === session.staffId ? undefined : targetId }} />
        <StaffSelect current={targetId} options={view.staff} month={month} />
        <div className="flex gap-2">
          <Link
            href={`/schedule?month=${month}`}
            className="flex-1 rounded-xl bg-slate-900 py-2.5 text-center text-sm font-medium text-white"
          >
            ดูตารางเต็มเดือน
          </Link>
        </div>
        {!view.exists && (
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
            ยังไม่มีตารางเดือนนี้
          </p>
        )}
      </header>

      <section className="mt-4">
        {target ? (
          <DayCards view={view} staffId={targetId} legend={legend} />
        ) : (
          <p className="text-sm text-slate-500">ไม่พบรายชื่อ</p>
        )}
      </section>
    </main>
  );
}
