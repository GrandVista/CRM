import path from "path";
import { mkdir } from "fs/promises";

const UPLOAD_SUBDIR = "resin-signed-delivery";

export function getResinSignedUploadsRoot(): string {
  return path.join(process.cwd(), "uploads", UPLOAD_SUBDIR);
}

export function buildStoredRelativePath(storedFileName: string): string {
  const safe = path.basename(storedFileName);
  return `${UPLOAD_SUBDIR}/${safe}`;
}

export function resolveSignedDeliveryAbsolutePath(storedRelative: string | null | undefined): string | null {
  if (!storedRelative?.trim()) return null;
  const normalized = path.normalize(storedRelative.trim()).replace(/^(\.\.(\/|\\|$))+/, "").replace(/\\/g, "/");
  const prefix = `${UPLOAD_SUBDIR}/`;
  if (!normalized.startsWith(prefix) || normalized === UPLOAD_SUBDIR) return null;
  const rest = normalized.slice(prefix.length);
  if (!rest || rest.split("/").some((p) => p === ".." || p === "")) return null;
  return path.join(process.cwd(), "uploads", UPLOAD_SUBDIR, ...rest.split("/"));
}

export async function ensureResinSignedUploadsDir(): Promise<void> {
  await mkdir(getResinSignedUploadsRoot(), { recursive: true });
}
