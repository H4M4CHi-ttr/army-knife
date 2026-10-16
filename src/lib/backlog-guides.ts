import type { Locale } from "./locales";
import type { ToolGuide } from "./tool-guides";
import { backlogCopy } from "../i18n/backlog";
import type { BacklogKind } from "./tools/backlog-core";

const exampleInput: Record<BacklogKind, string> = {
  "ndjson": '{"id":1}\n{"id":2}\n{bad}',
  "json-pointer": '{"a/b":[1,{}],"~":null}',
  "csv-insert": 'id,value\n1,"O\'Reilly"\n2,<NULL>',
  "sqlite-plan": "2|0|0|SCAN orders\n4|2|0|SEARCH orders USING INDEX i_orders",
  "jsonl-logs": '{"timestamp":"2024-02-01T00:00:00Z","level":"info","service":"web","requestId":"abc"}',
  "stack-trace": "TypeError: sample\n at handle (/app/a.js:10:2)\n at run (/app/b.js:20:4)",
  "robots": "User-agent: *\nDisallow: /private/\nAllow: /private/public/",
  "sitemap": '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url></urlset>',
  "iso-duration": "P1M",
  "pg-dsn": "postgresql://user:example@localhost:5432/app?sslmode=require",
};

const instructions: Record<Locale, readonly [string, string]> = {
  en: ["Paste the synthetic example or enter a file; adjust tool-specific options if available.",
    "Inspect counts, row previews, warnings, and explicitly copy or download the generated report. No API requests occur."],
  ja: ["例を読み込むかテキスト・ファイルを入力し、必要なら各ツールのオプションを変更します。",
    "件数・行プレビュー・注意表示を確認して、必要な場合だけ結果をコピー・保存します。API通信は発生しません。"],
  "zh-CN": ["输入示例文本或文件，并根据需要修改工具选项。",
    "检查计数、逐行预览和警告；需要时再复制或下载报告。工具不调用API。"],
  "zh-TW": ["輸入範例文字或檔案，視需要調整各工具選項。",
    "檢查數量、逐列預覽及警告，需要時再複製或儲存報告。不會呼叫API。"],
  ko: ["예시 텍스트나 파일을 입력하고 필요한 경우 도구 옵션을 설정합니다.",
    "집계, 행 미리 보기, 주의 사항을 확인한 뒤 결과를 직접 복사하거나 저장합니다. API를 호출하지 않습니다."],
};

export const backlogGuides: Record<BacklogKind, Record<Locale, ToolGuide>> =
  Object.fromEntries(
    (Object.keys(exampleInput) as BacklogKind[]).map(id => [
      id,
      Object.fromEntries(
        (Object.keys(instructions) as Locale[]).map(locale => {
          const [name, description, hint] = backlogCopy[locale][id];
          return [locale, {
            introduction: description,
            steps: [...instructions[locale]],
            exampleInput: exampleInput[id],
            exampleResult: name + ": " + description,
            limitations: [
              hint,
              locale === "ja"
                ? "入力は最大64 KiB、最大2,000行・結果プレビュー100行、エクスポートは128 KiBまで。入力は保存・外部送信されません。"
                : locale === "ko"
                  ? "입력 최대 64 KiB, 2,000줄, 미리 보기 100줄, 출력 최대 128 KiB. 입력은 저장·전송되지 않습니다."
                  : locale.startsWith("zh")
                    ? "输入最多64 KiB、2,000行、预览100行、导出128 KiB。输入不会存储或发送。"
                    : "Input limit: 64 KiB / 2,000 lines, 100 preview rows, 128 KiB export. Input is never stored or transmitted.",
            ],
          } satisfies ToolGuide];
        }),
      ),
    ]),
  ) as Record<BacklogKind, Record<Locale, ToolGuide>>;