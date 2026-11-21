"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 active:bg-slate-100"
    >
      พิมพ์ตาราง (A4 แนวนอน)
    </button>
  );
}
