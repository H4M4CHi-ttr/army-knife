import { convertEncoding, generateSri, inspectEncoding, inspectMagic, type SriAlgorithm } from "../lib/tools/file-inspectors";
import { ToolError } from "../lib/tools/errors";

interface Request {
  action: "encoding" | "magic" | "sri" | "convert";
  bytes: ArrayBuffer;
  filename?: string;
  algorithm?: SriAlgorithm;
  lineEnding?: "lf" | "crlf";
}

self.onmessage = async (event: MessageEvent<Request>) => {
  try {
    const { action, bytes, filename = "", algorithm = "SHA-256", lineEnding = "lf" } = event.data;
    const view = new Uint8Array(bytes);
    if (action === "encoding") {
      self.postMessage({ ok: true, result: inspectEncoding(view) });
    } else if (action === "magic") {
      self.postMessage({ ok: true, result: inspectMagic(view, filename) });
    } else if (action === "sri") {
      self.postMessage({ ok: true, result: await generateSri(view, algorithm, /\.css$/i.test(filename)) });
    } else if (action === "convert") {
      const converted = convertEncoding(view, lineEnding);
      self.postMessage({ ok: true, result: converted.buffer });
    } else {
      throw new ToolError("INVALID_REQUEST");
    }
  } catch (error) {
    // Never forward file bytes or exception text; failures are translated by stable codes.
    self.postMessage({ ok: false, code: error instanceof ToolError ? error.code : "INTERNAL_ERROR" });
  }
};
