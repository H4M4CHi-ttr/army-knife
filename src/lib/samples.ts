/** Synthetic examples only. Recorded HAR URLs are never requested by the tool. */
const harEntry = (
  url: string,
  status: number,
  time: number,
  headersSize: number,
  bodySize: number,
  mimeType: string,
) => ({
  startedDateTime: "2025-01-15T10:00:00.000Z",
  time,
  request: {
    method: "GET",
    url,
    httpVersion: "HTTP/2",
    cookies: [],
    headers: [],
    queryString: [],
    headersSize: -1,
    bodySize: 0,
  },
  response: {
    status,
    statusText: status === 200 ? "OK" : status === 503 ? "Service Unavailable" : "",
    httpVersion: "HTTP/2",
    cookies: [],
    headers: [],
    content: { size: Math.max(0, bodySize), mimeType },
    redirectURL: "",
    headersSize,
    bodySize,
  },
  cache: {},
  timings: { blocked: 0, dns: -1, connect: -1, ssl: -1, send: 0, wait: time, receive: 0 },
});

export const HAR_SAMPLE = JSON.stringify(
  {
    log: {
      version: "1.2",
      creator: { name: "Army Knife synthetic example", version: "1.0" },
      entries: [
        harEntry("https://app.example.test/", 200, 82.5, 310, 6_400, "text/html; charset=utf-8"),
        harEntry("https://cdn.example.test/styles.css", 200, 31, 180, 2_200, "text/css"),
        harEntry(
          "https://app.example.test/api/report?period=week",
          503,
          940,
          230,
          112,
          "application/json",
        ),
        harEntry("https://app.example.test/api/stream", 0, 12.5, -1, -1, ""),
      ],
    },
  },
  null,
  2,
);
