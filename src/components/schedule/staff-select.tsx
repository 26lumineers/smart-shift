"use client";

import { useRouter } from "next/navigation";

type Option = { id: number; name: string };

/** ตัวเลือกดูตารางของคนอื่น (หน้า "ตารางของฉัน") */
export function StaffSelect({
  current,
  options,
  month,
}: {
  current: number;
  options: Option[];
  month: string;
}) {
  const router = useRouter();

  return (
    <label className="no-print block text-sm">
      <span className="mb-1 block text-slate-500">ดูตารางของ</span>
      <select
        value={current}
        onChange={(e) => {
          const id = e.target.value;
          router.push(`/my?month=${month}&staff=${id}`);
        }}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}
