import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const db = getDb();
  const staff = await db
    .select({ id: schema.staff.id, name: schema.staff.name, pinHash: schema.staff.pinHash })
    .from(schema.staff)
    .where(eq(schema.staff.active, true))
    .orderBy(asc(schema.staff.orderNo));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-center text-xl font-bold text-slate-900">
          ตารางเวรนอกเวลาราชการ
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          กลุ่มงานเทคนิคการแพทย์ รพ.สมเด็จพระยุพราชกระนวน
        </p>

        <LoginForm
          staff={staff.map((s) => ({
            id: s.id,
            name: s.name,
            hasPin: !!s.pinHash,
          }))}
        />
      </div>
    </main>
  );
}
