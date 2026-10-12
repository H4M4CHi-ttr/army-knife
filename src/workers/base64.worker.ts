import { transformBase64, type Base64Alphabet, type Base64Direction } from "../lib/tools/base64";
import { ToolError } from "../lib/tools/errors";

interface Request {
  input: string;
  direction: Base64Direction;
  alphabet: Base64Alphabet;
}

self.onmessage = (event: MessageEvent<Request>) => {
  try {
    const { input, direction, alphabet } = event.data;
    self.postMessage({ ok: true, result: transformBase64(input, direction, alphabet) });
  } catch (error) {
    // Never send the input or exception details back to the UI or a log.
    self.postMessage({
      ok: false,
      code: error instanceof ToolError ? error.code : "INTERNAL_ERROR",
    });
  }
};
