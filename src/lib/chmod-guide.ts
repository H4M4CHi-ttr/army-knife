import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./locales";

/** Synthetic examples shared by the public static pages; no runtime input. */
export const chmodGuide = {
  en: {
    introduction:
      "Inspect Linux file permission bits before changing a mode. Convert octal values and rwx checkboxes, preview scoped symbolic changes, and compare creation permissions under umask.",
    steps: [
      "Enter three or four octal digits, or select a sample and adjust owner, group, others, and special bits. Small calculations update immediately.",
      "Preview an explicit-class expression such as u+x,g-w,o=. Choose directory semantics when needed. Use preview deliberately to replace the selected mode.",
      "Enter umask separately to see common file and directory creation examples. Copy the GNU/Linux example command only when you want it; replace ./path before use.",
    ],
    exampleInput: "mode: 0644\nsymbolic: u+x,g-w,o=\numask: 022",
    exampleResult:
      "0644 is rw-r--r--. The symbolic preview is 0740 (rwxr-----). With requested creation modes 0666/0777 and no default ACL, umask 022 gives file 0644 and directory 0755.",
    limitations: [
      "This is a 12-bit calculator, not an effective-access or filesystem simulator. Commands are not executed; ACLs, ownership, parent permissions, and mount options are outside scope.",
      "Symbolic input requires explicit u/g/o/a, one +, - or = operator per clause, and rwxst. X, permission copying and internal whitespace are unsupported. Maximum 256 UTF-8 bytes and 32 clauses; octal/umask inputs are at most 16 raw characters.",
      "Directory = preserves unmentioned setuid/setgid; explicit u-s/g-s clears them. The copied five-digit GNU octal operand controls all special bits. Umask examples are separate from chmod.",
    ],
  },
  ja: {
    introduction:
      "Linux の権限変更前にモードのビットを確認できます。八進数と rwx チェックを相互変換し、対象を指定した symbolic 式と作成時 umask を確認します。",
    steps: [
      "3桁または4桁の八進数を入力するか、サンプルを選び、所有者・グループ・その他・特殊ビットを変更します。計算は即時反映です。",
      "u+x,g-w,o= のような対象を明示した式をプレビューします。必要ならディレクトリの規則を選び、「プレビューを使用」で元のモードへ反映します。",
      "umask を別に入力し、一般的なファイルとディレクトリの作成例を確認します。GNU/Linux 用の例示コマンドは必要なときだけコピーし、使用前に ./path を置き換えます。",
    ],
    exampleInput: "mode: 0644\nsymbolic: u+x,g-w,o=\numask: 022",
    exampleResult:
      "0644 は rw-r--r--、式のプレビューは 0740（rwxr-----）です。作成要求が 0666/0777 でデフォルト ACL がない場合、umask 022 はファイル 0644、ディレクトリ 0755 になります。",
    limitations: [
      "12ビットの計算であり、実効アクセスやファイルシステムを再現しません。コマンド実行、ACL、所有権、親の権限、マウント条件は対象外です。",
      "式は明示的な u/g/o/a、各節1個の +・-・=、rwxst のみ。X、権限コピー、内部空白は未対応です。最大256 UTF-8バイト・32節、八進数と umask は入力全体16文字までです。",
      "ディレクトリの = は未指定の setuid/setgid を保持し、u-s/g-s は削除します。コピーする5桁の GNU 八進数は特殊ビット全体を指定します。umask は chmod と別の作成例です。",
    ],
  },
  "zh-CN": {
    introduction:
      "更改 Linux 权限前检查模式位。在八进制与 rwx 复选框之间转换，预览指定对象的符号表达式，并查看 umask 创建示例。",
    steps: [
      "输入三位或四位八进制数，或选择示例并调整所有者、组、其他用户和特殊位。计算立即更新。",
      "预览 u+x,g-w,o= 等明确指定对象的表达式。需要时选择目录规则，再用“使用预览”替换原模式。",
      "单独输入 umask 查看常见文件和目录创建结果。按需复制 GNU/Linux 示例命令，使用前替换 ./path。",
    ],
    exampleInput: "mode: 0644\nsymbolic: u+x,g-w,o=\numask: 022",
    exampleResult:
      "0644 表示 rw-r--r--，表达式预览为 0740（rwxr-----）。请求创建模式为 0666/0777 且没有默认 ACL 时，umask 022 得到文件 0644、目录 0755。",
    limitations: [
      "这是 12 位计算器，不模拟实际访问或文件系统。不会执行命令；ACL、所有权、父目录权限和挂载选项不在范围内。",
      "表达式需要明确的 u/g/o/a，每段一个 +、- 或 =，权限仅 rwxst。不支持 X、权限复制或内部空白。最多 256 UTF-8 字节和 32 段；八进制与 umask 原始输入最多 16 个字符。",
      "目录的 = 保留未指定的 setuid/setgid，u-s/g-s 可清除。复制的五位 GNU 八进制参数明确控制所有特殊位。umask 示例与 chmod 分开。",
    ],
  },
  "zh-TW": {
    introduction:
      "更改 Linux 權限前檢查模式位元。在八進位與 rwx 核取方塊之間轉換，預覽指定對象的符號運算式，並查看 umask 建立範例。",
    steps: [
      "輸入三位或四位八進位數，或選擇範例並調整擁有者、群組、其他使用者及特殊位元。計算立即更新。",
      "預覽 u+x,g-w,o= 等明確指定對象的運算式。需要時選擇目錄規則，再以「使用預覽」取代原模式。",
      "另外輸入 umask 查看常見檔案及目錄建立結果。按需複製 GNU/Linux 範例指令，使用前取代 ./path。",
    ],
    exampleInput: "mode: 0644\nsymbolic: u+x,g-w,o=\numask: 022",
    exampleResult:
      "0644 表示 rw-r--r--，運算式預覽為 0740（rwxr-----）。要求建立模式為 0666/0777 且沒有預設 ACL 時，umask 022 得到檔案 0644、目錄 0755。",
    limitations: [
      "這是 12 位元計算器，不模擬實際存取或檔案系統。不會執行指令；ACL、擁有權、上層目錄權限及掛載選項不在範圍內。",
      "運算式需要明確的 u/g/o/a，每段一個 +、- 或 =，權限僅 rwxst。不支援 X、權限複製或內部空白。最多 256 UTF-8 位元組及 32 段；八進位與 umask 原始輸入最多 16 個字元。",
      "目錄的 = 保留未指定的 setuid/setgid，u-s/g-s 可清除。複製的五位 GNU 八進位參數明確控制所有特殊位元。umask 範例與 chmod 分開。",
    ],
  },
  ko: {
    introduction:
      "Linux 권한을 변경하기 전에 모드 비트를 확인합니다. 8진수와 rwx 체크박스를 변환하고, 대상을 명시한 기호식을 미리 보며 umask 생성 예제를 확인합니다.",
    steps: [
      "3자리 또는 4자리 8진수를 입력하거나 예제를 선택한 뒤 소유자, 그룹, 기타 사용자와 특수 비트를 조정합니다. 계산은 즉시 반영됩니다.",
      "u+x,g-w,o=처럼 대상을 명시한 식을 미리 봅니다. 필요하면 디렉터리 규칙을 선택하고 ‘미리 보기 사용’으로 기존 모드를 바꿉니다.",
      "umask를 별도로 입력하여 일반적인 파일과 디렉터리 생성 결과를 확인합니다. 필요할 때 GNU/Linux 예제 명령을 복사하고 사용 전에 ./path를 바꿉니다.",
    ],
    exampleInput: "mode: 0644\nsymbolic: u+x,g-w,o=\numask: 022",
    exampleResult:
      "0644는 rw-r--r--이며 식의 미리 보기는 0740(rwxr-----)입니다. 요청 생성 모드가 0666/0777이고 기본 ACL이 없으면 umask 022의 결과는 파일 0644, 디렉터리 0755입니다.",
    limitations: [
      "12비트 계산기로 실제 접근 권한이나 파일 시스템을 모의하지 않습니다. 명령 실행, ACL, 소유권, 상위 디렉터리 권한과 마운트 옵션은 범위 밖입니다.",
      "식에는 명시적 u/g/o/a, 절마다 하나의 +, - 또는 =, rwxst만 사용할 수 있습니다. X, 권한 복사와 내부 공백은 지원하지 않습니다. 최대 256 UTF-8바이트와 32절이며 8진수 및 umask 원시 입력은 최대 16자입니다.",
      "디렉터리의 =는 명시하지 않은 setuid/setgid를 유지하고 u-s/g-s는 지웁니다. 복사되는 5자리 GNU 8진수 인수는 모든 특수 비트를 지정합니다. umask는 chmod와 별도인 생성 예제입니다.",
    ],
  },
} satisfies Record<Locale, ToolGuide>;
