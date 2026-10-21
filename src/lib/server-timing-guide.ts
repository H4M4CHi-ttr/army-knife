import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { serverTimingMessages } from "../i18n/server-timing.ts";

function guide(locale: Locale): ToolGuide {
  const messages = serverTimingMessages[locale];
  return {
    introduction: messages["tool.server-timing.description"],
    steps: [messages["tool.server-timing.hint"], messages["timing.exportHelp"]],
    exampleInput: 'Server-Timing: cache;desc="hit, edge", db;dur=53.25\nServer-Timing: app;dur=47.2;desc="render"',
    exampleResult: messages["timing.exampleResult"],
    limitations: [messages["timing.scope"], messages["timing.syntax"], messages["timing.limits"], messages["timing.note.duration-format"], messages["timing.privacy"]],
  };
}
export const serverTimingGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"),
  "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
