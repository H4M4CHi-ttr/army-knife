import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { HAR_SAMPLE } from "../src/lib/samples.ts";

const moduleUrl = new URL("../src/lib/wasm/pkg/army_knife_core.js", import.meta.url);
const wasmUrl = new URL("../src/lib/wasm/pkg/army_knife_core_bg.wasm", import.meta.url);
const { default: init, run } = await import(moduleUrl.href);
const bytes = await readFile(wasmUrl);
await init({ module_or_path: bytes });

function request(value) {
  return JSON.parse(run(JSON.stringify(value)));
}

const csv = request({
  operation: "csv",
  text: 'id,note\r\n9007199254740993,"A,B"\r\n18446744073709551615,"line1\nline2"',
  delimiter: ",",
  header: true,
  trim: false,
});
assert.equal(csv.ok, true);
assert.equal(csv.result.operation, "csv");
assert.equal(csv.result.rows, 2);
assert.equal(csv.result.profiles[0].types.integer, 2);
assert.deepEqual(csv.result.profiles[0].samples, ["9007199254740993", "18446744073709551615"]);
assert.equal(csv.result.preview[1][1], "line1\nline2");

const logs = request({
  operation: "logs",
  text: "INFO ready\nERROR failed\nerror failed\n",
  pattern: "^error",
  caseInsensitive: true,
});
assert.equal(logs.ok, true);
assert.equal(logs.result.totalLines, 3);
assert.equal(logs.result.matchedLines, 2);
assert.equal(logs.result.levels.error, 2);

const sets = request({
  operation: "sets",
  left: "東京\n a \n9007199254740993\na",
  right: "A\n大阪",
  mode: "union",
  trim: true,
  caseInsensitive: true,
  ignoreEmpty: true,
});
assert.equal(sets.ok, true);
assert.deepEqual(sets.result.items, ["東京", "a", "9007199254740993", "大阪"]);
assert.equal(sets.result.leftDuplicates, 1);

const har = request({ operation: "har", text: HAR_SAMPLE });
assert.equal(har.ok, true);
assert.equal(har.result.operation, "har");
assert.equal(har.result.requests, 4);
assert.equal(har.result.httpErrors, 1);
assert.equal(har.result.unknownStatusRequests, 1);
assert.deepEqual(har.result.responseTransfer, {
  knownBytes: "9432",
  knownEntries: 3,
  unknownEntries: 1,
});
assert.equal(har.result.timing.totalMs, 1066);
assert.equal(har.result.timing.averageMs, 266.5);
assert.equal(har.result.hostCount, 2);
assert.equal(har.result.hosts[0].key, "app.example.test");
assert.equal(har.result.hosts[0].requests, 3);
assert.equal(har.result.slowest[0].entryIndex, 2);
assert.equal(har.result.slowest[0].timeMs, 940);
assert.deepEqual(har.result.statuses, [
  { status: 200, requests: 2 },
  { status: 503, requests: 1 },
  { status: null, requests: 1 },
]);

// Literal JSON numbers must not be rounded by JavaScript before entering WASM.
const exactHar = request({
  operation: "har",
  text: '{"log":{"version":"1.2","entries":[{"request":{"method":"GET","url":"https://example.test/"},"response":{"headersSize":1,"bodySize":9007199254740993.0}}]}}',
});
assert.equal(exactHar.ok, true);
assert.equal(exactHar.result.responseTransfer.knownBytes, "9007199254740994");
assert.equal(exactHar.result.timing.averageMs, null);
const invalidHar = request({
  operation: "har",
  text: '{"log":{"version":"1.2","entries":[{"request":{"method":"GET","url":"https://example.test/"},"response":{"bodySize":{"$serde_json::private::Number":"400"}}}]}}',
});
assert.equal(invalidHar.error.code, "INVALID_HAR");
const hugeTime = request({
  operation: "har",
  text: '{"log":{"version":"1.2","entries":[{"time":1e400,"request":{"method":"GET","url":"https://example.test/"},"response":{}}]}}',
});
assert.equal(hugeTime.error.code, "INVALID_HAR");
const minimalHarEntry = '{"request":{"method":"GET","url":"https://x.test/"},"response":{}}';
const largeHar = request({
  operation: "har",
  text: `{"log":{"version":"1.2","entries":[${Array(100_001).fill(minimalHarEntry).join(",")}]}}`,
});
assert.equal(largeHar.error.code, "TOO_MANY_ROWS");

const invalidRegex = request({
  operation: "logs",
  text: "hello",
  pattern: "(?=hello)",
  caseInsensitive: false,
});
assert.equal(invalidRegex.ok, false);
assert.equal(invalidRegex.error.code, "INVALID_REGEX");
const invalidCsv = request({
  operation: "csv",
  text: 'x\n"unclosed',
  delimiter: ",",
  header: true,
  trim: false,
});
assert.equal(invalidCsv.error.code, "INVALID_CSV");
const tooMany = request({
  operation: "logs",
  text: "x\n".repeat(100_001),
  pattern: "",
  caseInsensitive: false,
});
assert.equal(tooMany.error.code, "TOO_MANY_ROWS");
assert.equal(JSON.parse(run("{")).error.code, "INVALID_REQUEST");

console.log(
  `Actual WebAssembly integration passed: CSV, logs, sets, HAR, exact byte counts, structured errors, and limits (${bytes.byteLength.toLocaleString("en-US")} WASM bytes).`,
);
