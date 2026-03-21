declare module "pdfkit" {
  import { Readable } from "stream";

  interface PDFDocumentOptions {
    size?: string | [number, number];
    margin?: number;
    info?: Record<string, string>;
  }

  interface PDFPage {
    height: number;
    margins: { top: number; bottom: number; left: number; right: number };
  }

  class PDFDocument extends Readable {
    constructor(options?: PDFDocumentOptions);
    y: number;
    page: PDFPage;
    addPage(): this;
    on(event: "data", listener: (chunk: Buffer) => void): this;
    on(event: "end", listener: () => void): this;
    on(event: "error", listener: (err: unknown) => void): this;
    registerFont(name: string, filePath: string): this;
    font(name: string): this;
    fontSize(size: number): this;
    text(
      text: string,
      x?: number,
      y?: number,
      options?: { width?: number; align?: string; continued?: boolean; underline?: boolean },
    ): this;
    /** 估算在给定 width 下换行后的高度（pt），用于分页前预留空间 */
    heightOfString(text: string, options?: { width?: number }): number;
    moveDown(lines?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    strokeColor(color: string): this;
    lineWidth(w: number): this;
    stroke(): this;
    rect(x: number, y: number, w: number, h: number): this;
    clip(rule?: string): this;
    save(): this;
    restore(): this;
    image(
      src: string,
      x: number,
      y: number,
      options?: {
        width?: number;
        height?: number;
        fit?: [number, number];
        scale?: number;
        align?: "center" | "right";
        valign?: string;
      },
    ): this;
    end(): void;
  }

  export default PDFDocument;
}
