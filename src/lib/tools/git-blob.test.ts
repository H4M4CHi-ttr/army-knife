import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import { calculateGitBlob } from "./git-blob";

test("matches Git in both repository formats for empty files and exact binary bytes", async () => {
  const directory = mkdtempSync(join(tmpdir(), "army-git-blob-"));
  try {
    const inputs = [new Uint8Array(), Uint8Array.of(0xef, 0xbb, 0xbf, 0x61, 13, 10, 0, 255)];
    const reports = await Promise.all(inputs.map(calculateGitBlob));
    for (const format of ["sha1", "sha256"] as const) {
      const cwd = join(directory, format);
      execFileSync("git", ["init", "--quiet", "--object-format=" + format, cwd]);
      for (const [index, input] of inputs.entries()) {
        const expected = execFileSync("git", ["hash-object", "--stdin", "--no-filters"], {
          cwd, input, encoding: "utf8",
        }).trim();
        expect(reports[index][format]).toBe(expected);
      }
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("rejects inputs above the file limit", async () => {
  await expect(calculateGitBlob(new Uint8Array(8 * 1024 * 1024 + 1)))
    .rejects.toMatchObject({ code: "INPUT_TOO_LARGE" });
});
