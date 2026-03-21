import { NextResponse } from "next/server";
import { existsSync } from "fs";
import { readFile, unlink, writeFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import {
  buildStoredRelativePath,
  ensureResinSignedUploadsDir,
  resolveSignedDeliveryAbsolutePath,
} from "@/lib/resin-signed-delivery-uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 15 * 1024 * 1024;

const ALLOWED_EXT = new Map<string, string>([
  [".pdf", "application/pdf"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
]);

function extFromName(name: string): string {
  const lower = name.toLowerCase();
  const dot = lower.lastIndexOf(".");
  return dot >= 0 ? lower.slice(dot) : "";
}

function contentTypeForExt(ext: string): string {
  return ALLOWED_EXT.get(ext) ?? "application/octet-stream";
}

async function requireAdmin(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== "admin") {
    return NextResponse.json({ message: "无权限" }, { status: 403 });
  }
  return auth;
}

/** 下载/预览已上传的回签送货单（需登录） */
export async function GET(
  request: Request,
  context: { params: Promise<{ shipmentId: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { shipmentId } = await context.params;
  const shipment = await prisma.resinOrderShipment.findUnique({
    where: { id: shipmentId },
    select: { signedDeliveryNoteUrl: true, signedDeliveryNoteName: true },
  });
  if (!shipment?.signedDeliveryNoteUrl) {
    return NextResponse.json({ message: "尚未上传回签送货单" }, { status: 404 });
  }

  const abs = resolveSignedDeliveryAbsolutePath(shipment.signedDeliveryNoteUrl);
  if (!abs || !existsSync(abs)) {
    return NextResponse.json({ message: "文件不存在" }, { status: 404 });
  }

  const ext = extFromName(abs);
  const contentType = contentTypeForExt(ext);
  const { searchParams } = new URL(request.url);
  const wantInline =
    searchParams.get("inline") === "1" || searchParams.get("disposition") === "inline";
  const disposition = wantInline ? "inline" : "attachment";
  const downloadName =
    shipment.signedDeliveryNoteName?.replace(/[^\w.\u4e00-\u9fff-]+/g, "_") || `signed-delivery${ext || ".bin"}`;
  const asciiName = downloadName.replace(/[^\w.-]+/g, "_") || "signed-delivery";
  const cd = `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`;

  const buf = await readFile(abs);
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": cd,
      "Cache-Control": "private, no-store",
    },
  });
}

/** 上传或覆盖回签送货单（仅管理员） */
export async function POST(
  request: Request,
  context: { params: Promise<{ shipmentId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { shipmentId } = await context.params;
  const shipment = await prisma.resinOrderShipment.findUnique({
    where: { id: shipmentId },
    select: { id: true, resinOrderId: true, signedDeliveryNoteUrl: true },
  });
  if (!shipment) {
    return NextResponse.json({ message: "找不到发货记录" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "无效的表单数据" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: "请选择文件" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: "文件过大（最大 15MB）" }, { status: 400 });
  }

  const origName = typeof file.name === "string" ? file.name : "upload";
  const ext = extFromName(origName);
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ message: "仅支持 PDF、JPG、PNG" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const storedFileName = `${shipmentId}-${Date.now()}${ext}`;
  const relative = buildStoredRelativePath(storedFileName);

  await ensureResinSignedUploadsDir();
  const absNew = resolveSignedDeliveryAbsolutePath(relative);
  if (!absNew) {
    return NextResponse.json({ message: "路径无效" }, { status: 500 });
  }

  const prevAbs = resolveSignedDeliveryAbsolutePath(shipment.signedDeliveryNoteUrl);
  if (prevAbs && existsSync(prevAbs) && prevAbs !== absNew) {
    try {
      await unlink(prevAbs);
    } catch {
      // ignore
    }
  }

  await writeFile(absNew, buf);

  await prisma.resinOrderShipment.update({
    where: { id: shipmentId },
    data: {
      signedDeliveryNoteUrl: relative,
      signedDeliveryNoteName: origName,
      signedDeliveryUploadedAt: new Date(),
      arrivalConfirmed: true,
    },
  });

  revalidatePath("/resin-orders");
  revalidatePath(`/resin-orders/${shipment.resinOrderId}`);

  return NextResponse.json({
    success: true,
    signedDeliveryNoteUrl: relative,
    signedDeliveryNoteName: origName,
    viewUrl: `/api/resin-orders/shipments/${shipmentId}/signed-delivery-note?inline=1`,
  });
}
