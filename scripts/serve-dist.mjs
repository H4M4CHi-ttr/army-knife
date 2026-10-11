import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const base = "/army-knife/";
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
};

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : process.argv[index + 1];
}

const host = option("--host", "127.0.0.1");
const port = Number(option("--port", "4173"));
if (!host || !Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("Expected --host <hostname> and --port <1..65535>");

// Serve only files in dist. Unlike a development/SPA preview, missing URLs
// cannot silently receive the app's index.html and a misleading HTTP 200.
const server = createServer(async (request, response) => {
  const send = (status, text) => {
    response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(request.method === "HEAD" ? undefined : text);
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    send(405, "Method not allowed");
    return;
  }
  let url;
  let pathname;
  try {
    url = new URL(request.url ?? "/", `http://${host}:${port}`);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    send(400, "Invalid URL");
    return;
  }
  if (pathname === base.slice(0, -1)) {
    response.writeHead(308, { Location: `${base}${url.search}` });
    response.end();
    return;
  }
  if (!pathname.startsWith(base) || /[\\\0]/.test(pathname)) {
    send(404, "Not found");
    return;
  }
  let filename = resolve(root, pathname.slice(base.length));
  if (filename !== root && !filename.startsWith(`${root}${sep}`)) {
    send(404, "Not found");
    return;
  }
  try {
    const info = await stat(filename);
    if (info.isDirectory()) {
      if (!pathname.endsWith("/")) {
        response.writeHead(308, { Location: `${url.pathname}/${url.search}` });
        response.end();
        return;
      }
      filename = resolve(filename, "index.html");
    } else if (!info.isFile()) {
      send(404, "Not found");
      return;
    }
    const body = await readFile(filename);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filename)] ?? "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR" || error.code === "EISDIR")
      send(404, "Not found");
    else {
      console.error(error);
      send(500, "Internal server error");
    }
  }
});

server.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
server.listen(port, host, () => {
  console.log(`Static dist server: http://${host}:${port}${base}`);
});
