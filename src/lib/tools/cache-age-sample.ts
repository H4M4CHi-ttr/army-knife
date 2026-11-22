import type { CacheAgeInput } from "./cache-age.ts";

export const CACHE_AGE_SAMPLE = {
  headers: "Date: Mon, 23 Nov 2026 00:00:00 GMT\nAge: 15",
  request: "2026-11-23T00:00:11.250Z",
  response: "2026-11-23T00:00:12.500Z",
  evaluation: "2026-11-23T00:00:20.875Z",
} satisfies CacheAgeInput;

export const CACHE_AGE_TIMES = ["request", "response", "evaluation"] as const;
