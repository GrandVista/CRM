/**
 * 裁剪 public/logo.png：去掉上下左右白边，近白背景变透明，覆盖保存为真 PNG。
 * 运行：npm run logo:trim
 */
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const logoPath = path.join(root, "public", "logo.png");

const TRIM_THRESHOLD = 14;
/** 视为「背景」的近白像素（含 JPEG 轻微杂点） */
function isBackground(r, g, b) {
  if (r >= 250 && g >= 250 && b >= 250) return true;
  if (r >= 242 && g >= 242 && b >= 242 && Math.max(r, g, b) - Math.min(r, g, b) <= 18) return true;
  return false;
}

async function main() {
  const trimmed = await sharp(logoPath)
    .trim({ threshold: TRIM_THRESHOLD })
    .toBuffer();

  const meta = await sharp(trimmed).metadata();
  const { width, height } = meta;
  if (!width || !height) {
    throw new Error("无法读取裁剪后的图片尺寸");
  }

  const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.channels !== 4) {
    throw new Error(`预期 RGBA，实际 channels=${info.channels}`);
  }

  const buf = Buffer.from(data);
  for (let i = 0; i < buf.length; i += 4) {
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    if (isBackground(r, g, b)) buf[i + 3] = 0;
  }

  await sharp(buf, { raw: { width, height, channels: 4 } })
    /* palette: false → 真彩色 + alpha，避免 8-bit 调色板丢透明 */
    .png({ compressionLevel: 9, effort: 9, palette: false })
    .toFile(logoPath);

  const after = await sharp(logoPath).metadata();
  console.log("[trim-logo] 已写入:", logoPath);
  console.log("[trim-logo] 尺寸:", after.width, "x", after.height, "format:", after.format);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
