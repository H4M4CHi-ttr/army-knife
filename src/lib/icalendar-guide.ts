import { iCalendarMessages } from "../i18n/icalendar.ts";
import type { Locale } from "./preferences";
import type { ToolGuide } from "./tool-guides";
import { ICALENDAR_SAMPLE } from "./tools/icalendar-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = iCalendarMessages[locale];
  return {
    introduction: m["tool.icalendar.description"],
    steps: [m["tool.icalendar.hint"], m["icalendar.scope"], m["icalendar.export"]],
    exampleInput: ICALENDAR_SAMPLE,
    exampleResult: m["icalendar.example"],
    limitations: [m["icalendar.limits"], m["icalendar.privacy"]],
  };
}

export const iCalendarGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
