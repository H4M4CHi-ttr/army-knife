import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Window } from 'happy-dom';
import { babelParse } from 'vue/compiler-sfc';

const PROJECT_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
export const BASE_PATH = '/army-knife/';
export const SITE_ORIGIN = 'https://h4m4chi-ttr.github.io';
const LOCALES = ['en', 'ja', 'zh-CN', 'zh-TW', 'ko'];

function decodeCss(value) {
  return value.replace(/\\(?:\r\n|[\r\n\f])|\\([0-9a-f]{1,6})(?:\r\n|[\t\n\f\r ])?|\\([^\r\n\f])/gi, (_, hex, character) => {
    if (hex) {
      const point = Number.parseInt(hex, 16);
      return String.fromCodePoint(point === 0 || point > 0x10ffff || (point >= 0xd800 && point <= 0xdfff) ? 0xfffd : point);
    }
    return character ?? '';
  });
}

/** Read actual CSS resource syntax, ignoring URLs in comments and content strings. */
export function cssReferences(css) {
  const references = [];
  const functions = [];
  let index = 0;
  let importPending = false;
  const trivia = () => {
    while (index < css.length) {
      if (/\s/.test(css[index])) index++;
      else if (css.startsWith('/*', index)) {
        const end = css.indexOf('*/', index + 2);
        if (end < 0) throw new Error('Unclosed CSS comment.');
        index = end + 2;
      } else break;
    }
  };
  const quoted = () => {
    const quote = css[index++];
    let value = '';
    while (index < css.length) {
      const character = css[index++];
      if (character === quote) return decodeCss(value);
      if (character === '\\' && index < css.length) value += character + css[index++];
      else value += character;
    }
    throw new Error('Unclosed CSS string.');
  };
  const identifier = () => {
    let value = '';
    while (index < css.length) {
      if (/[\w-]/.test(css[index])) value += css[index++];
      else if (css[index] === '\\') {
        value += css[index++];
        const hex = /^[0-9a-f]{1,6}(?:\r\n|[\t\n\f\r ])?/i.exec(css.slice(index));
        if (hex) { value += hex[0]; index += hex[0].length; }
        else if (index < css.length) value += css[index++];
      } else break;
    }
    return decodeCss(value).toLowerCase();
  };
  while (index < css.length) {
    trivia();
    if (index >= css.length) break;
    const character = css[index];
    if (character === '"' || character === "'") {
      const value = quoted();
      if (importPending || ['image-set', '-webkit-image-set'].includes(functions.at(-1))) {
        references.push({ url: value, kind: importPending ? 'stylesheet' : 'image' });
      }
      importPending = false;
    } else if (character === '@') {
      index++;
      importPending = identifier() === 'import';
    } else if (/[a-z_\\-]/i.test(character)) {
      const name = identifier();
      trivia();
      if (css[index] !== '(') continue;
      index++;
      if (name !== 'url') { functions.push(name); continue; }
      trivia();
      let value;
      if (css[index] === '"' || css[index] === "'") value = quoted();
      else {
        let raw = '';
        while (index < css.length && css[index] !== ')') {
          const next = css[index++];
          if (next === '\\' && index < css.length) raw += next + css[index++];
          else raw += next;
        }
        value = decodeCss(raw.trim());
      }
      trivia();
      if (css[index] !== ')') throw new Error('Unclosed or malformed CSS url().');
      index++;
      references.push({ url: value, kind: importPending ? 'stylesheet' : 'asset' });
      importPending = false;
    } else {
      if (character === '(') functions.push('');
      if (character === ')') functions.pop();
      if (character === ';' || character === '{' || character === '}') importPending = false;
      index++;
    }
  }
  return references;
}

function srcsetReferences(value) {
  const urls = [];
  let index = 0;
  while (index < value.length) {
    while (/[\s,]/.test(value[index] ?? '') && index < value.length) index++;
    let url = '';
    while (index < value.length && !/\s/.test(value[index])) url += value[index++];
    if (!url) break;
    const hadComma = url.endsWith(',');
    urls.push(url.replace(/,+$/, ''));
    if (hadComma) continue;
    let depth = 0;
    while (index < value.length) {
      const character = value[index++];
      if (character === '(') depth++;
      if (character === ')') depth--;
      if (character === ',' && depth === 0) break;
    }
  }
  return urls;
}

function staticString(node) {
  if (node?.type === 'StringLiteral') return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0]?.value.cooked;
  return undefined;
}

/** References only: arbitrary strings, comments, source maps, and attribution URLs are not traffic. */
function javascriptReferences(code) {
  const ast = babelParse(code, { sourceType: 'unambiguous', createImportExpressions: true, attachComment: false });
  const references = [];
  const stack = [ast];
  const add = (node, kind = 'asset') => {
    const value = staticString(node);
    if (value !== undefined) references.push({ url: value, kind });
  };
  while (stack.length) {
    const node = stack.pop();
    if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) add(node.source, 'module');
    if (node.type === 'ImportExpression') add(node.source, 'module');
    if (node.type === 'CallExpression' && node.callee?.type === 'Import') add(node.arguments[0], 'module');
    if (node.type === 'CallExpression' && node.callee?.type === 'Identifier' && node.callee.name === 'fetch') add(node.arguments[0]);
    if (node.type === 'CallExpression' && node.callee?.type === 'Identifier' && node.callee.name === 'importScripts') node.arguments.forEach((argument) => add(argument, 'module'));
    if (node.type === 'NewExpression' && node.callee?.type === 'Identifier' && ['URL', 'Worker', 'SharedWorker', 'WebSocket', 'EventSource'].includes(node.callee.name)) {
      if (node.callee.name !== 'URL' || (
        node.arguments[1]?.type === 'MemberExpression'
        && node.arguments[1].object?.type === 'MetaProperty'
        && node.arguments[1].object.meta?.name === 'import'
        && node.arguments[1].property?.name === 'url'
      )) add(node.arguments[0], ['Worker', 'SharedWorker'].includes(node.callee.name) ? 'module' : 'asset');
    }
    // Vite also emits URL-valued asset constants (not just new URL expressions).
    if (node.type === 'StringLiteral' && node.value.startsWith(`${BASE_PATH}assets/`) && /\.(?:m?js|css|wasm|woff2|svg|png|jpe?g|webp|avif|gif)(?:[?#]|$)/i.test(node.value)) add(node);
    for (const [key, value] of Object.entries(node)) {
      if (['comments', 'leadingComments', 'trailingComments', 'innerComments', 'loc', 'extra'].includes(key)) continue;
      if (Array.isArray(value)) stack.push(...value.filter((item) => item && typeof item.type === 'string'));
      else if (value && typeof value.type === 'string') stack.push(value);
    }
  }
  return references;
}

export function verifyDist(directory = join(PROJECT_ROOT, 'dist')) {
  const root = resolve(directory);
  const errors = [];
  const counts = { files: 0, references: 0, woff2: 0, wasm: 0, locales: 0, licenses: 0 };
  const fail = (message) => errors.push(message);
  const check = (condition, message) => { if (!condition) fail(message); return Boolean(condition); };
  const attempt = (label, fn) => {
    try { return fn(); } catch (error) { fail(`${label}: ${error.message}`); return undefined; }
  };
  if (!existsSync(join(root, 'index.html'))) {
    fail('dist/index.html is missing. Build the production app before verifying it.');
    return { ok: false, errors, counts };
  }
  const actualRoot = realpathSync(root);
  const files = [];
  const walk = (path) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const next = join(path, entry.name);
      if (entry.isSymbolicLink()) fail(`Symlinks are not static deployment assets: ${relative(root, next)}`);
      else if (entry.isDirectory()) walk(next);
      else if (entry.isFile()) files.push(next);
    }
  };
  attempt('Inventory', () => walk(root));
  counts.files = files.length;
  const webUrl = (file) => `${SITE_ORIGIN}${BASE_PATH}${relative(root, file).split(sep).map(encodeURIComponent).join('/')}`;
  const asset = (raw, owner, context = 'asset') => attempt(`${relative(root, owner)} (${context}: ${raw})`, () => {
    counts.references++;
    if (typeof raw !== 'string' || !raw.trim()) throw new Error('Empty resource URL.');
    const value = raw.trim();
    if (value.startsWith('#')) return undefined;
    if (value.startsWith('data:')) {
      if (['image', 'asset'].includes(context) && /^data:image\/(?:png|gif|jpeg|webp|avif|svg\+xml)[;,]/i.test(value)) return undefined;
      throw new Error('Only embedded image data is permitted; fonts, CSS, and scripts must be static files.');
    }
    const url = new URL(value, webUrl(owner));
    if (url.origin !== SITE_ORIGIN || url.protocol !== 'https:') throw new Error(`Remote resource URL: ${url.href}`);
    const pathname = decodeURIComponent(url.pathname);
    if (!pathname.startsWith(BASE_PATH)) throw new Error(`Resource is outside the ${BASE_PATH} deployment base: ${pathname}`);
    const path = resolve(root, pathname.slice(BASE_PATH.length));
    const local = relative(root, path);
    if (local.startsWith(`..${sep}`) || local === '..' || isAbsolute(local)) throw new Error('Resource escapes the deployment directory.');
    if (!existsSync(path) || !lstatSync(path).isFile()) throw new Error(`Missing static asset: ${local}`);
    const canonical = relative(actualRoot, realpathSync(path));
    if (canonical.startsWith(`..${sep}`) || canonical === '..' || isAbsolute(canonical)) throw new Error('Resource resolves outside the deployment directory.');
    if (context === 'module' && !/\.m?js$/i.test(path)) throw new Error('Production JavaScript must reference a compiled .js or .mjs file.');
    if (context === 'stylesheet' && extname(path).toLowerCase() !== '.css') throw new Error('Stylesheet reference does not point to a CSS file.');
    return path;
  });

  const validateCsp = (document, owner) => {
    const metas = [...document.querySelectorAll('meta')].filter((element) => element.getAttribute('http-equiv')?.toLowerCase() === 'content-security-policy');
    if (!check(metas.length === 1, 'index.html must contain exactly one enforced CSP meta element.')) return;
    const directives = new Map();
    for (const part of (metas[0].getAttribute('content') ?? '').split(';')) {
      const [name, ...values] = part.trim().split(/\s+/);
      if (!name) continue;
      const key = name.toLowerCase();
      check(!directives.has(key), `Duplicate CSP directive: ${key}`);
      directives.set(key, values);
    }
    const required = {
      'default-src': ["'none'"],
      'script-src': ["'self'", "'wasm-unsafe-eval'"],
      'connect-src': ["'self'"],
      'font-src': ["'self'"],
      'worker-src': ["'self'"],
      'form-action': ["'none'"],
      'base-uri': ["'none'"],
      'object-src': ["'none'"],
      'manifest-src': ["'self'"],
    };
    for (const [name, expected] of Object.entries(required)) {
      check(isDeepStrictEqual([...(directives.get(name) ?? [])].sort(), [...expected].sort()), `CSP ${name} must be exactly ${expected.join(' ')}.`);
    }
    for (const [name, values] of directives) {
      if (name.startsWith('script-src')) {
        check(!values.includes("'unsafe-eval'") && !values.includes("'unsafe-inline'"), `CSP ${name} enables general eval or inline execution.`);
        if (name !== 'script-src') check(values.every((value) => ["'self'", "'none'"].includes(value)), `CSP ${name} overrides script restrictions.`);
      }
    }
    const firstResource = document.querySelector('script[src], link[href]');
    if (firstResource) check(Boolean(metas[0].compareDocumentPosition(firstResource) & 4), `${relative(root, owner)}: CSP must appear before subresources.`);
  };

  const inspectMarkup = (file) => {
    const window = new Window({
      url: webUrl(file),
      settings: {
        enableJavaScriptEvaluation: false,
        disableJavaScriptEvaluation: true,
        disableJavaScriptFileLoading: true,
        disableCSSFileLoading: true,
        enableImageFileLoading: false,
        disableIframePageLoading: true,
        disableComputedStyleRendering: true,
        navigation: { disableMainFrameNavigation: true, disableChildFrameNavigation: true, disableChildPageNavigation: true },
      },
    });
    try {
      const document = new window.DOMParser().parseFromString(readFileSync(file, 'utf8'), extname(file) === '.svg' ? 'image/svg+xml' : 'text/html');
      if (file === join(root, 'index.html') || document.getElementById('app')) validateCsp(document, file);
      for (const element of document.querySelectorAll('*')) {
        const tag = element.localName.toLowerCase();
        for (const attribute of element.attributes) {
          check(!/^on/i.test(attribute.name), `${relative(root, file)}: inline event handler ${attribute.name} is not permitted.`);
          check(!/^\s*javascript:/i.test(attribute.value), `${relative(root, file)}: javascript: URLs are not permitted.`);
        }
        check(tag !== 'base', `${relative(root, file)}: a base element could change asset resolution.`);
        check(!['iframe', 'frame', 'object', 'embed'].includes(tag), `${relative(root, file)}: embedded browsing contexts are not part of this static application.`);
        if (tag === 'meta') check(element.getAttribute('http-equiv')?.toLowerCase() !== 'refresh', `${relative(root, file)}: automatic meta refresh is not permitted.`);
        if (tag === 'script') {
          const inert = ['application/json', 'application/ld+json'].includes((element.getAttribute('type') ?? '').toLowerCase().trim());
          const src = element.getAttribute('src');
          if (!inert) check(Boolean(src) && !element.textContent.trim(), `${relative(root, file)}: executable inline script is not permitted.`);
          if (src) asset(src, file, 'module');
        }
        if (tag === 'link' && element.hasAttribute('href')) {
          const rel = (element.getAttribute('rel') ?? '').toLowerCase().split(/\s+/);
          if (!rel.every((value) => ['canonical', 'license', 'alternate'].includes(value))) {
            asset(element.getAttribute('href'), file, rel.includes('stylesheet') ? 'stylesheet' : rel.includes('modulepreload') ? 'module' : rel.includes('icon') ? 'image' : 'asset');
          }
        }
        if (['img', 'source', 'video', 'audio', 'track', 'input'].includes(tag)) {
          if (element.hasAttribute('src')) asset(element.getAttribute('src'), file, ['img', 'input'].includes(tag) ? 'image' : 'asset');
          if (element.hasAttribute('srcset')) srcsetReferences(element.getAttribute('srcset')).forEach((url) => asset(url, file, 'image'));
          if (element.hasAttribute('poster')) asset(element.getAttribute('poster'), file, 'image');
        }
        if (['image', 'use', 'feimage'].includes(tag)) {
          for (const name of ['href', 'xlink:href']) if (element.hasAttribute(name)) asset(element.getAttribute(name), file, 'image');
        }
        if (element.hasAttribute('background')) asset(element.getAttribute('background'), file, 'image');
        for (const css of [element.getAttribute('style'), tag === 'style' ? element.textContent : null].filter(Boolean)) {
          cssReferences(css).forEach((reference) => asset(reference.url, file, reference.kind));
        }
      }
    } finally { window.close(); }
  };

  for (const file of files) {
    const extension = extname(file).toLowerCase();
    attempt(relative(root, file), () => {
      if (['.html', '.svg'].includes(extension)) inspectMarkup(file);
      if (extension === '.css') cssReferences(readFileSync(file, 'utf8')).forEach((reference) => asset(reference.url, file, reference.kind));
      if (['.js', '.mjs'].includes(extension)) javascriptReferences(readFileSync(file, 'utf8')).forEach((reference) => asset(reference.url, file, reference.kind));
      if (extension === '.woff2') {
        counts.woff2++;
        const data = readFileSync(file);
        check(data.length >= 48 && data.toString('ascii', 0, 4) === 'wOF2', `Invalid WOFF2 signature/header: ${relative(root, file)}`);
        if (data.length >= 48) check(data.readUInt32BE(8) === data.length, `WOFF2 length differs from its header: ${relative(root, file)}`);
      }
      if (extension === '.wasm') {
        counts.wasm++;
        const data = readFileSync(file);
        check(data.subarray(0, 8).equals(Buffer.from([0, 97, 115, 109, 1, 0, 0, 0])) && WebAssembly.validate(data), `Invalid or incomplete WebAssembly module: ${relative(root, file)}`);
      }
      check(!['.ttf', '.otf', '.7z', '.tgz'].includes(extension), `Unprocessed font source/archive leaked into dist: ${relative(root, file)}`);
    });
  }
  check(counts.wasm > 0, 'The production build contains no WebAssembly module.');
  check(counts.woff2 > 0, 'The production build contains no WOFF2 fonts.');

  attempt('Font manifest', () => {
    const fontRoot = join(root, 'fonts');
    const manifest = JSON.parse(readFileSync(join(fontRoot, 'manifest.json'), 'utf8'));
    const lock = JSON.parse(readFileSync(join(PROJECT_ROOT, 'scripts/font-sources.lock.json'), 'utf8'));
    check(manifest.schema === 1, 'Unsupported font manifest schema.');
    check(isDeepStrictEqual(manifest.sources, lock), 'Font manifest sources differ from the committed source lock.');
    if (!check(manifest.files && typeof manifest.files === 'object' && !Array.isArray(manifest.files), 'Font manifest must list its files.')) return;
    const listedFiles = Object.keys(manifest.files).sort();
    const actualFiles = files.filter((file) => file.startsWith(`${fontRoot}${sep}`) && file !== join(fontRoot, 'manifest.json')).map((file) => relative(fontRoot, file).split(sep).join('/')).sort();
    check(isDeepStrictEqual(listedFiles, actualFiles), 'Font manifest inventory differs from the deployed files (missing or untracked asset).');
    let totalBytes = 0;
    for (const [name, record] of Object.entries(manifest.files)) {
      if (!check(name && !name.includes('\\') && !name.startsWith('/') && !name.split('/').some((part) => ['', '.', '..'].includes(part)), `Unsafe font manifest path: ${name}`)) continue;
      attempt(`Font asset ${name}`, () => {
        const data = readFileSync(join(fontRoot, name));
        check(record.bytes === data.length, `Font asset size mismatch: ${name}`);
        check(record.sha256 === createHash('sha256').update(data).digest('hex'), `Font asset SHA-256 mismatch: ${name}`);
        totalBytes += data.length;
      });
    }
    check(manifest.totalBytes === totalBytes, 'Font manifest totalBytes does not match its files.');
    const licenseSources = [lock.sarasa, ...Object.values(lock.noto)];
    check(isDeepStrictEqual([...(manifest.licenses ?? [])].sort(), licenseSources.map((source) => `licenses/${source.license}`).sort()), 'Font manifest must include all six upstream licenses.');
    for (const source of licenseSources) {
      attempt(`Font license ${source.license}`, () => {
        const license = readFileSync(join(fontRoot, 'licenses', source.license));
        check(createHash('sha256').update(license).digest('hex') === source.licenseSha256, `Font license differs from the pinned original: ${source.license}`);
        check(/SIL OPEN FONT LICENSE/i.test(license.toString('utf8')), `Missing OFL license text: ${source.license}`);
        counts.licenses++;
      });
    }
    for (const locale of LOCALES) {
      attempt(`Font locale ${locale}`, () => {
        const expected = lock.locales[locale];
        check(isDeepStrictEqual(manifest.locales?.[locale], expected), `Missing or incorrect font locale mapping: ${locale}`);
        const file = join(fontRoot, `${locale}.css`);
        const css = readFileSync(file, 'utf8');
        const paths = cssReferences(css).map((reference) => asset(reference.url, file, reference.kind)).filter(Boolean).map((path) => relative(fontRoot, path).split(sep).join('/'));
        check(paths.some((path) => path.startsWith(`noto/${expected.ui}/files/`) && path.endsWith('.woff2')), `Locale ${locale} does not load its regional Noto Sans.`);
        check(paths.some((path) => path.startsWith(`sarasa/${expected.mono}/`) && path.endsWith('.woff2')), `Locale ${locale} does not load its regional Sarasa-derived font.`);
        check(/unicode-range\s*:/i.test(css), `Locale ${locale} does not declare Unicode font ranges.`);
        counts.locales++;
      });
    }
  });
  return { ok: errors.length === 0, errors, counts };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = verifyDist(process.argv[2] ? resolve(process.argv[2]) : undefined);
  if (!result.ok) {
    console.error(`Production verification failed (${result.errors.length} issues):`);
    result.errors.slice(0, 50).forEach((error) => console.error(`- ${error}`));
    if (result.errors.length > 50) console.error(`- ${result.errors.length - 50} additional issues omitted.`);
    process.exitCode = 1;
  } else {
    console.log(`Verified production output: ${result.counts.files} files, ${result.counts.references} static references, ${result.counts.woff2} WOFF2 files, ${result.counts.wasm} WASM modules, ${result.counts.locales} font locales, ${result.counts.licenses} original licenses.`);
    console.log('Runtime requests and user-data privacy are verified separately by browser E2E tests.');
  }
}
