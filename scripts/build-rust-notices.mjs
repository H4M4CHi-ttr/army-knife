import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = join(root, 'crates/army-knife-core/Cargo.toml');
const destination = join(root, 'public/licenses/rust-dependencies.txt');
const licenseName = /^(?:licen[cs]e|copying|notice|unlicense)/i;
const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;

function fail(pkg, message) {
  throw new Error(`${pkg.name} ${pkg.version}: ${message}`);
}

function inside(directory, path) {
  const name = relative(directory, path);
  return name !== '' && !isAbsolute(name) && name !== '..' && !name.startsWith(`..${sep}`);
}

function licenseFiles(pkg) {
  const directory = dirname(pkg.manifest_path);
  const files = new Set();

  function walk(path, insideLicenseDirectory = false) {
    const entries = readdirSync(path, { withFileTypes: true }).sort((a, b) => compare(a.name, b.name));
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'target') continue;
      const full = join(path, entry.name);
      const selected = insideLicenseDirectory || licenseName.test(entry.name);
      if (entry.isSymbolicLink()) {
        if (selected) fail(pkg, 'a license document is a symbolic link; review its original text.');
        continue;
      }
      if (entry.isDirectory()) walk(full, selected);
      else if (selected && entry.isFile()) files.add(full);
    }
  }

  walk(directory);
  if (pkg.license_file) {
    const explicit = resolve(directory, pkg.license_file);
    if (!inside(directory, explicit)) fail(pkg, 'license_file must stay inside its crate directory.');
    // Reject symlinks at every component, including a license_file parent directory.
    let current = directory;
    for (const component of relative(directory, explicit).split(sep)) {
      current = join(current, component);
      let stat;
      try { stat = lstatSync(current); }
      catch { fail(pkg, 'the declared license_file is missing.'); }
      if (stat.isSymbolicLink()) fail(pkg, 'the declared license_file contains a symbolic link.');
    }
    if (!lstatSync(explicit).isFile()) fail(pkg, 'the declared license_file is not a regular file.');
    files.add(explicit);
  }
  if (files.size === 0) fail(pkg, 'no original LICENSE, COPYING, NOTICE, or UNLICENSE documents were found.');
  if (!pkg.license_file && ![...files].some((path) => relative(directory, path).split(sep)
    .some((part) => /^(?:licen[cs]e|copying|unlicense)/i.test(part)))) {
    fail(pkg, 'only notices were found; an original license text is also required.');
  }

  return [...files].map((path) => {
    const name = relative(directory, path).split(sep).join('/');
    const bytes = readFileSync(path);
    let content;
    try { content = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { fail(pkg, `license document ${name} is not valid UTF-8.`); }
    if (!content.trim()) fail(pkg, `license document ${name} is empty.`);
    return { name, bytes };
  }).sort((a, b) => compare(a.name, b.name));
}

/**
 * Collect every resolved dependency, including build-time crates, conservatively.
 * The root application has its own distributed LICENSE and is not a dependency.
 * Local metadata IDs, source paths, timestamps, and host details are never emitted.
 */
export function collectRustNotices(metadata) {
  if (!Array.isArray(metadata.packages) || !metadata.resolve?.root) {
    throw new Error('Cargo metadata must contain packages and a resolved root crate.');
  }
  const packages = metadata.packages.filter((pkg) => pkg.id !== metadata.resolve.root)
    .sort((a, b) => compare(a.name, b.name) || compare(a.version, b.version));
  if (packages.length === 0) throw new Error('No resolved Rust dependencies were found.');

  const chunks = [Buffer.from([
    'Army Knife — Rust dependency licenses and notices',
    '',
    'Generated from locked Cargo dependency metadata.',
    'All resolved dependency crates, including build-time dependencies, are included.',
    'The application itself is covered by its separately distributed LICENSE.',
    'Upstream license and notice documents below are reproduced verbatim.',
    'Multiple license alternatives are included where supplied by the crate.',
    '',
  ].join('\n'))];
  let documents = 0;

  for (const pkg of packages) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_.+-]*$/.test(pkg.name ?? '') ||
      !/^[A-Za-z0-9][A-Za-z0-9_.+-]*$/.test(pkg.version ?? '')) {
      throw new Error('Cargo metadata contains an invalid package name or version.');
    }
    const declaredLicense = typeof pkg.license === 'string' ? pkg.license.trim() : '';
    if ((!declaredLicense && !pkg.license_file) || /[\r\n]/.test(declaredLicense)) {
      fail(pkg, 'a declared license expression or license_file is required.');
    }
    if (typeof pkg.manifest_path !== 'string') fail(pkg, 'Cargo did not provide a manifest path.');
    const files = licenseFiles(pkg);
    chunks.push(Buffer.from(`\n${'='.repeat(78)}\n${pkg.name} ${pkg.version}\nDeclared license: ${declaredLicense || 'Custom; see the original license file below.'}\n${'='.repeat(78)}\n`));
    for (const file of files) {
      const digest = createHash('sha256').update(file.bytes).digest('hex');
      chunks.push(Buffer.from(`\n--- BEGIN ${file.name} (SHA-256 ${digest}) ---\n`));
      chunks.push(file.bytes);
      if (file.bytes.at(-1) !== 10) chunks.push(Buffer.from('\n'));
      chunks.push(Buffer.from(`--- END ${file.name} ---\n`));
      documents++;
    }
  }
  return { bytes: Buffer.concat(chunks), packages: packages.length, documents };
}

export function buildRustNotices() {
  const cargo = spawnSync('cargo', [
    'metadata', '--manifest-path', manifest, '--locked', '--format-version', '1',
  ], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, shell: false });
  if (cargo.error || cargo.status !== 0) {
    throw new Error('Could not read locked Rust dependency metadata. Install Rust and build the WASM crate first.');
  }
  const result = collectRustNotices(JSON.parse(cargo.stdout));
  mkdirSync(dirname(destination), { recursive: true });
  const temporary = `${destination}.tmp`;
  try {
    writeFileSync(temporary, result.bytes);
    renameSync(temporary, destination);
  } finally {
    rmSync(temporary, { force: true });
  }
  console.log(`Bundled ${result.documents} original Rust license/notice documents from ${result.packages} locked dependencies (${result.bytes.length} bytes).`);
  return result;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { buildRustNotices(); }
  catch (error) {
    console.error(`Rust license collection failed: ${error.message}`);
    process.exitCode = 1;
  }
}
