#!/usr/bin/env node
/**
 * 下载 Noto Sans CJK SC Regular 字体到 public/fonts，供合同汇总 PDF 使用。
 * 运行：node scripts/download-pdf-font.mjs
 */
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_URL =
  "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf";
const OUT_DIR = path.join(__dirname, "..", "public", "fonts");
const OUT_FILE = path.join(OUT_DIR, "NotoSansSC-Regular.otf");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

console.log("Downloading Noto Sans CJK SC (Simplified Chinese) font...");
const file = fs.createWriteStream(OUT_FILE);
https
  .get(FONT_URL, { headers: { "User-Agent": "Node" } }, (res) => {
    if (res.statusCode !== 200) {
      console.error("Download failed:", res.statusCode);
      process.exit(1);
    }
    res.pipe(file);
    file.on("finish", () => {
      file.close();
      console.log("Saved to", OUT_FILE);
    });
  })
  .on("error", (err) => {
    fs.unlink(OUT_FILE, () => {});
    console.error("Error:", err.message);
    process.exit(1);
  });
