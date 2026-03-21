"use client";

import { Button } from "@/components/ui/button";

type Props = {
  /** 默认无 query：服务端 Content-Disposition: inline */
  previewUrl: string;
  /** 须含 ?download=1：服务端 Content-Disposition: attachment */
  downloadUrl: string;
  className?: string;
};

/**
 * 预览/下载均用原生导航，不使用 fetch/blob，以便浏览器正确处理 PDF 与 Content-Disposition。
 */
export function PdfActionButtons({ previewUrl, downloadUrl, className }: Props) {
  return (
    <div className={className ?? "flex flex-wrap items-center gap-2"}>
      <Button asChild variant="outline" size="sm">
        <a href={previewUrl} target="_blank" rel="noopener noreferrer">
          预览 PDF
        </a>
      </Button>
      <Button asChild variant="default" size="sm">
        <a href={downloadUrl}>下载 PDF</a>
      </Button>
    </div>
  );
}
