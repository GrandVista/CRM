import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import {
  CONTRACT_ATTACHMENT_CATEGORY,
  ALLOWED_PDF_MIME,
  MAX_SIGNED_CONTRACT_PDF_SIZE,
} from "@/lib/contract-attachment-constants";

const CATEGORY = CONTRACT_ATTACHMENT_CATEGORY.SIGNED_CONTRACT;

function getUploadDir(contractId: string): string {
  return path.join(process.cwd(), "public", "uploads", "contracts", contractId);
}

/** GET: 列出合同附件，支持 ?category=SIGNED_CONTRACT */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;

  const list = await prisma.contractAttachment.findMany({
    where: { contractId, ...(category ? { category } : {}) },
    orderBy: { uploadedAt: "desc" },
  });
  return NextResponse.json(list);
}

/** POST: 上传已签署合同 PDF */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params;

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { id: true },
  });
  if (!contract) {
    return NextResponse.json({ error: "合同不存在" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "请选择要上传的 PDF 文件" }, { status: 400 });
  }

  if (file.type !== ALLOWED_PDF_MIME) {
    return NextResponse.json({ error: "仅允许上传 PDF 文件" }, { status: 400 });
  }
  if (file.size > MAX_SIGNED_CONTRACT_PDF_SIZE) {
    return NextResponse.json(
      { error: `文件大小不能超过 ${MAX_SIGNED_CONTRACT_PDF_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  const ext = path.extname(file.name) || ".pdf";
  const storedName = `${randomUUID()}${ext}`;
  const uploadDir = getUploadDir(contractId);
  const filePath = path.join(uploadDir, storedName);

  try {
    await mkdir(uploadDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));
  } catch (e) {
    console.error("Upload write error:", e);
    return NextResponse.json({ error: "文件保存失败" }, { status: 500 });
  }

  const fileUrl = `/uploads/contracts/${contractId}/${storedName}`;

  const attachment = await prisma.contractAttachment.create({
    data: {
      contractId,
      fileName: file.name,
      fileUrl,
      fileType: file.type,
      category: CATEGORY,
      fileSize: file.size,
    },
  });

  return NextResponse.json(attachment);
}
