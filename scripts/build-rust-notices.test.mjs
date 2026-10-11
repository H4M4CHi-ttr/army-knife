import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { collectRustNotices } from './build-rust-notices.mjs';

function fixture(t, documents, options = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'army-knife-notices-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(documents)) {
    mkdirSync(dirname(join(directory, name)), { recursive: true });
    writeFileSync(join(directory, name), content);
  }
  const root = { id: 'path+file:///private/work/army-knife-core', name: 'army-knife-core', version: '0.1.0' };
  const dependency = {
    id: 'registry+https://example.invalid/index#unicode-example@1.0.0',
    name: 'unicode-example', version: '1.0.0',
    license: '(MIT OR Apache-2.0) AND Unicode-3.0',
    manifest_path: join(directory, 'Cargo.toml'),
    ...options,
  };
  const metadata = { resolve: { root: root.id }, packages: [root, dependency] };
  return { directory, dependency, metadata };
}

test('reproduces all alternatives, AND licenses, notices, and exact original bytes without local paths', (t) => {
  const upstream = Buffer.from('Copyright original authors\r\nPermission to copy.\r\n');
  const { directory, metadata } = fixture(t, {
    'LICENSE-MIT': upstream,
    'LICENSE-APACHE': 'Apache text\n',
    'LICENSE-UNICODE': 'Unicode text\n',
    'NOTICE': 'Original attribution\n',
    'UNLICENSE': 'Original Unlicense\n',
    'COPYING': 'Original copying terms\n',
    'vendor/licenses/third-party.txt': 'Vendored license\n',
  });
  const result = collectRustNotices(metadata);
  assert.equal(result.packages, 1);
  assert.equal(result.documents, 7);
  assert.ok(result.bytes.includes(upstream));
  const text = result.bytes.toString('utf8');
  assert.match(text, /\(MIT OR Apache-2\.0\) AND Unicode-3\.0/);
  assert.ok(text.includes(createHash('sha256').update(upstream).digest('hex')));
  assert.ok(text.includes('vendor/licenses/third-party.txt'));
  assert.ok(!text.includes(directory));
  assert.ok(!text.includes('/private/'));
  assert.ok(!text.includes('file:///'));
  assert.ok(!text.includes('example.invalid'));
  assert.ok(!text.includes('army-knife-core'));
  assert.deepEqual(collectRustNotices(metadata).bytes, result.bytes);
});

test('includes a declared custom license file whose name has no license prefix', (t) => {
  const { metadata } = fixture(t, { 'legal/terms.txt': 'Original custom terms' }, {
    license: null, license_file: 'legal/terms.txt',
  });
  const result = collectRustNotices(metadata);
  assert.equal(result.documents, 1);
  assert.match(result.bytes.toString(), /Original custom terms\n--- END legal\/terms\.txt ---/);
});

test('fails when original documents are missing, empty, or invalid UTF-8', (t) => {
  for (const documents of [{}, { LICENSE: ' \n' }, { LICENSE: Buffer.from([0xff]) }]) {
    const { metadata } = fixture(t, documents);
    assert.throws(() => collectRustNotices(metadata), /no original|is empty|not valid UTF-8/);
  }
});

test('fails for an undeclared license, including an orphan NOTICE', (t) => {
  const { metadata } = fixture(t, { NOTICE: 'Attribution without license permission' }, { license: null });
  assert.throws(() => collectRustNotices(metadata), /declared license expression or license_file/);
  const declared = fixture(t, { NOTICE: 'Attribution without license permission' });
  assert.throws(() => collectRustNotices(declared.metadata), /only notices were found/);
});

test('fails if a declared license_file is absent or escapes the crate directory', (t) => {
  for (const license_file of ['missing.txt', '../outside-license.txt']) {
    const { metadata } = fixture(t, { LICENSE: 'Ordinary license' }, { license_file });
    assert.throws(() => collectRustNotices(metadata), /license_file is missing|stay inside/);
  }
});

test('does not follow license symlinks or symlinked license_file parent directories', (t) => {
  const direct = fixture(t, { 'original.txt': 'License content' });
  symlinkSync('original.txt', join(direct.directory, 'LICENSE'));
  assert.throws(() => collectRustNotices(direct.metadata), /symbolic link/);
  const parent = fixture(t, { 'actual/terms.txt': 'License content' }, { license_file: 'alias/terms.txt' });
  symlinkSync('actual', join(parent.directory, 'alias'));
  assert.throws(() => collectRustNotices(parent.metadata), /symbolic link/);
});

test('rejects malformed metadata and does not emit source code instead of licenses', (t) => {
  assert.throws(() => collectRustNotices({ packages: [] }), /resolved root crate/);
  const { metadata } = fixture(t, { 'src/lib.rs': 'pub fn main() {}' });
  assert.throws(() => collectRustNotices(metadata), /no original/);
});
