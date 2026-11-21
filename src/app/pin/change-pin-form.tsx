"use client";

import { useState } from "react";
import { isValidPin, PIN_LENGTH } from "@/lib/auth/pin";

const PIN_HINT = `PIN ต้องเป็นตัวเลข ${PIN_LENGTH} หลัก`;

export function ChangePinForm() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (!isValidPin(currentPin) || !isValidPin(newPin)) {
      setError(PIN_HINT);
      return;
    }
    if (newPin !== confirmPin) {
      setError("PIN ใหม่ทั้งสองช่องไม่ตรงกัน");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "เปลี่ยน PIN ไม่สำเร็จ");
        return;
      }
      setDone(true);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    } catch {
      setError("เชื่อมต่อไม่ได้ ลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <PinField
        id="current-pin"
        label="PIN ปัจจุบัน"
        value={currentPin}
        onChange={setCurrentPin}
      />
      <PinField id="new-pin" label="PIN ใหม่" value={newPin} onChange={setNewPin} />
      <PinField
        id="confirm-pin"
        label="ยืนยัน PIN ใหม่"
        value={confirmPin}
        onChange={setConfirmPin}
      />

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          เปลี่ยน PIN แล้ว
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-slate-900 py-3 text-base font-medium text-white disabled:opacity-50"
      >
        {busy ? "กำลังบันทึก…" : "บันทึก PIN ใหม่"}
      </button>
    </form>
  );
}

function PinField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.5em]"
        placeholder="••••••"
      />
    </div>
  );
}