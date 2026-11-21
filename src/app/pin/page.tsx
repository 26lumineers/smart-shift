import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { ChangePinForm } from "./change-pin-form";

export const dynamic = "force-dynamic";

/** เปลี่ยน PIN ของตัวเอง */
export default async function PinPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <Link href="/my" className="text-sm text-slate-500 underline underline-offset-2">
          ← ตารางของฉัน
        </Link>
        <h1 className="mt-4 text-xl font-bold text-slate-900">เปลี่ยน PIN</h1>
        <p className="mt-1 text-sm text-slate-500">{session.name}</p>

        <ChangePinForm />

        <p className="mt-6 text-center text-xs text-slate-400">
          ลืม PIN? ติดต่อผู้ดูแลระบบเพื่อตั้ง PIN ใหม่
        </p>
      </div>
    </main>
  );
}