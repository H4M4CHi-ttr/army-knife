/** Synthetic verification text whose final UTF-8 scalar crosses byte 255. */
export const DNS_TXT_SAMPLE_TEXT = "verification=" + "x".repeat(241) + "あ";
export const DNS_TXT_SAMPLE_RDATA = '(\n  "' + "verification=" + "x".repeat(241) + '\\227"\n  "\\129\\130"\n)';
