/** Synthetic field values, kept dependency-free for the static guide generator. */
export const ETAG_SAMPLE = {
  current: '"revision-2"', exists: true, method: "GET",
  ifMatch: '"revision-2"', ifNoneMatch: 'W/"revision-2", "revision-1"',
} as const;
