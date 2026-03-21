/**
 * 强制使用 CommonJS 入口，避免 Next/Turbopack 打成 pdfkit.es.js 导致内置 AFM 路径失效。
 */
/* eslint-disable @typescript-eslint/no-require-imports */
import type PDFDocumentType from "pdfkit";

const PDFDocument = require("pdfkit") as typeof PDFDocumentType;

console.log("[PDFKit] require() export:", PDFDocument);

export default PDFDocument;
