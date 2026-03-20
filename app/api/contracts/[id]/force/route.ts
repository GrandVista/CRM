import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/server-auth";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ["admin"]);
    if (auth instanceof NextResponse) {
      return NextResponse.json(
        { success: false, message: "只有管理员可以强制删除合同" },
        { status: 403 }
      );
    }

    const { id: contractId } = await context.params;
    const existing = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, contractNo: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "合同不存在" },
        { status: 404 }
      );
    }

    const deletedRelationsSummary = await prisma.$transaction(async (tx) => {
      const invoicesDeleted = (
        await tx.commercialInvoice.deleteMany({ where: { contractId } })
      ).count;
      const packingListsDeleted = (
        await tx.packingList.deleteMany({ where: { contractId } })
      ).count;
      const shipmentsDeleted = (
        await tx.shipment.deleteMany({ where: { contractId } })
      ).count;
      const paymentsDeleted = (
        await tx.payment.deleteMany({ where: { contractId } })
      ).count;

      // 其余直接关联 Contract 的子表（保险起见显式删除，避免外键约束差异）
      await tx.contractItem.deleteMany({ where: { contractId } });
      await tx.contractAttachment.deleteMany({ where: { contractId } });
      await tx.contractLog.deleteMany({ where: { contractId } });
      await tx.documentTodo.deleteMany({ where: { contractId } });

      await tx.contract.delete({ where: { id: contractId } });

      return {
        invoicesDeleted,
        packingListsDeleted,
        shipmentsDeleted,
        paymentsDeleted,
      };
    });

    console.info("[force_delete_contract]", {
      operator: auth.user.email,
      contractId: existing.id,
      contractNo: existing.contractNo,
      ...deletedRelationsSummary,
      operatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "强制删除成功",
      deletedContractId: existing.id,
      deletedRelationsSummary,
    });
  } catch (error) {
    console.error("Force delete contract error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "强制删除失败，请稍后重试",
      },
      { status: 500 }
    );
  }
}
