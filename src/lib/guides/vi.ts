import type { ToolGuide, GuideLabels } from '../guide-schema.ts'
import type { ToolId } from '../catalog.ts'

export const guideLabelsVi = {
  "usage": "Cách sử dụng",
  "example": "Ví dụ và diễn giải",
  "exampleInput": "Đầu vào ví dụ",
  "exampleResult": "Ý nghĩa kết quả",
  "limitations": "Đầu vào được hỗ trợ và giới hạn",
  "languages": "Ngôn ngữ trang",
  "allTools": "Tất cả công cụ",
  "useTool": "Dùng công cụ trên trang này",
  "javascript": "Bạn có thể đọc hướng dẫn và ví dụ mà không cần JavaScript. Bật JavaScript để thao tác với công cụ.",
  "availability": "Hướng dẫn này luôn có sẵn dù công cụ được bật hay tắt. Không gian làm việc tương tác tuân theo các tùy chọn lưu trong trình duyệt này.",
  "disabledTitle": "Công cụ này đã bị tắt",
  "disabled": "Công cụ này đã bị tắt trong trình duyệt. Bật công cụ trong Cài đặt để sử dụng. Mở hướng dẫn không thay đổi tùy chọn của bạn.",
  "privacy": "Đầu vào được xử lý trong bộ nhớ trình duyệt. Dữ liệu không được gửi đi, lưu lại hoặc đưa vào URL của trang. Chỉ các tùy chọn được lưu."
} satisfies GuideLabels

export const toolGuidesVi = {
  "html-entities": {
    "introduction": "Mã hóa văn bản an toàn thành tham chiếu ký tự HTML và giải mã tập tham chiếu có tên được ghi trong tài liệu hoặc tham chiếu số hợp lệ mà không diễn giải mã đánh dấu.",
    "steps": [
      "Chọn chiều chuyển đổi và chế độ thoát ký tự tối thiểu hoặc đầy đủ, rồi nhập văn bản.",
      "Kiểm tra và sao chép kết quả. Chỉ giải mã một lượt."
    ],
    "exampleInput": "<p title=\"Hello\">A & B 👋</p>",
    "exampleResult": "Mã hóa tối thiểu cho kết quả &lt;p title=&quot;Hello&quot;&gt;A &amp; B 👋&lt;/p&gt;. Chế độ đầy đủ chuyển ký tự ngoài ASCII thành tham chiếu số.",
    "limitations": [
      "Đầu vào tối đa 64 KiB. Giải mã tham chiếu có tên chỉ hỗ trợ amp/lt/gt/quot/apos/nbsp/copy/reg/trade/euro/hellip/mdash/ndash/times/divide. Tham chiếu không hợp lệ hoặc không xác định được giữ nguyên. Mã đánh dấu không bao giờ được thực thi."
    ]
  },
  "url-encode": {
    "introduction": "Chuyển đổi chuỗi bằng mã hóa phần trăm theo thành phần, biểu mẫu hoặc đường dẫn giữ nguyên dấu gạch chéo; không truy cập URL.",
    "steps": [
      "Chọn chiều chuyển đổi và chế độ mã hóa, rồi nhập chuỗi.",
      "Kiểm tra và sao chép kết quả."
    ],
    "exampleInput": "A B/日+?",
    "exampleResult": "Chế độ thành phần mã hóa A B/日+? thành A%20B%2F%E6%97%A5%2B%3F; chế độ đường dẫn giữ nguyên dấu gạch chéo.",
    "limitations": [
      "Đầu vào tối đa 64 KiB. Chỉ chế độ biểu mẫu xem + là khoảng trắng khi giải mã. Chuỗi thoát sai hoặc UTF-8 sai định dạng sẽ báo lỗi. Công cụ không phân tích hoặc tải URL."
    ]
  },
  "dummy-text": {
    "introduction": "Tạo văn bản giữ chỗ có thể tái tạo từ các cụm từ tổng hợp cố định theo sáu phong cách ngôn ngữ.",
    "steps": [
      "Chọn ngôn ngữ, đoạn/câu/ký tự, số lượng và seed.",
      "Sao chép hoặc tải đầu ra xuống."
    ],
    "exampleInput": "language=ja; unit=paragraphs; count=3; seed=42",
    "exampleResult": "Tiếng Nhật / 3 đoạn / seed 42 luôn tạo ra cùng ba đoạn văn.",
    "limitations": [
      "Tối đa 30 đoạn, 120 câu hoặc 10.000 giá trị vô hướng Unicode; đầu ra tối đa 64 KiB. Các cụm từ được tổng hợp, không phải dữ liệu cá nhân thật."
    ]
  },
  "css-specificity": {
    "introduction": "So sánh độ ưu tiên (a,b,c) của bộ chọn CSS, kèm đóng góp của từng token.",
    "steps": [
      "Nhập một hoặc nhiều bộ chọn, ngăn cách bằng dấu phẩy.",
      "Xem điểm các thành phần và sao chép báo cáo."
    ],
    "exampleInput": "main#app .card:hover::before, p:where(#preview) > a",
    "exampleResult": "Bộ chọn thứ nhất có điểm (1,2,2), bộ chọn thứ hai có điểm (0,0,2). :where đóng góp bằng không.",
    "limitations": [
      "Tối đa 4.096 ký tự, 32 bộ chọn, 8 cấp lồng nhau. Hỗ trợ tập con Selectors 4 nghiêm ngặt; & lồng nhau và hàm giả không được hỗ trợ sẽ báo lỗi thay vì phỏng đoán."
    ]
  },
  "fluid-type": {
    "introduction": "Tạo clamp CSS nội suy tuyến tính từ hai cặp mốc vùng nhìn và cỡ chữ.",
    "steps": [
      "Nhập cỡ chữ và vùng nhìn tại mốc dưới, mốc trên, cùng số px cơ sở trên mỗi rem.",
      "Di chuyển thanh trượt xem trước, rồi sao chép CSS đã tạo."
    ],
    "exampleInput": "minSize=16px; maxSize=24px; minViewport=320px; maxViewport=1280px; rootSize=16px",
    "exampleResult": "Ví dụ tạo ra font-size: clamp(1rem, calc(0.833333vw + 0.833333rem), 1.5rem);",
    "limitations": [
      "Cỡ chữ 0.5–256 px, chiều rộng 240–10.000 px, cơ sở 8–32 px. Vùng nhìn phải tăng dần. Hệ số CSS làm tròn đến sáu chữ số thập phân; rem thực tế phụ thuộc vào cỡ chữ gốc của trình duyệt."
    ]
  },
  "cubic-bezier": {
    "introduction": "Điều chỉnh hàm thời gian CSS bằng đường cong lấy mẫu và bản xem trước chuyển động.",
    "steps": [
      "Điều chỉnh các tùy chọn hoặc dán đầu vào. Việc xử lý diễn ra hoàn toàn trong trình duyệt này.",
      "Xem kết quả, rồi chủ động sao chép hoặc tải xuống nếu cần."
    ],
    "exampleInput": "x1=.25, y1=.1, x2=.25, y2=1; duration=600 ms",
    "exampleResult": "cubic-bezier(0.25, 0.1, 0.25, 1)",
    "limitations": [
      "x1/x2 phải từ 0–1; y1/y2 từ −5–5; thời lượng 50–20.000 ms. Đường cong được lấy mẫu, bản xem trước tuân theo tùy chọn giảm chuyển động."
    ]
  },
  "css-gradient": {
    "introduction": "Tạo dải màu tuyến tính và xuyên tâm với các điểm dừng màu có thể chỉnh sửa.",
    "steps": [
      "Điều chỉnh các tùy chọn hoặc dán đầu vào. Việc xử lý diễn ra hoàn toàn trong trình duyệt này.",
      "Xem kết quả, rồi chủ động sao chép hoặc tải xuống nếu cần."
    ],
    "exampleInput": "linear 90deg; #3366FF 0%, #FF8C00CC 100%",
    "exampleResult": "linear-gradient(90deg, #3366FF 0%, #FF8C00CC 100%)",
    "limitations": [
      "2–8 điểm dừng màu dùng HEX sáu/tám chữ số và vị trí 0–100%. Nội suy của trình duyệt tuân theo CSS; không dùng mạng."
    ]
  },
  "svg-placeholder": {
    "introduction": "Tạo ảnh SVG hoặc PNG có nhãn văn bản để tải xuống ngay trên thiết bị.",
    "steps": [
      "Điều chỉnh các tùy chọn hoặc dán đầu vào. Việc xử lý diễn ra hoàn toàn trong trình duyệt này.",
      "Xem kết quả, rồi chủ động sao chép hoặc tải xuống nếu cần."
    ],
    "exampleInput": "640×360, #2D5B8A, label='640 × 360'",
    "exampleResult": "<svg xmlns=\"http://www.w3.org/2000/svg\" ...>…</svg> (xuất SVG và PNG)",
    "limitations": [
      "Kích thước 1–4096 px (tối đa 4 MP); nhãn tối đa 160 byte UTF-8. SVG được thoát ký tự đặc biệt, không có script hay URL."
    ]
  },
  "path-batch": {
    "introduction": "Xem trước thay đổi tiền tố, hoa/thường, đánh số và dấu phân cách mà không tác động đến tệp.",
    "steps": [
      "Điều chỉnh các tùy chọn hoặc dán đầu vào. Việc xử lý diễn ra hoàn toàn trong trình duyệt này.",
      "Xem kết quả, rồi chủ động sao chép hoặc tải xuống nếu cần."
    ],
    "exampleInput": "src/Report.txt\nsrc/report.txt; suffix=-new",
    "exampleResult": "src/Report-new.txt / src/report-new.txt; có thể trùng tên nếu không phân biệt hoa/thường",
    "limitations": [
      "Tối đa 500 dòng/64 KiB; không bao giờ đổi tên tệp. Phát hiện trùng tên không phân biệt hoa/thường và chỉ mang tính gần đúng trên hệ thống ngoài Windows."
    ]
  },
  "color-palette": {
    "introduction": "Tạo các mẫu màu tương đồng, bổ túc hoặc bộ ba dựa trên HSL.",
    "steps": [
      "Điều chỉnh các tùy chọn hoặc dán đầu vào. Việc xử lý diễn ra hoàn toàn trong trình duyệt này.",
      "Xem kết quả, rồi chủ động sao chép hoặc tải xuống nếu cần."
    ],
    "exampleInput": "base=#3366FF, count=5, analogous",
    "exampleResult": "Năm sắc độ HSL xác định và các biến CSS có thể sao chép",
    "limitations": [
      "2–8 màu sRGB từ HEX, có thể thêm alpha. Sự hài hòa HSL không bảo đảm độ tương phản WCAG."
    ]
  },
  "chmod": {
    "introduction": "Kiểm tra bit quyền tệp Linux trước khi thay đổi chế độ. Chuyển đổi giữa giá trị bát phân và ô chọn rwx, xem trước thay đổi ký hiệu có phạm vi cụ thể, và so sánh quyền tạo mới theo umask.",
    "steps": [
      "Nhập ba hoặc bốn chữ số bát phân, hoặc chọn ví dụ rồi điều chỉnh chủ sở hữu, nhóm, người khác và bit đặc biệt. Các phép tính nhỏ cập nhật ngay lập tức.",
      "Xem trước biểu thức chỉ định rõ lớp người dùng như u+x,g-w,o=. Chọn ngữ nghĩa thư mục khi cần. Chủ động dùng bản xem trước để thay thế chế độ đã chọn.",
      "Nhập umask riêng để xem ví dụ tạo tệp và thư mục thông thường. Chỉ sao chép lệnh GNU/Linux minh họa khi cần; thay ./path trước khi dùng."
    ],
    "exampleInput": "mode: 0644\nsymbolic: u+x,g-w,o=\numask: 022",
    "exampleResult": "0644 là rw-r--r--. Bản xem trước ký hiệu là 0740 (rwxr-----). Với chế độ tạo yêu cầu là 0666/0777 và không có ACL mặc định, umask 022 cho tệp 0644 và thư mục 0755.",
    "limitations": [
      "Đây là bộ tính 12 bit, không mô phỏng quyền truy cập thực tế hoặc hệ thống tệp. Không thực thi lệnh; ACL, quyền sở hữu, quyền thư mục cha và tùy chọn gắn hệ thống tệp nằm ngoài phạm vi.",
      "Đầu vào ký hiệu yêu cầu u/g/o/a chỉ định rõ, một toán tử +, - hoặc = mỗi mệnh đề và rwxst. Không hỗ trợ X, sao chép quyền và khoảng trắng bên trong. Tối đa 256 byte UTF-8 và 32 mệnh đề; đầu vào bát phân/umask có tối đa 16 ký tự thô.",
      "= với thư mục giữ nguyên setuid/setgid không được đề cập; u-s/g-s chỉ định rõ sẽ xóa chúng. Toán hạng bát phân GNU năm chữ số được sao chép kiểm soát mọi bit đặc biệt. Ví dụ umask tách biệt với chmod."
    ]
  },
  "base64": {
    "introduction": "Mã hóa văn bản UTF-8 thành Base64 hoặc giải mã Base64 về UTF-8. Việc chuyển đổi diễn ra hoàn toàn trong trình duyệt.",
    "steps": [
      "Chọn mã hóa hoặc giải mã và bảng ký tự tiêu chuẩn hoặc an toàn cho URL, rồi nhập văn bản.",
      "Đầu vào ngắn cập nhật ngay lập tức. Văn bản dài hơn chạy trong Worker sau một khoảng chờ ngắn; có thể áp dụng thủ công.",
      "Sao chép hoặc tải kết quả xuống, hoặc hoán đổi để chuyển đổi theo chiều ngược lại."
    ],
    "exampleInput": "こんにちは 👋",
    "exampleResult": "Mã hóa tiêu chuẩn tạo 44GT44KT44Gr44Gh44GvIPCfkYs=, chuyển 20 byte UTF-8 thành 28 ký tự Base64.",
    "limitations": [
      "Đầu vào giới hạn 256 KiB. Đầu ra tiêu chuẩn dùng ký tự đệm =; đầu ra an toàn cho URL thay + và /, đồng thời bỏ ký tự đệm.",
      "Giải mã chấp nhận văn bản chuẩn có hoặc không có ký tự đệm, nhưng không chấp nhận khoảng trắng, ký tự không hợp lệ, bit không sử dụng khác không hoặc UTF-8 không hợp lệ. Không hỗ trợ tệp nhị phân tùy ý.",
      "Surrogate UTF-16 không ghép cặp bị từ chối thay vì thay thế. Đầu vào lớn dùng Worker có thể hủy với thời gian chờ tối đa 5 giây. Đầu vào không được lưu hoặc truyền đi."
    ]
  },
  "data-units": {
    "introduction": "Chuyển đổi bit và byte với hệ số SI/IEC chính xác, tách riêng dung lượng và tốc độ truyền.",
    "steps": [
      "Nhập giá trị hoặc dùng nút ví dụ. Chọn dạng chuyển đổi và ngữ cảnh liên quan nếu có.",
      "Kiểm tra đầu ra và bảng chi tiết; dùng Sao chép hoặc Tải xuống để xuất kết quả đã tạo."
    ],
    "exampleInput": "1 (MiB → B)",
    "exampleResult": "1 MiB = 1.048.576 B; 1 MiB = 8.388.608 b. MB theo SI không giống MiB theo IEC.",
    "limitations": [
      "Chỉ giá trị thập phân (tối đa 96 ký tự, 24 chữ số phần thập phân). SI dùng 1000; IEC dùng 1024. Kết quả có dấu ≈ bị cắt sau 24 chữ số thập phân. Giá trị âm chỉ có ý nghĩa toán học, không phải kích thước tệp hợp lệ.",
      "Chỉ chạy trong trình duyệt. Dữ liệu không bao giờ được gửi đến API hoặc lưu trong cài đặt, lịch sử hay URL."
    ]
  },
  "css-units": {
    "introduction": "So sánh đơn vị độ dài CSS bằng kích thước gốc, phần tử và vùng nhìn được chỉ định rõ.",
    "steps": [
      "Nhập giá trị hoặc dùng nút ví dụ. Chọn dạng chuyển đổi và ngữ cảnh liên quan nếu có.",
      "Kiểm tra đầu ra và bảng chi tiết; dùng Sao chép hoặc Tải xuống để xuất kết quả đã tạo."
    ],
    "exampleInput": "16 px; root font 16 px, element font 16 px, viewport 1440 × 900 px",
    "exampleResult": "16 px = 1 rem = 1 em; 16 px ≈ 1.111111 vw ở kích thước vùng nhìn này.",
    "limitations": [
      "Nhập độ dài, cỡ chữ gốc và phần tử giả định, cùng chiều rộng/cao vùng nhìn, tất cả tính bằng px CSS. em dựa trên cỡ chữ phần tử đã chỉ định. Phần thập phân được làm tròn đến sáu chữ số; không bao gồm % và truy vấn vùng chứa.",
      "Chỉ chạy trong trình duyệt. Dữ liệu không bao giờ được gửi đến API hoặc lưu trong cài đặt, lịch sử hay URL."
    ]
  },
  "unicode-normalize": {
    "introduction": "So sánh điểm mã NFC, NFD, NFKC và NFKD mà không thay đổi nguồn.",
    "steps": [
      "Nhập giá trị hoặc dùng nút ví dụ. Chọn dạng chuyển đổi và ngữ cảnh liên quan nếu có.",
      "Kiểm tra đầu ra và bảng chi tiết; dùng Sao chép hoặc Tải xuống để xuất kết quả đã tạo."
    ],
    "exampleInput": "é (e plus U+0301 COMBINING ACUTE ACCENT)",
    "exampleResult": "NFC tạo é (U+00E9); NFD giữ U+0065 U+0301. Các dạng tương thích có thể thay đổi ký tự khác.",
    "limitations": [
      "Tối đa 16 KiB văn bản UTF-8. Bảng xem trước hiển thị tối đa 32 điểm mã mỗi dạng. Chuẩn hóa tương thích có thể xóa khác biệt; JavaScript giữ nguyên surrogate UTF-16 không ghép cặp.",
      "Chỉ chạy trong trình duyệt. Dữ liệu không bao giờ được gửi đến API hoặc lưu trong cài đặt, lịch sử hay URL."
    ]
  },
  "slug": {
    "introduction": "Tạo slug ASCII hoặc Unicode ổn định từ các dòng văn bản, thêm hậu tố khi trùng.",
    "steps": [
      "Nhập giá trị hoặc dùng nút ví dụ. Chọn dạng chuyển đổi và ngữ cảnh liên quan nếu có.",
      "Kiểm tra đầu ra và bảng chi tiết; dùng Sao chép hoặc Tải xuống để xuất kết quả đã tạo."
    ],
    "exampleInput": "Hello World\nHello World",
    "exampleResult": "hello-world và hello-world-2. Các trường hợp trùng được xử lý trên toàn bộ dòng không trống đã cung cấp.",
    "limitations": [
      "Tối đa 16 KiB, 100 dòng không trống. Dùng NFKD rồi chuyển chữ thường và thay dấu phân cách. Chế độ ASCII loại bỏ dấu kết hợp nhưng không chuyển tự chữ Nhật, Trung hay hệ chữ khác. Slug trùng nhận hậu tố -2 / _2.",
      "Chỉ chạy trong trình duyệt. Dữ liệu không bao giờ được gửi đến API hoặc lưu trong cài đặt, lịch sử hay URL."
    ]
  },
  "unicode-escape": {
    "introduction": "Mã hóa và giải mã điểm mã U+ cùng chuỗi thoát Unicode JavaScript mà không thực thi mã.",
    "steps": [
      "Nhập giá trị hoặc dùng nút ví dụ. Chọn dạng chuyển đổi và ngữ cảnh liên quan nếu có.",
      "Kiểm tra đầu ra và bảng chi tiết; dùng Sao chép hoặc Tải xuống để xuất kết quả đã tạo."
    ],
    "exampleInput": "A😀",
    "exampleResult": "Ở chế độ U+, mã hóa cho U+0041 U+1F600; giải mã nghiêm ngặt khôi phục A😀.",
    "limitations": [
      "Tối đa 16 KiB. Giải mã chỉ chấp nhận token U+XXXX hoặc token chuỗi thoát JS hoàn chỉnh, không nhận mã JavaScript tùy ý. Surrogate UTF-16 đơn lẻ, chuỗi thoát sai định dạng và giá trị ngoài phạm vi sẽ báo lỗi.",
      "Chỉ chạy trong trình duyệt. Dữ liệu không bao giờ được gửi đến API hoặc lưu trong cài đặt, lịch sử hay URL."
    ]
  },
  "csv": {
    "introduction": "Kiểm tra bảng trước khi nhập: xem giá trị thiếu, kiểu dữ liệu lẫn lộn và tiêu đề lặp lại mà không ghi lại ô. Thống kê cột và bản xem trước hàng giúp xác định vấn đề chất lượng dữ liệu.",
    "steps": [
      "Dán văn bản CSV hoặc TSV, hoặc mở tệp UTF-8. Chọn dấu phân cách và xác định hàng đầu có chứa tiêu đề hay không.",
      "Xem số hàng và cột, ô trống cùng các kiểu dữ liệu được suy luận. Nhấn Chạy nếu đã tắt tự động áp dụng."
    ],
    "exampleResult": "Khi chọn dấu phẩy và bật tiêu đề, dữ liệu có 3 hàng và 2 cột. Cột score có 1 ô trống; các giá trị còn lại được suy luận là số nguyên.",
    "limitations": [
      "Tối đa 16 MiB, 100.000 bản ghi và 256 cột. Kiểu dữ liệu được suy luận; giá trị ô vẫn là văn bản. Bản xem trước hàng và việc theo dõi giá trị riêng biệt có giới hạn hiển thị hoặc theo dõi."
    ],
    "exampleInput": "name,score\nAda,98\nLinus,\nGrace,99"
  },
  "logs": {
    "introduction": "Thu hẹp nhật ký lớn xuống các dòng liên quan, xem số lượng theo mức độ và tìm thông báo lặp lại. Điều này giúp nhận ra dấu hiệu xuất hiện thường xuyên khi điều tra sự cố.",
    "steps": [
      "Dán nhật ký hoặc mở tệp UTF-8. Có thể nhập biểu thức chính quy như ERROR|WARN.",
      "Xem số dòng khớp, mức độ, dòng lặp và bản xem trước. Bật khớp không phân biệt hoa/thường nếu cần."
    ],
    "exampleResult": "Bộ lọc ERROR|WARN khớp 3 dòng. ERROR database timeout xuất hiện hai lần với văn bản giống hệt, và có 1 dòng WARN.",
    "limitations": [
      "Nhật ký và bộ lọc cộng lại hỗ trợ tối đa 16 MiB, với tối đa 100.000 dòng nhật ký. Bộ lọc dùng cú pháp regex của Rust, không có lookaround hoặc tham chiếu ngược. Mức độ được suy đoán theo quy tắc và bản xem trước có giới hạn."
    ],
    "exampleInput": "INFO server ready\nERROR database timeout\nWARN retrying\nERROR database timeout"
  },
  "sets": {
    "introduction": "So sánh danh sách theo dòng như tập hợp để lấy mục chung, mục chỉ có ở một danh sách hoặc nội dung gộp. Kết quả đã loại trùng giữ nguyên thứ tự đầu vào.",
    "steps": [
      "Nhập mỗi dòng một mục trong danh sách A và B. Dấu A: và B: trong ví dụ chỉ để tách hai đầu vào; không dán các dấu này.",
      "Chọn giao, hợp hoặc phép hiệu. Xem các tùy chọn dòng trống, khoảng trắng hai đầu và phân biệt hoa/thường."
    ],
    "exampleResult": "Giao là Rust. Hợp là Vue, Rust, Go theo đúng thứ tự đó; Vue chỉ xuất hiện một lần dù bị lặp trong A.",
    "limitations": [
      "Hai danh sách cộng lại hỗ trợ tối đa 16 MiB và 100.000 dòng. Mỗi dòng đầy đủ là một mục. Chế độ không phân biệt hoa/thường dùng phép chuyển chữ thường Unicode thay vì chuẩn hóa hoa/thường toàn phần. Bản xem trước hiển thị 1.000 mục đầu; sao chép và tải xuống bao gồm toàn bộ kết quả."
    ],
    "exampleInput": "A:\nVue\nRust\nVue\n\nB:\nRust\nGo"
  },
  "cidr": {
    "introduction": "Tính dải mạng IPv4 và IPv6, mặt nạ và số địa chỉ chính xác từ ký pháp CIDR. Bạn cũng có thể xem địa chỉ đã nhập có các bit phần máy chủ được đặt hay không.",
    "steps": [
      "Nhập địa chỉ IP và độ dài tiền tố, chẳng hạn 192.0.2.130/26.",
      "Kiểm tra địa chỉ mạng, địa chỉ cuối, mặt nạ và số địa chỉ. Dải máy chủ IPv4 cũng được hiển thị khi áp dụng được."
    ],
    "exampleResult": "Mạng là 192.0.2.128/26, địa chỉ cuối là 192.0.2.191 và mặt nạ là 255.255.255.192. Có 64 địa chỉ; dải máy chủ IPv4 thông thường là từ .129 đến .190.",
    "limitations": [
      "Chỉ tính toán dải địa chỉ: không truy vấn DNS, gửi yêu cầu mạng hoặc quét. Không áp dụng quảng bá IPv4 và cách đếm máy chủ dùng được cho IPv6."
    ],
    "exampleInput": "192.0.2.130/26"
  },
  "unicode": {
    "introduction": "Kiểm tra các chuỗi nhìn giống nhau nhưng không khớp, hoặc tìm ký tự vô hình trong mã được dán. Kết quả xác định điểm mã và vị trí, kèm hình hiển thị có nhãn cho ký tự ẩn.",
    "steps": [
      "Dán văn bản gốc. Có thể đưa khoảng trắng và xuống dòng thông thường vào kiểm tra.",
      "Xem điểm mã, dòng, cột, danh mục và hình hiển thị. Xác định từng ký tự có được dùng có chủ đích hay không trước khi xóa."
    ],
    "exampleResult": "Có 1 U+200B ZERO WIDTH SPACE giữa user và Name. Chuỗi trông giống userName, nhưng bản gốc chứa thêm một ký tự.",
    "limitations": [
      "Tối đa 512 KiB và 1.000 mục phát hiện được hiển thị. Công cụ chẩn đoán văn bản mà không tự sửa. Ký tự nối và dấu chỉ hướng có thể được dùng có chủ đích trong ngôn ngữ hoặc emoji."
    ],
    "exampleInput": "user​Name"
  },
  "json-diff": {
    "introduction": "So sánh cấu trúc và giá trị JSON, bỏ qua khoảng trắng và thứ tự khóa đối tượng. Giá trị thêm, xóa và thay đổi được xác định bằng đường dẫn JSON Pointer.",
    "steps": [
      "Nhập JSON trước và sau vào hai ô. Dấu A: và B: trong ví dụ tách hai đầu vào và không thuộc JSON.",
      "Xem từng loại thay đổi và đường dẫn. Cấu trúc và giá trị giống hệt sẽ được báo là bằng nhau dù định dạng khác."
    ],
    "exampleResult": "/count thay đổi từ 1 thành 2, và /tag được thêm với giá trị new. Di chuyển khóa active không tạo khác biệt vì giá trị của nó không đổi.",
    "limitations": [
      "Mỗi đầu vào giới hạn 512 KiB và độ sâu 64. Thứ tự phần tử mảng có ý nghĩa. Từ chối khóa trùng lặp và số mất độ chính xác; khi đạt giới hạn thay đổi, công cụ trả kết quả một phần có đánh dấu."
    ],
    "exampleInput": "A:\n{\"count\":1,\"active\":true}\n\nB:\n{\"active\":true,\"count\":2,\"tag\":\"new\"}"
  },
  "json-format": {
    "introduction": "Kiểm tra cú pháp JSON và tạo đầu ra thụt lề dễ đọc hoặc thu gọn. Công cụ thay đổi định dạng nhưng giữ nguyên khóa và giá trị.",
    "steps": [
      "Dán JSON hoặc mở tệp UTF-8.",
      "Chọn thụt lề 2, 4 hoặc 8 dấu cách, hoặc chọn Thu gọn. Xem đầu ra đã định dạng, rồi sao chép hoặc tải xuống."
    ],
    "exampleResult": "Với thụt lề 2 dấu cách, name, scores và active được hiển thị có xuống dòng và thụt lề. Thu gọn loại khoảng trắng không cần thiết nhưng giữ nguyên thứ tự mảng và giá trị.",
    "limitations": [
      "Tối đa 512 KiB và độ sâu 64. Từ chối khóa trùng lặp và số mất độ chính xác. Không hỗ trợ chú thích JSONC và dấu phẩy cuối."
    ],
    "exampleInput": "{\"name\":\"Ada\",\"scores\":[98,99],\"active\":true}"
  },
  "contrast": {
    "introduction": "Tính tỷ lệ tương phản giữa màu tiền cảnh và màu nền, rồi so sánh với ngưỡng WCAG 2.x. Bản xem trước giúp kiểm tra cặp màu đã chọn.",
    "steps": [
      "Nhập màu chữ và nền bằng giá trị hex 3 hoặc 6 chữ số, như #000000. Ví dụ dùng chữ đen trên nền trắng.",
      "Xem tỷ lệ và kết quả cho chữ cỡ thường, chữ cỡ lớn và thành phần giao diện. Đổi hoặc hoán đổi màu để tính lại."
    ],
    "exampleResult": "Đen và trắng có tỷ lệ tương phản 21:1. Tỷ lệ này đạt ngưỡng AA và AAA cho chữ cỡ thường và chữ cỡ lớn, cùng ngưỡng cho thành phần giao diện.",
    "limitations": [
      "Chỉ màu sRGB dạng hex không trong suốt. Không mô phỏng độ trong suốt, nền ảnh và dải màu. Chỉ phép kiểm tra này không đủ xác định tuân thủ khả năng tiếp cận tổng thể."
    ],
    "exampleInput": "#000000\n#FFFFFF"
  },
  "har": {
    "introduction": "Đọc HAR xuất từ DevTools của trình duyệt để xem trạng thái HTTP, nhóm máy chủ và kiểu phương tiện, cùng các yêu cầu chậm. Công cụ phân tích lưu lượng đã ghi ngay trên thiết bị.",
    "steps": [
      "Dán HAR JSON hoặc mở tệp HAR UTF-8. Ví dụ này là dữ liệu tổng hợp với một yêu cầu.",
      "Xem số yêu cầu, lỗi HTTP, số byte phản hồi đã biết và thời lượng. Chuyển giữa nhóm theo máy chủ và kiểu phương tiện."
    ],
    "exampleResult": "Yêu cầu duy nhất được tính là lỗi HTTP 503. Thời lượng đã ghi là 250 ms, và kích thước phản hồi đã biết là 120 byte: headersSize cộng bodySize.",
    "limitations": [
      "Tối đa 16 MiB và 100.000 mục. Không bao giờ truy cập URL đã ghi. Kích thước và thời gian chưa biết vẫn được giữ là chưa biết. Tổng thời lượng của các yêu cầu đồng thời không phải thời gian tải trang."
    ],
    "exampleInput": "{\"log\":{\"version\":\"1.2\",\"entries\":[{\"request\":{\"method\":\"GET\",\"url\":\"https://example.test/api\"},\"response\":{\"status\":503,\"headersSize\":100,\"bodySize\":20,\"content\":{\"mimeType\":\"application/json\"}},\"time\":250}]}}"
  },
  "env": {
    "introduction": "So sánh hai cấu hình .env theo khóa để tìm giá trị thay đổi, khóa thiếu, định nghĩa trùng lặp và dòng sai định dạng. Các giá trị mặc định được ẩn trong bảng.",
    "steps": [
      "Nhập .env A và .env B. Dấu A: và B: trong ví dụ tách hai đầu vào và cần được bỏ đi.",
      "Xem khóa khác nhau và chẩn đoán. Có thể hiện giá trị hoặc bao gồm khóa không thay đổi."
    ],
    "exampleResult": "LOG_LEVEL thay đổi từ debug thành info. OLD_FLAG chỉ có trong A, và CACHE chỉ có trong B. APP_NAME không đổi và được bỏ khỏi chế độ xem thay đổi mặc định.",
    "limitations": [
      "Mỗi đầu vào hỗ trợ tối đa 256 KiB, 10.000 dòng và 2.000 định nghĩa. Không thực hiện khai triển biến hoặc lệnh; định nghĩa hợp lệ cuối cùng được dùng. Các triển khai dotenv khác có thể khác. Sao chép và tải xuống bao gồm giá trị bị ẩn."
    ],
    "exampleInput": "A:\nAPP_NAME=demo\nLOG_LEVEL=debug\nOLD_FLAG=true\n\nB:\nAPP_NAME=demo\nLOG_LEVEL=info\nCACHE=true"
  },
  "url": {
    "introduction": "Kiểm tra lược đồ, máy chủ, đường dẫn và phân đoạn của URL, rồi sửa từng mục truy vấn. Trình sửa giữ khóa trùng lặp và thứ tự mục, đồng thời hiển thị URL kết quả.",
    "steps": [
      "Nhập URL tuyệt đối có lược đồ và máy chủ. Công cụ không mở trang đích.",
      "Xem các thành phần, rồi sửa, thêm hoặc xóa khóa và giá trị truy vấn. Sao chép URL kết quả khi sẵn sàng."
    ],
    "exampleResult": "Máy chủ là example.test, đường dẫn là /search và phân đoạn là results. tag có hai mục, vue và rust; q trở thành hello world vì + được giải mã thành khoảng trắng.",
    "limitations": [
      "Tối đa 16 KiB và 200 mục truy vấn. Bộ phân tích URL tiêu chuẩn có thể chuẩn hóa địa chỉ. Chỉnh sửa truy vấn mã hóa khoảng trắng thành + và dấu cộng thành %2B, đồng thời bỏ các đoạn & rỗng. Không gửi yêu cầu đến URL."
    ],
    "exampleInput": "https://example.test/search?tag=vue&tag=rust&q=hello+world#results"
  },
  "shortcuts": {
    "introduction": "Tra cứu phím tắt ứng dụng mặc định được ghi trong tài liệu bằng tổ hợp hoặc chuỗi phím trong từ điển cục bộ. Lọc theo hệ điều hành, ứng dụng và thao tác, rồi xem ngữ cảnh và nguồn của từng phím tắt.",
    "steps": [
      "Gõ phím tắt trong ô nhập thủ công, hoặc đặt tiêu điểm vào ô ghi nhận và nhấn phím tắt. Ngăn các tổ hợp nối tiếp bằng then; hỗ trợ tối đa 4 tổ hợp.",
      "Chọn hệ điều hành và ứng dụng, rồi chọn khớp chính xác hoặc chứa chuỗi. Xem thao tác, điều kiện tiêu điểm, phạm vi tài liệu và nguồn cho từng kết quả."
    ],
    "exampleResult": "Khi chọn Windows, Visual Studio Code và khớp chính xác, công cụ tìm thấy phím tắt hai tổ hợp để thêm chú thích dòng trong trình soạn thảo. Nhấn Ctrl+K rồi Ctrl+C; không nhấn K và C cùng lúc.",
    "limitations": [
      "Công cụ không phát hiện ứng dụng hoặc tiến trình đang dùng một phím. Không có kết quả trong từ điển không chứng minh phím tắt chưa được dùng hoặc không có xung đột. Cài đặt tùy chỉnh, phiên bản, tiêu điểm và bố cục bàn phím có thể thay đổi hành vi.",
      "Chỉ ghi nhận phím khi ô chuyên dụng có tiêu điểm. Tab chuyển tiêu điểm và Escape rời chế độ ghi nhận. Nhập thủ công các phím dành riêng cho hệ điều hành hoặc trình duyệt. Ctrl và Command là các phím bổ trợ khác nhau."
    ],
    "exampleInput": "Ctrl+K then Ctrl+C"
  },
  "explain": {
    "introduction": "Đọc đầu ra PostgreSQL EXPLAIN FORMAT JSON để xem nút kế hoạch, so sánh số hàng ước tính và thực tế, cùng thời gian đã ghi. Không thực thi SQL và không kết nối cơ sở dữ liệu.",
    "steps": [
      "Dán EXPLAIN JSON có sẵn. Số hàng thực tế và thời gian có sẵn khi đầu ra gốc bao gồm dữ liệu ANALYZE.",
      "Xem danh sách nút, có thể lọc theo kiểu nút hoặc tên quan hệ. So sánh ước tính với số hàng thực tế."
    ],
    "exampleResult": "Có một nút Seq Scan cho users. Nút ước tính 1.000 hàng và ghi 10 hàng thực tế mỗi vòng lặp, tỷ lệ thực tế/ước tính là 0.01. Thời gian thực thi đã ghi là 0.3 ms.",
    "limitations": [
      "Tối đa 512 KiB, độ sâu 64, 20 câu lệnh và 1.000 nút. Actual Rows và thời gian nút là trung bình mỗi vòng lặp. Thời gian nút cha bao gồm nút con, nên không bao giờ cộng thời gian các nút."
    ],
    "exampleInput": "[{\"Plan\":{\"Node Type\":\"Seq Scan\",\"Relation Name\":\"users\",\"Plan Rows\":1000,\"Actual Rows\":10,\"Actual Loops\":1,\"Actual Total Time\":0.2},\"Execution Time\":0.3}]"
  }
} satisfies Record<ToolId, ToolGuide>
