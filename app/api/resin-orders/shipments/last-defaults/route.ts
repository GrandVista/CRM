import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import type { ResinShipmentLastPersonDefaults } from "@/lib/resin-shipment-last-defaults";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 全局最近一条发货记录上的发货人/审核/开票人（按 createdAt 倒序），供「录入发货」默认值。
 */
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const latest = await prisma.resinOrderShipment.findFirst({
    orderBy: { createdAt: "desc" },
    select: { shipper: true, reviewer: true, invoicer: true },
  });

  const body: ResinShipmentLastPersonDefaults = {
    shipper: latest?.shipper?.trim() || null,
    reviewer: latest?.reviewer?.trim() || null,
    invoicer: latest?.invoicer?.trim() || null,
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
