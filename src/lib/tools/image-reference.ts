import { assertInputSize, ToolError } from "./errors.ts";

export const IMAGE_REFERENCE_LIMITS = { bytes: 1024, path: 255, tag: 128 } as const;
export interface ImageReferenceReport {
  normalized: string;
  pullReference: string;
  registry: string;
  /** Brackets are retained for IPv6. No DNS or port-range validation. */
  host: string;
  port: string | null;
  repository: string;
  tag: string | null;
  digest: string | null;
  selection: "tag" | "digest";
  tagIgnored: boolean;
  legacyRegistry: boolean;
  defaults: { registry: boolean; library: boolean; tag: boolean };
}
function fail(code = "IMAGE_REFERENCE_SYNTAX"): never { throw new ToolError(code); }

function ipv6(value: string): boolean {
  const halves = value.split("::");
  if (halves.length > 2) return false;
  const groups = halves.flatMap(half => half === "" ? [] : half.split(":"));
  return groups.every(group => /^[0-9a-fA-F]{1,4}$/.test(group)) &&
    (halves.length === 2 ? groups.length < 8 : groups.length === 8);
}

function registryParts(registry: string): { host: string; port: string | null } {
  const parts = /^(\[[0-9a-fA-F:]+\]|[A-Za-z0-9.-]+)(?::([0-9]+))?$/.exec(registry);
  if (!parts) fail();
  const host = parts[1]!;
  const valid = host.startsWith("[") ? ipv6(host.slice(1, -1)) :
    host.split(".").every(label => /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label));
  if (!valid) fail();
  return { host, port: parts[2] ?? null };
}

/** Bounded named-reference inspection; no registry lookup or digest verification. */
export function inspectImageReference(input: string): ImageReferenceReport {
  assertInputSize(input, IMAGE_REFERENCE_LIMITS.bytes);
  const value = input.replace(/^[ \t]+|[ \t]+$/g, "");
  if (!value || /[^\x21-\x7e]/.test(value)) fail();
  if (/^[a-f0-9]{64}$/.test(value) || /^sha256:[a-f0-9]{64}$/.test(value) || /^sha512:[a-f0-9]{128}$/.test(value)) fail("IMAGE_REFERENCE_ID");

  const pieces = value.split("@");
  if (pieces.length > 2 || !pieces[0] || pieces[1] === "") fail();
  const nameAndTag = pieces[0];
  const digest = pieces[1] ?? null;
  if (digest !== null) {
    const fields = digest.split(":");
    if (fields.length !== 2 || !fields[0] || !fields[1]) fail("IMAGE_REFERENCE_DIGEST");
    const [algorithm, hex] = fields;
    if (algorithm !== "sha256" && algorithm !== "sha512") fail("IMAGE_REFERENCE_ALGORITHM");
    if (!/^[a-f0-9]+$/.test(hex!) || hex!.length !== (algorithm === "sha256" ? 64 : 128)) fail("IMAGE_REFERENCE_DIGEST");
  }

  const tagStart = nameAndTag.indexOf(":", nameAndTag.lastIndexOf("/") + 1);
  const name = tagStart === -1 ? nameAndTag : nameAndTag.slice(0, tagStart);
  let tag: string | null = tagStart === -1 ? null : nameAndTag.slice(tagStart + 1);
  if (tag !== null && (!/^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(tag) || tag.length > IMAGE_REFERENCE_LIMITS.tag)) fail("IMAGE_REFERENCE_TAG");

  const slash = name.indexOf("/");
  const first = slash === -1 ? "" : name.slice(0, slash);
  const explicitRegistry = slash !== -1 && (first === "localhost" || /[.:A-Z]/.test(first));
  const legacyRegistry = explicitRegistry && first === "index.docker.io";
  const registry = explicitRegistry ? (legacyRegistry ? "docker.io" : first) : "docker.io";
  let repository = explicitRegistry ? name.slice(slash + 1) : name;
  const libraryDefaulted = registry === "docker.io" && !repository.includes("/");
  if (libraryDefaulted) repository = `library/${repository}`;
  if (repository.length > IMAGE_REFERENCE_LIMITS.path || !repository.split("/").every(part => /^[a-z0-9]+(?:(?:[._]|__|-+)[a-z0-9]+)*$/.test(part))) fail("IMAGE_REFERENCE_PATH");
  const { host, port } = registryParts(registry);
  const tagDefaulted = tag === null && digest === null;
  if (tagDefaulted) tag = "latest";
  const qualified = `${registry}/${repository}`;
  const normalized = `${qualified}${tag === null ? "" : `:${tag}`}${digest === null ? "" : `@${digest}`}`;
  return {
    normalized, pullReference: digest === null ? normalized : `${qualified}@${digest}`,
    registry, host, port, repository, tag, digest,
    selection: digest === null ? "tag" : "digest", tagIgnored: digest !== null && tag !== null, legacyRegistry,
    defaults: { registry: !explicitRegistry, library: libraryDefaulted, tag: tagDefaulted },
  };
}
