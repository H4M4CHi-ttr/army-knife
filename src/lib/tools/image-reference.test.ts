import { describe, expect, it } from "vite-plus/test";
import { inspectImageReference } from "./image-reference";

const hash = "0123456789abcdef".repeat(4);
const digest = `sha256:${hash}`;
function code(input: string) {
  try { inspectImageReference(input); return "NO_ERROR"; }
  catch (error) { return (error as { code: string }).code; }
}

describe("offline named Docker image references", () => {
  it("makes all omitted Docker Hub defaults explicit", () => {
    expect(inspectImageReference(" \talpine\t ")).toEqual({
      normalized: "docker.io/library/alpine:latest", pullReference: "docker.io/library/alpine:latest",
      registry: "docker.io", host: "docker.io", port: null, repository: "library/alpine",
      tag: "latest", digest: null, selection: "tag", tagIgnored: false, legacyRegistry: false,
      defaults: { registry: true, library: true, tag: true },
    });
  });
  it.each([
    ["team/app:V1_rc.2", "docker.io", "team/app", "V1_rc.2", true, false],
    ["docker.io/alpine:3.21", "docker.io", "library/alpine", "3.21", false, true],
    ["index.docker.io/alpine", "docker.io", "library/alpine", "latest", false, true],
    ["ghcr.io/team/app:stable", "ghcr.io", "team/app", "stable", false, false],
    ["localhost/app", "localhost", "app", "latest", false, false],
    ["registry/team/app", "docker.io", "registry/team/app", "latest", true, false],
    ["Registry/team/app", "Registry", "team/app", "latest", false, false],
    ["DOCKER.IO/app", "DOCKER.IO", "app", "latest", false, false],
    ["example.com", "docker.io", "library/example.com", "latest", true, true],
    ["localhost:5000", "docker.io", "library/localhost", "5000", true, true],
  ] as const)("separates defaults from declared components in %s", (input, registry, repository, tag, defaultRegistry, defaultLibrary) => {
    const report = inspectImageReference(input);
    expect(report).toMatchObject({ registry, repository, tag, defaults: { registry: defaultRegistry, library: defaultLibrary } });
    expect(report.legacyRegistry).toBe(input.startsWith("index.docker.io/"));
  });
  it("retains exact registry and port text without numeric conversion or a network claim", () => {
    expect(inspectImageReference("Registry.Example:09007199254740993/team/app:build")).toMatchObject({
      host: "Registry.Example", port: "09007199254740993", registry: "Registry.Example:09007199254740993",
      pullReference: "Registry.Example:09007199254740993/team/app:build",
    });
    expect(inspectImageReference("127.0.0.1:5000/app").host).toBe("127.0.0.1");
  });
  it("preserves a supplied tag but selects the digest without adding latest", () => {
    const both = inspectImageReference(`alpine:stable@${digest}`);
    expect(both).toMatchObject({ normalized: `docker.io/library/alpine:stable@${digest}`, pullReference: `docker.io/library/alpine@${digest}`, tag: "stable", digest, selection: "digest", tagIgnored: true, defaults: { tag: false } });
    expect(inspectImageReference(`alpine@${digest}`)).toMatchObject({ normalized: `docker.io/library/alpine@${digest}`, tag: null, tagIgnored: false, defaults: { tag: false } });
    const sha512 = `sha512:${"a".repeat(128)}`;
    expect(inspectImageReference(`host.test/r@${sha512}`).digest).toBe(sha512);
  });
  it.each(["[::1]:5000/r", "[2001:db8::1]/r", "[2001:0DB8:0:0:0:0:0:1]/r", "[::]/r"])("accepts bracketed IPv6 while preserving spelling: %s", input => {
    expect(inspectImageReference(input).normalized).toBe(`${input}:latest`);
  });
  it.each(["a.b/c_d/r__s:t", "a/b--c:Tag_1", "team/a---b:__", "docker.io/library/a_b.c--d"])("accepts supported separators and case-sensitive tags: %s", input => {
    expect(code(input)).toBe("NO_ERROR");
  });
  it("enforces normalized path, tag and raw byte boundaries without truncation", () => {
    expect(inspectImageReference(`host.test/${"a".repeat(255)}`).repository).toHaveLength(255);
    expect(code(`host.test/${"a".repeat(256)}`)).toBe("IMAGE_REFERENCE_PATH");
    expect(inspectImageReference("a".repeat(247)).repository).toHaveLength(255);
    expect(code("a".repeat(248))).toBe("IMAGE_REFERENCE_PATH");
    expect(inspectImageReference(`a:${"A".repeat(128)}`).tag).toHaveLength(128);
    expect(code(`a:${"A".repeat(129)}`)).toBe("IMAGE_REFERENCE_TAG");
    expect(code("a" + " ".repeat(1023))).toBe("NO_ERROR");
    expect(code("a" + " ".repeat(1024))).toBe("INPUT_TOO_LARGE");
    expect(code("\u00e9".repeat(513))).toBe("INPUT_TOO_LARGE");
  });
  it.each(["", " ", "docker pull alpine", "https://ghcr.io/team/app", "docker://alpine", "a\nb", "a\r", "a\0", "a\u00a0", "a\u202e", "\uFEFFa", "a b", "a//b", "/a", "a/", "a@@sha256:ab", "a@", "reg.test:/a", "-reg.test/a", "reg-.test/a", "reg..test/a", "reg.test:abc/a", "user@reg.test/a", "[::::]/a", "[2001:db8:1]/a", "[1:2:3:4:5:6:7:8:9]/a", "[1:2:3:4:5:6:7:8::]/a", "[fe80::1%eth0]/a", "[::ffff:127.0.0.1]/a", "::1/a", "<img src=x onerror=alert(1)>"])("rejects malformed or out-of-scope input without echoing it: %s", input => {
    expect(code(input)).not.toBe("NO_ERROR");
    try { inspectImageReference(input); } catch (error) { expect((error as Error).message).not.toContain(input || "DO_NOT_ECHO"); }
  });
  it.each(["UPPER", "team/App", "a___b", "a..b", "a_-b", ".a", "a_", "a/-b"])("rejects nonconforming repository paths: %s", input => {
    expect(code(input)).toBe("IMAGE_REFERENCE_PATH");
  });
  it.each(["a:", "a:.tag", "a:-tag", "a:t:extra", "a:t/extra"])("rejects malformed tags: %s", input => {
    expect(code(input)).not.toBe("NO_ERROR");
  });
  it.each([`a@sha256:${"a".repeat(63)}`, `a@sha256:${"a".repeat(65)}`, `a@sha256:${hash.toUpperCase()}`, `a@sha512:${"a".repeat(127)}`, `a@sha256:${"g".repeat(64)}`, "a@sha256:abcd", "a@sha256:0:1"])("rejects malformed supported digests: %s", input => {
    expect(code(input)).toBe("IMAGE_REFERENCE_DIGEST");
  });
  it.each(["sha384", "blake3", "SHA256", "sha256+b64"])("explicitly limits algorithm support: %s", algorithm => {
    expect(code(`a@${algorithm}:${hash}`)).toBe("IMAGE_REFERENCE_ALGORITHM");
  });
  it("requires named references instead of raw image IDs or digests", () => {
    expect(code(hash)).toBe("IMAGE_REFERENCE_ID");
    expect(code(digest)).toBe("IMAGE_REFERENCE_ID");
    expect(code(`sha512:${"a".repeat(128)}`)).toBe("IMAGE_REFERENCE_ID");
    expect(inspectImageReference(`docker.io/${hash}`).repository).toBe(`library/${hash}`);
    expect(inspectImageReference("abc123").repository).toBe("library/abc123");
  });
});
