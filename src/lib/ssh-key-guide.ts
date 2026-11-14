import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { sshKeyMessages } from "../i18n/ssh-key.ts";
import { SSH_KEY_SAMPLE } from "./tools/ssh-key-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = sshKeyMessages[locale];
  return {
    introduction: m["tool.ssh-key.description"],
    steps: [m["tool.ssh-key.hint"], m["ssh.referenceHint"], m["ssh.exportHelp"]],
    exampleInput: SSH_KEY_SAMPLE,
    exampleResult: m["ssh.exampleResult"],
    limitations: [m["ssh.scope"], m["ssh.limits"], m["ssh.rsaNote"], m["ssh.privacy"]],
  };
}
export const sshKeyGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
