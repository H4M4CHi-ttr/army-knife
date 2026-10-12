import type { ToolId } from "./catalog.ts";
import { tools } from "./catalog.ts";
import type { Locale } from "./locales.ts";
import type { ToolGuide, GuideLabels } from "./guide-schema.ts";
import { coreGuideLabels, coreToolGuides } from "./core-tool-guides.ts";
import { guideLabelsEs, toolGuidesEs } from "./guides/es.ts";
import { guideLabelsFr, toolGuidesFr } from "./guides/fr.ts";
import { guideLabelsDe, toolGuidesDe } from "./guides/de.ts";
import { guideLabelsPtBR, toolGuidesPtBR } from "./guides/pt-BR.ts";
import { guideLabelsId, toolGuidesId } from "./guides/id.ts";
import { guideLabelsVi, toolGuidesVi } from "./guides/vi.ts";

export type { ToolGuide, GuideLabels } from "./guide-schema.ts";
export { languageNames } from "./locales.ts";

export const guideLabels = {
  ...coreGuideLabels,
  es: guideLabelsEs,
  fr: guideLabelsFr,
  de: guideLabelsDe,
  "pt-BR": guideLabelsPtBR,
  id: guideLabelsId,
  vi: guideLabelsVi,
} satisfies Record<Locale, GuideLabels>;

/** Static generation consumes every guide; these explanations are not in the app bundle. */
export const toolGuides = Object.fromEntries(
  tools.map(({ id }): [ToolId, Record<Locale, ToolGuide>] => [
    id,
    {
      ...coreToolGuides[id],
      es: toolGuidesEs[id],
      fr: toolGuidesFr[id],
      de: toolGuidesDe[id],
      "pt-BR": toolGuidesPtBR[id],
      id: toolGuidesId[id],
      vi: toolGuidesVi[id],
    } satisfies Record<Locale, ToolGuide>,
  ]),
) as Record<ToolId, Record<Locale, ToolGuide>>;
