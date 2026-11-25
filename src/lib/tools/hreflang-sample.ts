import type { HreflangPairInput } from "./hreflang";

const aUrl = "https://example.test/ja/";
const bUrl = "https://en.example.test/guide/?edition=2&view=full";
const links = [
  `<link rel="alternate" hreflang="ja" href="${aUrl}">`,
  `<link rel="alternate" hreflang="en" href="${bUrl.replace("&", "&amp;")}">`,
  `<link rel="alternate" hreflang="x-default" href="${bUrl.replace("&", "&amp;")}">`,
  '<link rel="alternate" hreflang="ko" href="https://example.test/ko/">',
];
export const HREFLANG_SAMPLE: HreflangPairInput = {
  a: { url: aUrl, head: ["<head>", ...links, "</head>"].join("\n") },
  b: { url: bUrl, head: links.join("\n") },
};
