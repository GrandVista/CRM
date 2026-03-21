import { NextResponse } from "next/server";

export function pdfBufferNextResponse(
  buffer: Buffer,
  opts: { disposition: "inline" | "attachment"; filename: string }
): NextResponse {
  const ascii =
    opts.filename.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").slice(0, 180) || "document.pdf";
  const cd = `${opts.disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(opts.filename)}`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": cd,
      "Cache-Control": "private, no-store",
    },
  });
}
