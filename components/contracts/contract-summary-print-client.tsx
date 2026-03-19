"use client";

import { Button } from "@/components/ui/button";

export function ContractSummaryPrintClient() {
  return (
    <div className="no-print mt-8 flex gap-2">
      <Button size="sm" onClick={() => window.print()}>
        打印 / 导出 PDF
      </Button>
      <p className="text-sm text-muted-foreground self-center">
        点击后选择「另存为 PDF」或打印。
      </p>
    </div>
  );
}
