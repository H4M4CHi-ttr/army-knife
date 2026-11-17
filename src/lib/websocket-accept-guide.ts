import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { websocketAcceptMessages } from "../i18n/websocket-accept.ts";
import { WEBSOCKET_ACCEPT_SAMPLE } from "./tools/websocket-accept-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = websocketAcceptMessages[locale];
  return {
    introduction: m["tool.websocket-accept.description"],
    steps: [m["tool.websocket-accept.hint"], m["wsAccept.exportHelp"]],
    exampleInput: `Sec-WebSocket-Key → ${WEBSOCKET_ACCEPT_SAMPLE.key}\nSec-WebSocket-Accept → ${WEBSOCKET_ACCEPT_SAMPLE.accept}`,
    exampleResult: m["wsAccept.exampleResult"],
    limitations: [m["wsAccept.formula"], m["wsAccept.scope"], m["wsAccept.limits"], m["wsAccept.cancelHelp"], m["wsAccept.privacy"]],
  };
}
export const websocketAcceptGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
