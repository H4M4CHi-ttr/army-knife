import { ToolError } from "./errors";
import { FILE_INSPECTOR_LIMITS } from "./file-inspectors";

export interface GitBlobReport {
  sha1: string;
  sha256: string;
}

export async function calculateGitBlob(bytes: Uint8Array): Promise<GitBlobReport> {
  if (bytes.byteLength > FILE_INSPECTOR_LIMITS.fileBytes) throw new ToolError("INPUT_TOO_LARGE");
  const header = new TextEncoder().encode(`blob ${bytes.byteLength}\0`);
  const object = new Uint8Array(header.length + bytes.byteLength);
  object.set(header);
  object.set(bytes, header.length);

  async function digest(format: "SHA-1" | "SHA-256"): Promise<string> {
    const hash = await crypto.subtle.digest(format, object);
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  const [sha1, sha256] = await Promise.all([digest("SHA-1"), digest("SHA-256")]);
  return { sha1, sha256 };
}
