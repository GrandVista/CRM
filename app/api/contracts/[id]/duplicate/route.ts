import { NextResponse } from "next/server";
import { duplicateContract } from "@/lib/actions/contracts";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const contract = await duplicateContract(id);
    return NextResponse.json(contract);
  } catch (e) {
    const message = e instanceof Error ? e.message : "复制合同失败";
    const status = message === "合同不存在" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
