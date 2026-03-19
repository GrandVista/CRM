"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { completeDocumentTodo } from "@/lib/actions/document-todos";

export function CompleteTodoButton({ todoId }: { todoId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await completeDocumentTodo(todoId);
          router.refresh();
        });
      }}
    >
      {isPending ? "处理中…" : "标记完成"}
    </Button>
  );
}
