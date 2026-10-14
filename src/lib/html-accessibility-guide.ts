import type { Locale } from "./locales";
import type { ToolGuide } from "./tool-guides";

const sample = `<main>
  <h1>Profile</h1>
  <h3>Contact</h3>
  <img src="/portrait.png">
  <label for="email">Email</label><input id="email">
  <button></button>
</main>`;

export const htmlAccessibilityGuide = {
  en: {
    introduction: "Check an HTML fragment or document for a small set of common accessibility issues. The markup is parsed in a detached template; scripts are not run and the input is not inserted into the page.",
    steps: [
      "Paste an HTML fragment or document, or load the sample. Large inputs wait briefly before automatic analysis; you can apply or cancel the scan.",
      "Review rule counts, each element or ID location, and the recommended markup example. Update the source and scan it again.",
      "Use findings as a review checklist. Verify the finished page with assistive technology and a full accessibility process.",
    ],
    exampleInput: sample,
    exampleResult: "The scan flags the skipped h2 level, the image without an alt attribute, and the unnamed button. The explicitly associated Email label is accepted.",
    limitations: [
      "This is a static heuristic, not a WCAG conformance result. It checks a limited set of HTML patterns and does not calculate browser accessible names, computed visibility, external CSS, pseudo-elements, or generated content.",
      "Input is limited to 64 KiB; at most 10,000 elements are scanned and 500 finding rows returned. Capped results are marked incomplete. Input stays in memory and is not sent, saved, executed, or placed in a URL.",
    ],
  },
  ja: {
    introduction: "HTML断片または文書から、よくあるアクセシビリティ上の問題を限定的に検査します。入力はページに挿入せず、分離したtemplate内で解析します。スクリプトは実行しません。",
    steps: [
      "HTML断片または文書を貼り付けるか、サンプルを読み込みます。長い入力は少し待ってから自動解析され、手動実行やキャンセルもできます。",
      "ルール別の件数、各要素・ID、修正例を確認します。元のHTMLを修正して再度検査します。",
      "検出結果を確認用チェックリストとして使います。完成したページは支援技術と包括的な検査でも確認してください。",
    ],
    exampleInput: sample,
    exampleResult: "h2を飛ばした見出し、alt属性のない画像、名前のないボタンを検出します。Emailの明示的なlabelは検出されません。",
    limitations: [
      "WCAG適合性を判定するものではなく、静的な簡易検査です。限られたHTMLパターンのみを調べ、ブラウザーのアクセシブルネーム、計算後の表示状態、外部CSS、疑似要素、生成コンテンツは判定しません。",
      "入力は64KiBまで、走査は最大1万要素、結果は最大500件です。上限到達時は不完全な結果と表示します。入力はメモリー内だけで処理し、送信・保存・実行・URLへの埋め込みをしません。",
    ],
  },
  "zh-CN": {
    introduction: "检查 HTML 片段或文档中的一小组常见无障碍问题。标记在分离的 template 中解析，不会插入页面，也不会运行脚本。",
    steps: [
      "粘贴 HTML 片段或文档，或加载示例。较长输入会稍候再自动分析，也可以手动执行或取消扫描。",
      "查看规则计数、各元素或 ID 位置以及建议的标记示例。修改源标记后重新扫描。",
      "将发现项用作复核清单。请使用辅助技术和完整的无障碍流程检查最终页面。",
    ],
    exampleInput: sample,
    exampleResult: "扫描会标记跳过 h2 的标题、缺少 alt 属性的图片和没有名称的按钮。显式关联的 Email 标签不会被标记。",
    limitations: [
      "这是静态启发式检查，不是 WCAG 合规性结论。它只检查有限的 HTML 模式，不会计算浏览器可访问名称、计算后的可见性、外部 CSS、伪元素或生成内容。",
      "输入上限为 64 KiB；最多扫描 10,000 个元素并返回 500 条结果。达到上限会标记为不完整。输入仅保留在内存中，不会发送、保存、执行或放入 URL。",
    ],
  },
  "zh-TW": {
    introduction: "檢查 HTML 片段或文件中的一小部分常見無障礙問題。標記會在分離的 template 中解析，不會插入頁面，也不會執行指令碼。",
    steps: [
      "貼上 HTML 片段或文件，或載入範例。較長輸入會稍候再自動分析，也可以手動執行或取消掃描。",
      "查看規則筆數、各元素或 ID 位置以及建議的標記範例。修改來源標記後重新掃描。",
      "將發現項目用作複核清單。請使用輔助技術與完整的無障礙流程檢查最終頁面。",
    ],
    exampleInput: sample,
    exampleResult: "掃描會標記跳過 h2 的標題、缺少 alt 屬性的圖片，以及沒有名稱的按鈕。明確關聯的 Email 標籤不會被標記。",
    limitations: [
      "這是靜態啟發式檢查，不是 WCAG 合規性結論。它只檢查有限的 HTML 模式，不會計算瀏覽器無障礙名稱、計算後的可見性、外部 CSS、偽元素或產生內容。",
      "輸入上限為 64 KiB；最多掃描 10,000 個元素並回傳 500 筆結果。達到上限會標示為不完整。輸入僅保留在記憶體中，不會傳送、儲存、執行或放入 URL。",
    ],
  },
  ko: {
    introduction: "HTML 조각이나 문서에서 일반적인 접근성 문제 몇 가지를 확인합니다. 마크업은 분리된 template에서 분석하며 페이지에 삽입하거나 스크립트를 실행하지 않습니다.",
    steps: [
      "HTML 조각이나 문서를 붙여 넣거나 예제를 불러옵니다. 긴 입력은 잠시 기다린 뒤 자동 분석하며 직접 실행하거나 취소할 수도 있습니다.",
      "규칙별 개수, 각 요소 또는 ID 위치, 권장 마크업 예시를 확인하고 원본을 수정한 뒤 다시 검사합니다.",
      "발견 항목을 검토 체크리스트로 사용하세요. 완성된 페이지는 보조 기술과 전체 접근성 절차로 확인하세요.",
    ],
    exampleInput: sample,
    exampleResult: "h2를 건너뛴 제목, alt 속성이 없는 이미지, 이름 없는 버튼을 표시합니다. 명시적으로 연결된 Email 레이블은 표시하지 않습니다.",
    limitations: [
      "정적 휴리스틱 검사이며 WCAG 적합성 결과가 아닙니다. 제한된 HTML 패턴만 확인하며 브라우저 접근성 이름, 계산된 표시 상태, 외부 CSS, 의사 요소 또는 생성 콘텐츠는 계산하지 않습니다.",
      "입력은 64 KiB로 제한되며 최대 요소 10,000개를 스캔하고 결과 500개를 반환합니다. 상한에 도달하면 불완전한 결과로 표시합니다. 입력은 메모리에만 있으며 전송·저장·실행하거나 URL에 넣지 않습니다.",
    ],
  },
} satisfies Record<Locale, ToolGuide>;
