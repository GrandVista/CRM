"use client";

export function PrintButton({ label = "打印 / Print" }: { label?: string }) {
  return (
    <button
      type="button"
      className="rounded bg-black px-4 py-2 text-white"
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}
