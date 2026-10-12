import { ToolError } from "./errors";

export type DummyLocale = "la" | "en" | "ja" | "zh-CN" | "zh-TW" | "ko";
export type DummyUnit = "paragraphs" | "sentences" | "characters";
export const DUMMY_LIMITS = { paragraphs: 30, sentences: 120, characters: 10000, outputBytes: 64 * 1024 } as const;

/** All corpora are synthetic generic text; never synthesize addresses or personal details. */
const corpus: Record<DummyLocale, readonly string[]> = {
  la: [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "Praesent vitae justo nec neque facilisis tincidunt.",
    "Curabitur tempus lacus vel tortor luctus varius.",
    "Integer sodales neque id ante suscipit viverra.",
    "Donec dictum risus sit amet purus egestas aliquet.",
    "Aliquam erat volutpat, sed laoreet libero cursus.",
    "Fusce eleifend tellus non augue blandit accumsan.",
  ],
  en: [
    "A small idea can become a useful tool.",
    "The quiet garden welcomes a fresh morning.",
    "Simple patterns help us understand the whole.",
    "A clear outline makes the next step easier.",
    "Light changes gently across the open window.",
    "Every example offers another way to explore.",
    "The page holds space for a new thought.",
  ],
  ja: [
    "小さな発見が次のアイデアにつながります。",
    "静かな朝に新しい風が吹いています。",
    "わかりやすい配置は情報を探す助けになります。",
    "短い文章を並べて表示を確認します。",
    "画面の余白にやさしい光が広がります。",
    "ひとつずつ試しながら形を整えます。",
    "気持ちのよい流れを考えてみましょう。",
  ],
  "zh-CN": [
    "简单的想法也能带来新的发现。",
    "清晨的微风吹过安静的窗边。",
    "清晰的布局让内容更容易理解。",
    "这些文字用于测试页面的显示效果。",
    "柔和的光线照亮宽敞的空间。",
    "每一个例子都提供不同的视角。",
    "我们可以一步一步完善设计。",
  ],
  "zh-TW": [
    "簡單的想法也能帶來新的發現。",
    "清晨的微風吹過安靜的窗邊。",
    "清晰的版面讓內容更容易理解。",
    "這些文字用來測試頁面的顯示效果。",
    "柔和的光線照亮寬敞的空間。",
    "每一個範例都提供不同的視角。",
    "我們可以一步一步完善設計。",
  ],
  ko: [
    "작은 생각이 새로운 발견으로 이어집니다.",
    "조용한 아침에 부드러운 바람이 붑니다.",
    "명확한 구성은 내용을 이해하기 쉽게 만듭니다.",
    "이 문장은 화면의 표시를 확인하기 위한 예시입니다.",
    "따뜻한 빛이 넓은 공간을 비춥니다.",
    "각 예시는 다른 관점을 보여 줍니다.",
    "하나씩 시험하며 디자인을 다듬습니다.",
  ],
};
export interface DummyOptions { locale: DummyLocale; unit: DummyUnit; count: number; seed: number }

/** Reproducible xorshift32; stable across browsers and reloads. */
export function generateDummyText(options: DummyOptions): string {
  const { locale, unit, count, seed } = options;
  if (!Object.hasOwn(corpus, locale) || !Object.hasOwn(DUMMY_LIMITS, unit) ||
      !Number.isInteger(count) || count < 0 || count > DUMMY_LIMITS[unit] ||
      !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new ToolError("DUMMY_INVALID_OPTIONS");
  if (count === 0) return "";
  let state = seed || 0x9e3779b9;
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
  const lines = corpus[locale];
  const sentence = () => lines[next() % lines.length]!;
  const paragraph = () => Array.from({ length: 3 + (next() % 4) }, sentence).join(" ");
  let output = "";
  if (unit === "paragraphs") output = Array.from({ length: count }, paragraph).join("\n\n");
  if (unit === "sentences") output = Array.from({ length: count }, sentence).join(" ");
  if (unit === "characters") {
    const pieces: string[] = [];
    let length = 0;
    while (length < count) {
      const value = sentence() + " ";
      pieces.push(value);
      length += Array.from(value).length;
    }
    output = Array.from(pieces.join("")).slice(0, count).join("");
  }
  if (new TextEncoder().encode(output).byteLength > DUMMY_LIMITS.outputBytes)
    throw new ToolError("INPUT_TOO_LARGE");
  return output;
}
