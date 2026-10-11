export async function readTextFile(file: File, maxBytes: number): Promise<string> {
  if (file.size > maxBytes) throw new Error("INPUT_TOO_LARGE");
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("INVALID_UTF8");
  }
}

export async function copyText(value: string): Promise<void> {
  if (!navigator.clipboard?.writeText) throw new Error("CLIPBOARD_UNAVAILABLE");
  await navigator.clipboard.writeText(value);
}

export function downloadText(
  value: string,
  filename: string,
  type = "text/plain;charset=utf-8",
): void {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
