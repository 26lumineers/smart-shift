"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type StaffOption = { id: number; name: string; hasPin: boolean };

export function LoginForm({ staff }: { staff: StaffOption[] }) {
  const router = useRouter();
  const [staffId, setStaffId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!staffId) {
      setError("เลือกชื่อก่อน");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: Number(staffId), pin }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
        setPin("");
        return;
      }
      router.replace("/my");
      router.refresh();
    } catch {
      setError("เชื่อมต่อไม่ได้ ลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="staff" className="mb-1 block text-sm font-medium text-slate-700">
          ชื่อ-นามสกุล
        </label>
        <select
          id="staff"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base"
          autoComplete="off"
        >
          <option value="">— เลือกชื่อของคุณ —</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {!s.hasPin ? " (ยังไม่ได้ตั้ง PIN)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="pin" className="mb-1 block text-sm font-medium text-slate-700">
          PIN
        </label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.5em]"
          placeholder="••••••"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-slate-900 py-3 text-base font-medium text-white disabled:opacity-50"
      >
        {busy ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
