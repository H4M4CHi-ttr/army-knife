const en = {
  "tool.chmod.name": "chmod & umask Calculator",
  "tool.chmod.description":
    "Build Unix permission bits, preview symbolic chmod changes, and calculate umask defaults.",
  "tool.chmod.hint":
    "Enter 3 or 4 octal digits (0–7). Four digits include setuid, setgid, and sticky bits; 0000 is valid.",
  "chmod.mode": "Permission mode",
  "chmod.octalInput": "Octal mode",
  "chmod.examples": "Examples",
  "chmod.permissions": "Permission bits",
  "chmod.matrixHint":
    "Enter a valid octal mode to enable the checkboxes. Each change updates the mode immediately.",
  "chmod.who": "Who",
  "chmod.owner": "Owner",
  "chmod.group": "Group",
  "chmod.others": "Others",
  "chmod.read": "Read",
  "chmod.write": "Write",
  "chmod.execute": "Execute / search",
  "chmod.bitLabel": "{who}: {permission}",
  "chmod.setuid": "setuid (4000)",
  "chmod.setgid": "setgid (2000)",
  "chmod.sticky": "sticky (1000)",
  "chmod.selectedMode": "Selected mode",
  "chmod.octal": "Octal",
  "chmod.symbolic": "Symbolic bits",
  "chmod.command": "GNU/Linux command example",
  "chmod.copyCommand": "Copy command",
  "chmod.commandHint":
    "Example only; nothing is executed. Replace ./path yourself. The fifth leading zero makes GNU chmod clear unselected directory set-ID bits too.",
  "chmod.preview": "Symbolic change preview",
  "chmod.expression": "Symbolic expression",
  "chmod.expressionHint":
    "Supported subset: explicit u/g/o/a, one +, -, or = operator per comma-separated clause, and rwxst. Up to 256 bytes / 32 clauses. X, copied permissions, omitted who, and multiple operators are unsupported.",
  "chmod.directory": "Treat the preview target as a directory",
  "chmod.directoryHint":
    "GNU directory behavior: = preserves setuid/setgid unless that bit is explicitly mentioned. Use u-s or g-s to clear it. The numeric command above explicitly sets every bit.",
  "chmod.previewOctal": "Preview octal mode",
  "chmod.usePreview": "Use preview",
  "chmod.previewHint":
    "The preview does not change the selected mode automatically. Using it updates the octal input and clears the expression.",
  "chmod.previewEmpty":
    "Enter a valid octal mode and a supported symbolic expression to preview the change.",
  "chmod.umask": "New-file umask defaults",
  "chmod.umaskInput": "Octal umask",
  "chmod.umaskHint":
    "Typical requests: file 0666 & ~umask; directory 0777 & ~umask. This removes requested bits; it does not grant permissions. Actual applications may request another mode. Default ACLs and parent-directory setgid inheritance are not simulated.",
  "chmod.newFile": "New regular file (request 0666)",
  "chmod.newDirectory": "New directory (request 0777)",
  "chmod.notes": "What these bits mean and their limits",
  "chmod.executeHint":
    "For files, x is execution permission. For directories, x is search / traversal permission; r lists names and w changes entries, usually requiring x too.",
  "chmod.setuidHint":
    "setuid on an executable file requests execution with the file owner's effective user ID, subject to platform and mount rules.",
  "chmod.setgidHint":
    "setgid on an executable file requests the file group's effective group ID. On a directory it usually makes new entries inherit that directory's group.",
  "chmod.stickyHint":
    "On a writable directory, sticky restricts deletion and renaming to the entry owner, directory owner, or privileged users; it does not stop file content edits.",
  "chmod.accessHint":
    "Bits alone cannot determine actual access. Ownership, supplementary groups, ancestor directories, ACLs, mount options, platform rules, and privileges also matter. The symbolic display has no file-type prefix or ACL indicator.",
  "chmod.privacy":
    "Calculated locally and immediately. Inputs and results are not sent, saved, or placed in the URL.",
  "errors.CHMOD_INVALID_MODE":
    "Enter exactly 3 or 4 octal digits from 0 to 7, with no prefix. Surrounding whitespace is allowed within 16 input characters.",
  "errors.CHMOD_INVALID_SYMBOLIC":
    "Use explicit u/g/o/a followed by one +, -, or = and only rwxst; separate clauses with commas. This symbolic subset does not support X, copied permissions, omitted who, or multiple operators.",
  "errors.CHMOD_INVALID_UMASK":
    "Enter a 3-digit octal umask (000–777), optionally with one leading zero. Special bits are unsupported; surrounding whitespace is allowed within 16 input characters.",
  "errors.CHMOD_SYMBOLIC_LIMIT": "Keep the symbolic expression within 256 bytes and 32 clauses.",
};

type ChmodMessages = Record<keyof typeof en, string>;

const ja: ChmodMessages = {
  "tool.chmod.name": "chmod・umask 計算",
  "tool.chmod.description":
    "Unix の権限ビットを組み立て、記号式 chmod の変更と umask の初期権限を確認。",
  "tool.chmod.hint":
    "0〜7 の八進数字を3桁または4桁で入力します。4桁目は setuid・setgid・sticky を表します。0000 も有効です。",
  "chmod.mode": "権限モード",
  "chmod.octalInput": "八進モード",
  "chmod.examples": "入力例",
  "chmod.permissions": "権限ビット",
  "chmod.matrixHint":
    "有効な八進モードを入力するとチェックボックスを操作できます。変更はすぐモードに反映されます。",
  "chmod.who": "対象",
  "chmod.owner": "所有者",
  "chmod.group": "グループ",
  "chmod.others": "その他",
  "chmod.read": "読み取り",
  "chmod.write": "書き込み",
  "chmod.execute": "実行・検索",
  "chmod.bitLabel": "{who}：{permission}",
  "chmod.setuid": "setuid（4000）",
  "chmod.setgid": "setgid（2000）",
  "chmod.sticky": "sticky（1000）",
  "chmod.selectedMode": "選択中のモード",
  "chmod.octal": "八進表記",
  "chmod.symbolic": "記号表記",
  "chmod.command": "GNU/Linux コマンド例",
  "chmod.copyCommand": "コマンドをコピー",
  "chmod.commandHint":
    "表示用の例で、実行はしません。./path は自分で置き換えてください。先頭に5桁目の 0 を付けることで、GNU chmod は選択していないディレクトリの set-ID ビットも解除します。",
  "chmod.preview": "記号式による変更プレビュー",
  "chmod.expression": "記号式",
  "chmod.expressionHint":
    "対応範囲：対象 u/g/o/a を明示し、コンマで区切る各節に +・-・= の演算子を1つ、権限 rwxst を指定。最大256バイト・32節です。X、権限のコピー、対象の省略、複数演算子には対応しません。",
  "chmod.directory": "プレビューの対象をディレクトリとして扱う",
  "chmod.directoryHint":
    "GNU のディレクトリ処理では、= は明示しない setuid・setgid を保持します。解除には u-s または g-s を使います。上の数値コマンドはすべてのビットを明示的に設定します。",
  "chmod.previewOctal": "プレビューの八進モード",
  "chmod.usePreview": "プレビューを使う",
  "chmod.previewHint":
    "プレビューだけでは選択中のモードは変わりません。使用すると八進入力を更新し、記号式をクリアします。",
  "chmod.previewEmpty": "有効な八進モードと対応する記号式を入力すると変更をプレビューできます。",
  "chmod.umask": "umask による新規作成時の権限",
  "chmod.umaskInput": "八進 umask",
  "chmod.umaskHint":
    "一般的な要求値はファイル 0666 & ~umask、ディレクトリ 0777 & ~umask です。要求されたビットを除き、権限を追加することはありません。アプリが別のモードを要求する場合もあります。デフォルト ACL と親ディレクトリの setgid 継承は再現しません。",
  "chmod.newFile": "新規の通常ファイル（要求 0666）",
  "chmod.newDirectory": "新規ディレクトリ（要求 0777）",
  "chmod.notes": "各ビットの意味と制約",
  "chmod.executeHint":
    "ファイルの x は実行権限です。ディレクトリの x は検索・通過権限、r は名前の一覧取得、w はエントリの変更を表し、通常は x も必要です。",
  "chmod.setuidHint":
    "実行ファイルの setuid は、所有者の実効ユーザー ID での実行を要求します。実際の動作はプラットフォームやマウント規則に依存します。",
  "chmod.setgidHint":
    "実行ファイルの setgid は、そのファイルのグループの実効グループ ID での実行を要求します。ディレクトリでは通常、新しいエントリがそのディレクトリのグループを継承します。",
  "chmod.stickyHint":
    "書き込み可能なディレクトリの sticky は、削除・名前変更をエントリ所有者、ディレクトリ所有者、特権ユーザーに制限します。ファイル内容の編集は防ぎません。",
  "chmod.accessHint":
    "ビットだけでは実際のアクセス可否を判定できません。所有者、補助グループ、上位ディレクトリ、ACL、マウント設定、プラットフォームの規則、特権も影響します。記号表記にファイル種別の先頭文字や ACL 印は含めません。",
  "chmod.privacy": "端末内ですぐに計算します。入力と結果は送信・保存せず、URL にも含めません。",
  "errors.CHMOD_INVALID_MODE":
    "0〜7 の八進数字をちょうど3桁または4桁で入力してください。接頭辞は使えません。入力全体が16文字以内なら前後の空白は許容します。",
  "errors.CHMOD_INVALID_SYMBOLIC":
    "u/g/o/a を明示し、+・-・= の演算子を1つと rwxst のみを指定し、節をコンマで区切ってください。X、権限コピー、対象省略、複数演算子はこの記号式の対応範囲外です。",
  "errors.CHMOD_INVALID_UMASK":
    "3桁の八進 umask（000〜777）を入力してください。先頭に 0 を1つ追加できます。特殊ビットは使えません。入力全体が16文字以内なら前後の空白は許容します。",
  "errors.CHMOD_SYMBOLIC_LIMIT": "記号式を256バイト・32節以内にしてください。",
};

const zhCN: ChmodMessages = {
  "tool.chmod.name": "chmod 与 umask 计算器",
  "tool.chmod.description": "设置 Unix 权限位，预览符号 chmod 修改，并计算 umask 默认权限。",
  "tool.chmod.hint":
    "输入3位或4位八进制数字（0–7）。4位模式包含 setuid、setgid 和 sticky 位；0000 也有效。",
  "chmod.mode": "权限模式",
  "chmod.octalInput": "八进制模式",
  "chmod.examples": "示例",
  "chmod.permissions": "权限位",
  "chmod.matrixHint": "输入有效的八进制模式后即可操作复选框。每次修改都会立即更新模式。",
  "chmod.who": "对象",
  "chmod.owner": "所有者",
  "chmod.group": "组",
  "chmod.others": "其他用户",
  "chmod.read": "读取",
  "chmod.write": "写入",
  "chmod.execute": "执行 / 搜索",
  "chmod.bitLabel": "{who}：{permission}",
  "chmod.setuid": "setuid（4000）",
  "chmod.setgid": "setgid（2000）",
  "chmod.sticky": "sticky（1000）",
  "chmod.selectedMode": "当前模式",
  "chmod.octal": "八进制",
  "chmod.symbolic": "符号权限位",
  "chmod.command": "GNU/Linux 命令示例",
  "chmod.copyCommand": "复制命令",
  "chmod.commandHint":
    "仅为示例，不会执行。请自行替换 ./path。第五位前导零使 GNU chmod 同时清除目录中未选择的 set-ID 位。",
  "chmod.preview": "符号修改预览",
  "chmod.expression": "符号表达式",
  "chmod.expressionHint":
    "支持的子集：明确指定 u/g/o/a，每个以逗号分隔的子句包含一个 +、- 或 = 运算符，以及 rwxst。最多256字节、32个子句。不支持 X、权限复制、省略对象或多个运算符。",
  "chmod.directory": "将预览目标视为目录",
  "chmod.directoryHint":
    "GNU 目录行为：= 会保留未明确指定的 setuid/setgid 位。使用 u-s 或 g-s 清除它们。上方的数字命令会明确设置所有位。",
  "chmod.previewOctal": "预览八进制模式",
  "chmod.usePreview": "使用预览",
  "chmod.previewHint": "预览不会自动修改当前模式。使用预览会更新八进制输入并清空表达式。",
  "chmod.previewEmpty": "输入有效的八进制模式和受支持的符号表达式以预览修改。",
  "chmod.umask": "新建文件的 umask 默认权限",
  "chmod.umaskInput": "八进制 umask",
  "chmod.umaskHint":
    "典型请求：文件 0666 & ~umask；目录 0777 & ~umask。这会移除请求的权限位，不会授予权限。实际应用可能请求其他模式。不模拟默认 ACL 或父目录的 setgid 继承。",
  "chmod.newFile": "新建普通文件（请求 0666）",
  "chmod.newDirectory": "新建目录（请求 0777）",
  "chmod.notes": "权限位的含义与限制",
  "chmod.executeHint":
    "对于文件，x 表示执行权限。对于目录，x 表示搜索 / 遍历权限，r 表示列出名称，w 表示修改目录项，通常也需要 x。",
  "chmod.setuidHint":
    "可执行文件的 setuid 请求以文件所有者的有效用户 ID 执行，受平台与挂载规则限制。",
  "chmod.setgidHint":
    "可执行文件的 setgid 请求使用文件所属组的有效组 ID。对于目录，通常使新目录项继承该目录的组。",
  "chmod.stickyHint":
    "可写目录中的 sticky 将删除与重命名限制为目录项所有者、目录所有者或特权用户；它不阻止修改文件内容。",
  "chmod.accessHint":
    "仅凭权限位无法判断实际访问权限。所有权、附加组、上级目录、ACL、挂载选项、平台规则和特权也会影响结果。符号显示不含文件类型前缀或 ACL 标记。",
  "chmod.privacy": "在本地即时计算。输入与结果不会发送、保存或写入 URL。",
  "errors.CHMOD_INVALID_MODE":
    "请输入恰好3位或4位的八进制数字（0–7），不含前缀。总输入不超过16个字符时允许前后空白。",
  "errors.CHMOD_INVALID_SYMBOLIC":
    "明确指定 u/g/o/a，后接一个 +、- 或 = 运算符和 rwxst，用逗号分隔子句。此符号子集不支持 X、权限复制、省略对象或多个运算符。",
  "errors.CHMOD_INVALID_UMASK":
    "请输入3位八进制 umask（000–777），可额外添加一个前导零。不支持特殊位；总输入不超过16个字符时允许前后空白。",
  "errors.CHMOD_SYMBOLIC_LIMIT": "符号表达式不得超过256字节或32个子句。",
};

const zhTW: ChmodMessages = {
  "tool.chmod.name": "chmod 與 umask 計算器",
  "tool.chmod.description": "設定 Unix 權限位元，預覽符號 chmod 修改，並計算 umask 預設權限。",
  "tool.chmod.hint":
    "輸入3位或4位八進位數字（0–7）。4位模式包含 setuid、setgid 與 sticky 位元；0000 也有效。",
  "chmod.mode": "權限模式",
  "chmod.octalInput": "八進位模式",
  "chmod.examples": "範例",
  "chmod.permissions": "權限位元",
  "chmod.matrixHint": "輸入有效的八進位模式後即可操作核取方塊。每次修改都會立即更新模式。",
  "chmod.who": "對象",
  "chmod.owner": "擁有者",
  "chmod.group": "群組",
  "chmod.others": "其他使用者",
  "chmod.read": "讀取",
  "chmod.write": "寫入",
  "chmod.execute": "執行 / 搜尋",
  "chmod.bitLabel": "{who}：{permission}",
  "chmod.setuid": "setuid（4000）",
  "chmod.setgid": "setgid（2000）",
  "chmod.sticky": "sticky（1000）",
  "chmod.selectedMode": "目前模式",
  "chmod.octal": "八進位",
  "chmod.symbolic": "符號權限位元",
  "chmod.command": "GNU/Linux 指令範例",
  "chmod.copyCommand": "複製指令",
  "chmod.commandHint":
    "僅為範例，不會執行。請自行替換 ./path。第五位前導零讓 GNU chmod 同時清除目錄中未選取的 set-ID 位元。",
  "chmod.preview": "符號修改預覽",
  "chmod.expression": "符號運算式",
  "chmod.expressionHint":
    "支援的子集：明確指定 u/g/o/a，每個以逗號分隔的子句包含一個 +、- 或 = 運算子，以及 rwxst。最多256位元組、32個子句。不支援 X、權限複製、省略對象或多個運算子。",
  "chmod.directory": "將預覽目標視為目錄",
  "chmod.directoryHint":
    "GNU 目錄行為：= 會保留未明確指定的 setuid/setgid 位元。使用 u-s 或 g-s 清除它們。上方的數字指令會明確設定所有位元。",
  "chmod.previewOctal": "預覽八進位模式",
  "chmod.usePreview": "使用預覽",
  "chmod.previewHint": "預覽不會自動修改目前模式。使用預覽會更新八進位輸入並清空運算式。",
  "chmod.previewEmpty": "輸入有效的八進位模式與支援的符號運算式以預覽修改。",
  "chmod.umask": "新建檔案的 umask 預設權限",
  "chmod.umaskInput": "八進位 umask",
  "chmod.umaskHint":
    "典型要求：檔案 0666 & ~umask；目錄 0777 & ~umask。這會移除要求的權限位元，不會授予權限。實際應用程式可能要求其他模式。不模擬預設 ACL 或父目錄的 setgid 繼承。",
  "chmod.newFile": "新建一般檔案（要求 0666）",
  "chmod.newDirectory": "新建目錄（要求 0777）",
  "chmod.notes": "權限位元的含義與限制",
  "chmod.executeHint":
    "對檔案而言，x 表示執行權限。對目錄而言，x 表示搜尋 / 通過權限，r 表示列出名稱，w 表示修改目錄項目，通常也需要 x。",
  "chmod.setuidHint":
    "可執行檔案的 setuid 要求以檔案擁有者的有效使用者 ID 執行，受平台與掛載規則限制。",
  "chmod.setgidHint":
    "可執行檔案的 setgid 要求使用檔案群組的有效群組 ID。對目錄而言，通常會讓新項目繼承該目錄的群組。",
  "chmod.stickyHint":
    "可寫目錄中的 sticky 將刪除與重新命名限制為項目擁有者、目錄擁有者或特權使用者；它不會阻止修改檔案內容。",
  "chmod.accessHint":
    "僅憑權限位元無法判斷實際存取權限。擁有權、附加群組、上層目錄、ACL、掛載選項、平台規則與特權也會影響結果。符號顯示不含檔案類型前綴或 ACL 標記。",
  "chmod.privacy": "在本機即時計算。輸入與結果不會傳送、儲存或寫入 URL。",
  "errors.CHMOD_INVALID_MODE":
    "請輸入剛好3位或4位的八進位數字（0–7），不含前綴。總輸入不超過16個字元時允許前後空白。",
  "errors.CHMOD_INVALID_SYMBOLIC":
    "明確指定 u/g/o/a，後接一個 +、- 或 = 運算子與 rwxst，以逗號分隔子句。此符號子集不支援 X、權限複製、省略對象或多個運算子。",
  "errors.CHMOD_INVALID_UMASK":
    "請輸入3位八進位 umask（000–777），可額外加入一個前導零。不支援特殊位元；總輸入不超過16個字元時允許前後空白。",
  "errors.CHMOD_SYMBOLIC_LIMIT": "符號運算式不得超過256位元組或32個子句。",
};

const ko: ChmodMessages = {
  "tool.chmod.name": "chmod 및 umask 계산기",
  "tool.chmod.description":
    "Unix 권한 비트를 설정하고, 기호 chmod 변경과 umask 기본 권한을 미리 확인합니다.",
  "tool.chmod.hint":
    "3자리 또는 4자리 8진수(0–7)를 입력하세요. 4자리 모드는 setuid, setgid, sticky 비트를 포함합니다. 0000도 유효합니다.",
  "chmod.mode": "권한 모드",
  "chmod.octalInput": "8진수 모드",
  "chmod.examples": "예시",
  "chmod.permissions": "권한 비트",
  "chmod.matrixHint":
    "유효한 8진수 모드를 입력하면 체크박스를 사용할 수 있습니다. 변경할 때마다 모드가 즉시 갱신됩니다.",
  "chmod.who": "대상",
  "chmod.owner": "소유자",
  "chmod.group": "그룹",
  "chmod.others": "기타 사용자",
  "chmod.read": "읽기",
  "chmod.write": "쓰기",
  "chmod.execute": "실행 / 탐색",
  "chmod.bitLabel": "{who}: {permission}",
  "chmod.setuid": "setuid (4000)",
  "chmod.setgid": "setgid (2000)",
  "chmod.sticky": "sticky (1000)",
  "chmod.selectedMode": "선택한 모드",
  "chmod.octal": "8진수",
  "chmod.symbolic": "기호 권한 비트",
  "chmod.command": "GNU/Linux 명령 예시",
  "chmod.copyCommand": "명령 복사",
  "chmod.commandHint":
    "표시용 예시이며 실행하지 않습니다. ./path는 직접 바꾸세요. 다섯 번째 앞자리 0은 GNU chmod가 선택하지 않은 디렉터리 set-ID 비트도 지우게 합니다.",
  "chmod.preview": "기호 변경 미리보기",
  "chmod.expression": "기호 표현식",
  "chmod.expressionHint":
    "지원 범위: 명시적인 u/g/o/a, 쉼표로 구분한 각 절에 하나의 +, - 또는 = 연산자, rwxst 권한. 최대 256바이트 / 32개 절입니다. X, 권한 복사, 대상 생략, 여러 연산자는 지원하지 않습니다.",
  "chmod.directory": "미리보기 대상을 디렉터리로 취급",
  "chmod.directoryHint":
    "GNU 디렉터리 동작: =는 명시하지 않은 setuid/setgid 비트를 유지합니다. u-s 또는 g-s로 지우세요. 위의 숫자 명령은 모든 비트를 명시적으로 설정합니다.",
  "chmod.previewOctal": "미리보기 8진수 모드",
  "chmod.usePreview": "미리보기 적용",
  "chmod.previewHint":
    "미리보기는 선택한 모드를 자동으로 바꾸지 않습니다. 적용하면 8진수 입력을 갱신하고 표현식을 비웁니다.",
  "chmod.previewEmpty":
    "유효한 8진수 모드와 지원되는 기호 표현식을 입력하면 변경을 미리 볼 수 있습니다.",
  "chmod.umask": "새 파일의 umask 기본 권한",
  "chmod.umaskInput": "8진수 umask",
  "chmod.umaskHint":
    "일반적인 요청: 파일 0666 & ~umask, 디렉터리 0777 & ~umask. 요청한 비트를 제거하며 권한을 추가하지 않습니다. 실제 앱은 다른 모드를 요청할 수 있습니다. 기본 ACL과 상위 디렉터리의 setgid 상속은 시뮬레이션하지 않습니다.",
  "chmod.newFile": "새 일반 파일 (요청 0666)",
  "chmod.newDirectory": "새 디렉터리 (요청 0777)",
  "chmod.notes": "권한 비트의 의미와 한계",
  "chmod.executeHint":
    "파일의 x는 실행 권한입니다. 디렉터리의 x는 검색 / 통과 권한이며, r은 이름 나열, w는 항목 변경을 뜻합니다. 일반적으로 x도 필요합니다.",
  "chmod.setuidHint":
    "실행 파일의 setuid는 파일 소유자의 유효 사용자 ID로 실행하도록 요청하며 플랫폼과 마운트 규칙의 영향을 받습니다.",
  "chmod.setgidHint":
    "실행 파일의 setgid는 파일 그룹의 유효 그룹 ID를 요청합니다. 디렉터리에서는 일반적으로 새 항목이 해당 디렉터리의 그룹을 상속하게 합니다.",
  "chmod.stickyHint":
    "쓰기 가능한 디렉터리의 sticky는 삭제와 이름 변경을 항목 소유자, 디렉터리 소유자 또는 특권 사용자로 제한합니다. 파일 내용 편집은 막지 않습니다.",
  "chmod.accessHint":
    "비트만으로 실제 접근 가능 여부를 판단할 수 없습니다. 소유권, 보조 그룹, 상위 디렉터리, ACL, 마운트 옵션, 플랫폼 규칙, 특권도 영향을 줍니다. 기호 표시에는 파일 유형 접두사나 ACL 표시가 없습니다.",
  "chmod.privacy":
    "기기 안에서 즉시 계산합니다. 입력과 결과를 전송하거나 저장하거나 URL에 넣지 않습니다.",
  "errors.CHMOD_INVALID_MODE":
    "0–7의 8진수를 정확히 3자리 또는 4자리로 입력하세요. 접두사는 사용할 수 없습니다. 전체 입력이 16자 이내이면 앞뒤 공백을 허용합니다.",
  "errors.CHMOD_INVALID_SYMBOLIC":
    "u/g/o/a를 명시하고 하나의 +, - 또는 = 연산자와 rwxst만 사용하며 절을 쉼표로 구분하세요. 이 기호 범위는 X, 권한 복사, 대상 생략, 여러 연산자를 지원하지 않습니다.",
  "errors.CHMOD_INVALID_UMASK":
    "3자리 8진수 umask(000–777)를 입력하세요. 앞에 0을 하나 추가할 수 있습니다. 특수 비트는 지원하지 않으며 전체 입력이 16자 이내이면 앞뒤 공백을 허용합니다.",
  "errors.CHMOD_SYMBOLIC_LIMIT": "기호 표현식을 256바이트와 32개 절 이내로 유지하세요.",
};

export const chmodMessages = { en, ja, "zh-CN": zhCN, "zh-TW": zhTW, ko };
