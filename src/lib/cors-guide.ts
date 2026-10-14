import type { Locale } from "./locales";
import type { ToolGuide } from "./tool-guides";

const exampleInput = "Origin: https://app.example\nMethod: PUT\ncredentials: include\nUnsafe names: authorization, content-type\n\nActual response:\nAccess-Control-Allow-Origin: https://app.example\nAccess-Control-Allow-Credentials: true\nVary: Origin\n\nOPTIONS response (204):\nAccess-Control-Allow-Origin: https://app.example\nAccess-Control-Allow-Credentials: true\nAccess-Control-Allow-Methods: PUT\nAccess-Control-Allow-Headers: Authorization, Content-Type\nVary: Origin";

export const corsGuide = {
  en: {
    introduction: "Investigate a cross-origin Fetch failure using already recorded response headers. Compare the actual response and a separate OPTIONS response with your request's origin, method and credentials mode. Nothing is requested from the supplied origin.",
    steps: [
      "Enter an exact serialized HTTP(S) request origin without a trailing slash, or null. Choose the method and whether the eventual request uses credentials: include.",
      "Enter the CORS-unsafe request-header names from the real request, not their values. For example, application/json Content-Type is unsafe. Empty means no unsafe names; this tool does not infer safelisting from values. Force preflight only when the use-CORS-preflight flag applies.",
      "Paste Name: value lines into the separate actual and OPTIONS response fields. Do not include status lines or bodies. Enter the OPTIONS status separately, then inspect the condition table. Export a report only if needed.",
    ],
    exampleInput,
    exampleResult: "PUT and the two unsafe names require preflight. With both exact origins, both lowercase true credentials values, status 204, PUT and explicit Authorization/Content-Type entries, the supplied conditions may allow access. Changing Allow-Origin to * fails with credentials: include.",
    limitations: [
      "Static conditions only, not a browser or security guarantee. Assumes cross-origin Fetch. Redirects, preflight caches, CSP, DNS/TLS, private-network rules and cookie policies are outside scope. CORS failure does not prevent all request side effects. Expose-Headers and Max-Age are not evaluated.",
      "Each response: 16 KiB UTF-8 / 100 physical lines. Origin: 2 KiB; method: 32 ASCII characters; unsafe names: 2 KiB / 32 entries; response lists: 128 entries. Oversized or malformed input is rejected, never truncated. Long input uses an 800ms delay, manual apply and cancel. All input and results stay in memory.",
      "HTTP(S) origins must already be serialized: use lowercase host, punycode and no default port. Browser-controlled and method-override header names are unsupported. Methods match case-sensitively after Fetch's standard normalization; Allow-Headers ignores case. Authorization always needs an explicit Allow-Headers entry.",
    ],
  },
  ja: {
    introduction: "記録済みの応答ヘッダーから、クロスオリジンFetchの問題を調べます。実応答と別のOPTIONS応答を、Origin・メソッド・credentialsモードと比較します。入力先には通信しません。",
    steps: [
      "末尾/なしの正確なHTTP(S)オリジンかnullを入力し、メソッドと実リクエストのcredentials: includeを指定します。",
      "実リクエストからCORS非セーフリストのヘッダー名を指定します。値は入力しません。例えばapplication/jsonのContent-Typeは対象です。空欄は対象なしを意味し、値からの自動判定はしません。use-CORS-preflightフラグがある場合は強制を選びます。",
      "実応答とOPTIONS応答にName: valueを貼り付けます。ステータス行や本文は含めず、OPTIONSのステータスは別欄に入力します。条件表の理由を確認し、必要な場合だけ出力します。",
    ],
    exampleInput,
    exampleResult: "PUTと2つの対象ヘッダー名によりプリフライトが必要です。両応答の正確なOriginと小文字true、204、PUT、明示的なAuthorization/Content-Typeがそろうとアクセスできる可能性があります。credentials: includeのままAllow-Originを*にすると拒否されます。",
    limitations: [
      "静的条件だけで、実ブラウザーの成功や安全性を保証しません。クロスオリジンFetchを前提とし、リダイレクト・プリフライトキャッシュ・CSP・DNS/TLS・プライベートネットワーク・Cookieポリシーは対象外。CORS拒否は副作用すべてを防ぎません。Expose-Headers・Max-Ageは評価しません。",
      "各応答16 KiB UTF-8・100行。Origin 2 KiB、メソッド32 ASCII文字、対象名2 KiB・32項目、応答リスト128項目まで。上限超過・不正入力は切り捨てずエラーにします。長い入力は800ms遅延・手動適用・中止に対応し、入力と結果はメモリ内のみです。",
      "HTTP(S)オリジンは小文字ホスト・Punycode・既定ポート省略の直列化済み表記が必要です。ブラウザー管理・メソッド上書きのヘッダー名は非対応。メソッドはFetchの正規化後に大小文字を区別し、Allow-Headersは区別しません。Authorizationの明示許可が必要です。",
    ],
  },
  "zh-CN": {
    introduction: "使用已记录的响应头调查跨源Fetch问题。将实际响应与单独的OPTIONS响应同请求Origin、方法及credentials模式比较。不连接输入的源。",
    steps: [
      "输入末尾无/的精确HTTP(S)序列化源或null，并指定方法及实际请求是否使用credentials: include。",
      "根据实际请求填写CORS非安全列表的头名称，不填值。例如application/json的Content-Type属于此类。空白表示没有此类名称，不会根据值自动判断。有use-CORS-preflight标志时选择强制预检。",
      "分别粘贴实际与OPTIONS响应的Name: value行，不含状态行或正文。单独输入OPTIONS状态，查看条件表及原因，按需导出。",
    ],
    exampleInput,
    exampleResult: "PUT与两个指定名称要求预检。两个精确Origin、两个小写true、204、PUT以及显式的Authorization/Content-Type允许条目齐全时，条件可能允许访问。credentials: include时将Allow-Origin改为*会失败。",
    limitations: [
      "仅为静态条件，不保证浏览器成功或安全。假设跨源Fetch，不检查重定向、预检缓存、CSP、DNS/TLS、私有网络与Cookie策略。CORS失败不能阻止所有副作用。不评估Expose-Headers或Max-Age。",
      "每组响应16 KiB UTF-8、100行；Origin 2 KiB；方法32个ASCII字符；指定名称2 KiB、32项；响应列表128项。超限或格式错误会被拒绝，不会截断。长输入使用800ms延迟、手动应用和取消，输入与结果仅在内存中保留。",
      "HTTP(S)源需已序列化，使用小写主机、Punycode并省略默认端口。不支持浏览器控制和方法覆盖头名称。方法经Fetch标准规范化后区分大小写，Allow-Headers不区分。Authorization必须显式允许。",
    ],
  },
  "zh-TW": {
    introduction: "使用已記錄的回應標頭調查跨來源Fetch問題。將實際回應與單獨的OPTIONS回應同請求Origin、方法及credentials模式比較。不連線輸入的來源。",
    steps: [
      "輸入結尾無/的精確HTTP(S)序列化來源或null，並指定方法與實際請求是否使用credentials: include。",
      "依實際請求填寫CORS非安全清單的標頭名稱，不填值。例如application/json的Content-Type屬於此類。空白表示沒有此類名稱，不會依值自動判斷。有use-CORS-preflight旗標時選擇強制預檢。",
      "分別貼上實際與OPTIONS回應的Name: value行，不含狀態行或本文。另填OPTIONS狀態，查看條件表與原因，按需匯出。",
    ],
    exampleInput,
    exampleResult: "PUT與兩個指定名稱要求預檢。兩個精確Origin、兩個小寫true、204、PUT與明確的Authorization/Content-Type允許項目齊全時，條件可能允許存取。credentials: include時將Allow-Origin改為*會失敗。",
    limitations: [
      "僅為靜態條件，不保證瀏覽器成功或安全。假設跨來源Fetch，不檢查重新導向、預檢快取、CSP、DNS/TLS、私有網路與Cookie政策。CORS失敗不能阻止所有副作用。不評估Expose-Headers或Max-Age。",
      "每組回應16 KiB UTF-8、100行；Origin 2 KiB；方法32個ASCII字元；指定名稱2 KiB、32項；回應清單128項。超限或格式錯誤會被拒絕，不會截斷。長輸入使用800ms延遲、手動套用和取消，輸入與結果僅在記憶體中保留。",
      "HTTP(S)來源需已序列化，使用小寫主機、Punycode並省略預設連接埠。不支援瀏覽器控制與方法覆寫標頭名稱。方法經Fetch標準正規化後區分大小寫，Allow-Headers不區分。Authorization必須明確允許。",
    ],
  },
  ko: {
    introduction: "기록된 응답 헤더로 교차 출처 Fetch 문제를 조사합니다. 실제 응답과 별도 OPTIONS 응답을 요청 Origin, 메서드, credentials 모드와 비교합니다. 입력한 출처에 연결하지 않습니다.",
    steps: [
      "끝에 / 없는 정확한 HTTP(S) 직렬화 출처 또는 null을 입력하고 메서드 및 실제 요청의 credentials: include 여부를 선택하세요.",
      "실제 요청에서 CORS 안전 목록에 없는 헤더 이름을 지정하세요. 값은 입력하지 않습니다. application/json의 Content-Type이 예입니다. 빈 목록은 해당 이름이 없다는 뜻이며 값으로 자동 판단하지 않습니다. use-CORS-preflight 플래그가 있으면 강제를 선택하세요.",
      "실제 응답과 OPTIONS 응답에 각각 Name: value 줄을 붙여 넣으세요. 상태 줄과 본문은 제외하고 OPTIONS 상태는 별도로 입력하세요. 조건표와 이유를 확인하고 필요할 때 내보내세요.",
    ],
    exampleInput,
    exampleResult: "PUT과 두 이름에 사전 요청이 필요합니다. 두 정확한 Origin, 두 소문자 true, 204, PUT 및 명시적인 Authorization/Content-Type 허용이 있으면 접근이 가능할 수 있습니다. credentials: include에서 Allow-Origin을 *로 바꾸면 실패합니다.",
    limitations: [
      "정적 조건만 확인하며 브라우저 성공이나 보안을 보장하지 않습니다. 교차 출처 Fetch를 가정하고 리디렉션, 사전 요청 캐시, CSP, DNS/TLS, 사설 네트워크 및 쿠키 정책은 검사하지 않습니다. CORS 실패가 모든 부작용을 막지는 않습니다. Expose-Headers와 Max-Age는 평가하지 않습니다.",
      "응답별 16 KiB UTF-8, 100줄; Origin 2 KiB; 메서드 ASCII 32자; 요청 이름 2 KiB, 32개; 응답 목록 128개입니다. 초과하거나 잘못된 입력은 자르지 않고 거부합니다. 긴 입력에는 800ms 지연, 수동 적용과 취소를 제공합니다. 입력과 결과는 메모리에만 보관합니다.",
      "HTTP(S) 출처는 소문자 호스트, Punycode, 기본 포트 생략을 적용해 직렬화되어야 합니다. 브라우저 제어 및 메서드 재정의 헤더는 지원하지 않습니다. 메서드는 Fetch 표준 정규화 후 대소문자를 구분하며 Allow-Headers는 구분하지 않습니다. Authorization은 명시적으로 허용해야 합니다.",
    ],
  },
} satisfies Record<Locale, ToolGuide>;
