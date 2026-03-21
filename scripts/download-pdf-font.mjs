#!/usr/bin/env node
/**
 * 下载 Noto Sans CJK SC Regular / Bold 到 public/fonts，供 pdfkit 服务端生成 PDF（使用磁盘上的 OTF 路径）。
 * 运行：node scripts/download-pdf-font.mjs
 * 或：npm run fonts:pdf
 */
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "fonts");

const FONTS = [
  {
    name: "Regular",
    url: "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf",
    filename: "NotoSansSC-Regular.otf",
  },
  {
    name: "Bold",
    url: "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Bold.otf",
    filename: "NotoSansSC-Bold.otf",
  },
];

function downloadToFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    const request = (currentUrl) => {
      https
        .get(currentUrl, { headers: { "User-Agent": "GrandVista-CRM-font-fetch/1" } }, (res) => {
          const code = res.statusCode ?? 0;
          if (code === 301 || code === 302 || code === 307 || code === 308) {
            const loc = res.headers.location;
            res.resume();
            if (!loc) {
              reject(new Error("Redirect without Location"));
              return;
            }
            const next = new URL(loc, currentUrl).href;
            request(next);
            return;
          }
          if (code !== 200) {
            res.resume();
            reject(new Error(`HTTP ${code} for ${currentUrl}`));
            return;
          }
          res.pipe(file);
          file.on("finish", () => {
            file.close((err) => (err ? reject(err) : resolve()));
          });
        })
        .on("error", (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
    };

    request(url);
  });
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  for (const { name, url, filename } of FONTS) {
    const outPath = path.join(OUT_DIR, filename);
    console.log(`Downloading Noto Sans CJK SC (${name})…`);
    await downloadToFile(url, outPath);
    const bytes = fs.statSync(outPath).size;
    console.log(`Saved ${filename} (${bytes} bytes)`);
  }
  console.log("Done. Paths:", FONTS.map((f) => path.join(OUT_DIR, f.filename)).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
