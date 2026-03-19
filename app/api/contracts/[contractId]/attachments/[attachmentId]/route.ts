import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { unlink } from "fs/promises";

function getUploadDir(contractId: string): string {
  return path.join(process.cwd(), "public", "uploads", "contracts", contractId);
}

/** DELETE: 删除附件（同时删除磁盘文件） */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ contractId: string; attachmentId: string }> }
) {
  const { contractId, attachmentId } = await params;

  const att = await prisma.contractAttachment.findFirst({
    where: { id: attachmentId, contractId },
    select: { id: true, fileUrl: true },
  });
  if (!att) {
    return NextResponse.json({ error: "附件不存在" }, { status: 404 });
  }

  await prisma.contractAttachment.delete({ where: { id: attachmentId } });

  const fileName = path.basename(att.fileUrl);
  const filePath = path.join(getUploadDir(contractId), fileName);
  try {
    await unlink(filePath);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Delete file error:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
