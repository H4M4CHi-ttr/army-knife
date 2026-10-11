import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { cssReferences, verifyDist } from './verify-dist.mjs';

const project = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceLock = JSON.parse(readFileSync(join(project, 'scripts/font-sources.lock.json'), 'utf8'));
const csp = "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; font-src 'self'; worker-src 'self'; form-action 'none'; base-uri 'none'; object-src 'none'; manifest-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:";

function write(root, name, value) {
  const path = join(root, name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'army-knife-dist-test-'));
  write(root, 'index.html', `<!doctype html><html><head>
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <link rel="icon" href="/army-knife/favicon.svg">
    <link rel="stylesheet" href="/army-knife/assets/main.css">
    <script type="module" src="/army-knife/assets/main.js"></script>
    </head><body><a href="https://github.com/H4M4CHi-ttr/army-knife">Source</a>
    <script type="application/json">{"docs":"https://example.invalid/documentation"}</script>
    </body></html>`);
  write(root, 'assets/main.js', `import './chunk.js';
    new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    const documentation = 'https://example.invalid/manual';
    // import 'https://example.invalid/comment.js'; fetch('https://example.invalid/comment');
    export { documentation };`);
  write(root, 'assets/chunk.js', 'export const version = 1;');
  write(root, 'assets/worker.js', "export const moduleUrl = new URL('./army_knife_core_bg-test.wasm', import.meta.url);");
  write(root, 'assets/army_knife_core_bg-test.wasm', Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]));
  write(root, 'assets/main.css', `/* url(https://example.invalid/comment.png) */
    @import "./extra.css" layer(optional);
    .icon { background: url('./icon.svg') }
    .label::after { content: 'url(https://example.invalid/not-a-resource.png)' }`);
  write(root, 'assets/extra.css', ':root { color-scheme: light dark }');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path d="M0 0h1v1H0z"/></svg>';
  write(root, 'assets/icon.svg', svg);
  write(root, 'favicon.svg', svg);

  // Static verification checks WOFF2 framing; the real font builder separately
  // decodes every delivered font and verifies glyph and variation coverage.
  const font = Buffer.alloc(48);
  font.write('wOF2');
  font.writeUInt32BE(0x10000, 4);
  font.writeUInt32BE(font.length, 8);
  font.writeUInt16BE(1, 12);
  for (const [locale, mapping] of Object.entries(sourceLock.locales)) {
    write(root, `fonts/noto/${mapping.ui}/files/latin.woff2`, font);
    write(root, `fonts/sarasa/${mapping.mono}/latin.woff2`, font);
    write(root, `fonts/${locale}.css`, `@font-face {
      font-family: '${sourceLock.noto[mapping.ui].family}';
      src: url('./noto/${mapping.ui}/files/latin.woff2') format('woff2'); unicode-range: U+0-FF;
    } @font-face { font-family: 'Army Knife Mono ${mapping.mono}';
      src: url('./sarasa/${mapping.mono}/latin.woff2') format('woff2'); unicode-range: U+0-FF;
    }`);
  }
  const licenses = [sourceLock.sarasa, ...Object.values(sourceLock.noto)].map((source) => {
    const name = `licenses/${source.license}`;
    mkdirSync(join(root, 'fonts/licenses'), { recursive: true });
    copyFileSync(join(project, 'third-party/fonts', source.license), join(root, 'fonts', name));
    return name;
  });
  const files = {};
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else {
        const data = readFileSync(path);
        files[relative(join(root, 'fonts'), path).replaceAll('\\', '/')] = {
          bytes: data.length, sha256: createHash('sha256').update(data).digest('hex'),
        };
      }
    }
  };
  walk(join(root, 'fonts'));
  write(root, 'fonts/manifest.json', JSON.stringify({
    schema: 1, sources: sourceLock, locales: sourceLock.locales, licenses, files,
    totalBytes: Object.values(files).reduce((sum, record) => sum + record.bytes, 0),
  }));
  return root;
}

function withFixture(fn) {
  const root = fixture();
  try { fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
}

test('accepts valid local artifacts and ignores documentation URLs and comments', () => withFixture((root) => {
  const result = verifyDist(root);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.counts.locales, 5);
  assert.equal(result.counts.licenses, 6);
  assert.equal(result.counts.wasm, 1);
}));

test('rejects an entry script that loses the GitHub Pages project base', () => withFixture((root) => {
  const file = join(root, 'index.html');
  writeFileSync(file, readFileSync(file, 'utf8').replace('/army-knife/assets/main.js', '/assets/main.js'));
  assert.match(verifyDist(root).errors.join('\n'), /outside the \/army-knife\/ deployment base/);
}));

test('rejects missing assets reached only through a compiled worker module', () => withFixture((root) => {
  rmSync(join(root, 'assets/army_knife_core_bg-test.wasm'));
  assert.match(verifyDist(root).errors.join('\n'), /Missing static asset: assets[/\\]army_knife_core_bg-test\.wasm/);
}));

test('rejects executable inline scripts and a general unsafe-eval CSP', () => withFixture((root) => {
  const file = join(root, 'index.html');
  writeFileSync(file, readFileSync(file, 'utf8').replace("'wasm-unsafe-eval'", "'unsafe-eval'").replace('</body>', '<script>alert(1)</script></body>'));
  const errors = verifyDist(root).errors.join('\n');
  assert.match(errors, /general eval|CSP script-src/);
  assert.match(errors, /executable inline script/);
}));

test('rejects remote subresources in HTML srcset and escaped CSS URL syntax', () => withFixture((root) => {
  write(root, 'assets/main.css', '.image { background: u\\72l("https://example.invalid/tracker.png") }');
  const file = join(root, 'index.html');
  writeFileSync(file, readFileSync(file, 'utf8').replace('</body>', '<img srcset="/army-knife/favicon.svg 1x, https://example.invalid/remote.png 2x"></body>'));
  const errors = verifyDist(root).errors.join('\n');
  assert.match(errors, /Remote resource URL: https:\/\/example.invalid\/tracker.png/);
  assert.match(errors, /Remote resource URL: https:\/\/example.invalid\/remote.png/);
}));

test('rejects external dynamic imports and literal fetch requests without scanning comments', () => withFixture((root) => {
  write(root, 'assets/chunk.js', "import('https://example.invalid/plugin.js'); fetch('https://example.invalid/upload');");
  const errors = verifyDist(root).errors.join('\n');
  assert.match(errors, /Remote resource URL: https:\/\/example.invalid\/plugin.js/);
  assert.match(errors, /Remote resource URL: https:\/\/example.invalid\/upload/);
  assert.doesNotMatch(errors, /comment\.js/);
}));

test('rejects corrupted WOFF2 and WASM instead of trusting filename extensions', () => withFixture((root) => {
  write(root, 'fonts/sarasa/J/latin.woff2', 'not a font');
  write(root, 'assets/army_knife_core_bg-test.wasm', '<html>404</html>');
  const errors = verifyDist(root).errors.join('\n');
  assert.match(errors, /Invalid WOFF2 signature/);
  assert.match(errors, /Invalid or incomplete WebAssembly/);
}));

test('rejects a missing font locale stylesheet and original license', () => withFixture((root) => {
  rmSync(join(root, 'fonts/ko.css'));
  rmSync(join(root, 'fonts/licenses/Sarasa-Gothic-OFL.txt'));
  const errors = verifyDist(root).errors.join('\n');
  assert.match(errors, /Font locale ko/);
  assert.match(errors, /Font license Sarasa-Gothic-OFL/);
}));

test('rejects tampered font bytes even when WOFF2 framing remains intact', () => withFixture((root) => {
  const file = join(root, 'fonts/sarasa/J/latin.woff2');
  const data = readFileSync(file);
  data[20] = 1;
  writeFileSync(file, data);
  assert.match(verifyDist(root).errors.join('\n'), /Font asset SHA-256 mismatch/);
}));

test('rejects a CSS import whose file is missing and SVG external references', () => withFixture((root) => {
  rmSync(join(root, 'assets/extra.css'));
  write(root, 'assets/icon.svg', '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.invalid/image.png"/></svg>');
  const errors = verifyDist(root).errors.join('\n');
  assert.match(errors, /Missing static asset: assets[/\\]extra.css/);
  assert.match(errors, /Remote resource URL: https:\/\/example.invalid\/image.png/);
}));

test('CSS resource scanner handles image-set and CSS escapes, not content strings', () => {
  assert.deepEqual(cssReferences(`
    /* url(https://example.invalid/comment) */
    .a { content: "url(https://example.invalid/content)";
         background: image-set("./a.png" 1x, url('./b.png') 2x); }
    @import "./theme\\2e css";
  `), [
    { url: './a.png', kind: 'image' },
    { url: './b.png', kind: 'asset' },
    { url: './theme.css', kind: 'stylesheet' },
  ]);
});
