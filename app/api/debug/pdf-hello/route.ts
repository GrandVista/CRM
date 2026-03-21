import { NextResponse } from "next/server";
import PDFDocument from "@/lib/pdf/pdfkit-node";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 最小 PDF 烟测：不经过业务字体逻辑，用于确认 require + nodejs runtime 下 pdfkit 可用。
 * GET /api/debug/pdf-hello
 */
export async function GET() {
  console.log(PDFDocument);

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.fontSize(12).text("Hello PDF");
    doc.end();
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="hello.pdf"',
    },
  });
}
