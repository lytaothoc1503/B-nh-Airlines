# BẢNH FULI — Website hãng hàng không Bay Cùng Bảnh – Bay Cùng Bố

## 1. Mở giao diện ngay

Giải nén ZIP. Mở thư mục bay-viet trong VS Code bằng File > Open Folder.
Nhấp đúp index.html để xem giao diện. CSS và JavaScript phải nằm cùng thư mục.
Chế độ này xem được popup, tìm chuyến và chọn hành trình; không lưu được yêu cầu.
Không cần npm, không cần cài skill, không cần thư viện ngoài.

## Extensions trong VS Code

Không cần cài extension để mở giao diện hoặc chạy máy chủ. Nếu muốn tô màu cú pháp,
chọn Microsoft Python (`ms-python.python`) và Pylance (`ms-python.vscode-pylance`)
trong Extensions; cả hai chỉ là tiện ích hỗ trợ soạn thảo.
Không cần Chrome DevTools MCP Relay hoặc Live Server. Để gửi yêu cầu, chạy
`py server.py` và mở đúng `http://127.0.0.1:8000`; Live Server không cung cấp API này.

## Triển khai giao diện tĩnh lên Cloudflare Pages

1. Trong PowerShell, từ thư mục `bay-viet`, chạy `.\prepare-cloudflare-pages.ps1`.
   Lệnh tạo `cloudflare-pages` chỉ với `index.html`, `style.css`, `app.js` và `_headers`;
   không tải mã Python, SQLite, tài liệu hoặc dữ liệu riêng tư lên Cloudflare.
2. Đăng nhập Cloudflare Dashboard, vào **Workers & Pages** > **Create application** > **Pages** > **Upload assets**.
3. Đặt tên dự án và tải thư mục `cloudflare-pages` vừa tạo lên. Không tải thư mục dự án gốc.
   Không cần build command hay framework; `index.html` nằm ngay thư mục gốc của các tệp deploy.
4. Sau khi deploy, mở địa chỉ `*.pages.dev` Cloudflare cấp. Tệp `_headers` cấu hình CSP và các HTTP security headers cho trang tĩnh.

Đây chỉ là bản giao diện: Cloudflare Pages không chạy `server.py` hoặc SQLite.
Biểu mẫu liên hệ sẽ bị khóa trên website công khai và không nhận dữ liệu. Không nhập
tên/số điện thoại vào biểu mẫu ở bản này. Muốn nhận yêu cầu cần triển khai backend riêng;
không đưa `private/requests.sqlite3` hoặc dữ liệu khách hàng lên Pages.

Khi bổ sung API/MCP và nhiều cơ sở dữ liệu, giữ thông tin xác thực ở phía máy chủ
(Cloudflare Worker/Secrets hoặc dịch vụ backend phù hợp). Không gọi công cụ MCP trực tiếp
từ trình duyệt công khai, không nhúng khóa API/DB vào JavaScript và chỉ cho API truy cập
các thao tác, dữ liệu đã được xác thực và phân quyền.

## 2. Chạy chức năng lưu yêu cầu

Cần Python 3.10 trở lên trên máy Windows. Trong Terminal tại thư mục dự án:

    py --version
    py server.py

Nếu máy dùng lệnh python thay vì py:

    python server.py

Mở đúng địa chỉ <http://127.0.0.1:8000> (không dùng Live Server cho API này).
Dừng máy chủ bằng Ctrl+C. Nếu cổng 8000 đang bận, dừng ứng dụng đang dùng cổng đó.
Cơ sở dữ liệu tự tạo ở private/requests.sqlite3. Không xóa nếu cần giữ yêu cầu.
Mã REQ là mã tiếp nhận, KHÔNG phải PNR/mã đặt chỗ/số vé.
Không có email hoặc SMS tự động gửi tới người quản lý.

## 3. Đọc các yêu cầu đã lưu

Trong Terminal của VS Code mở Python tương tác bằng `py`, rồi chạy:

    import sqlite3
    db = sqlite3.connect('private/requests.sqlite3')
    rows = db.execute('SELECT reference, created_at, name, phone, origin, destination, departure_date, return_date, passengers FROM requests ORDER BY created_at DESC LIMIT 20').fetchall()
    for row in rows:
        print(row)

Sau vòng for, nhấn Enter thêm một lần. Dùng exit() để thoát Python.
Chỉ đọc trên máy bạn. Không chia sẻ kết quả có thông tin khách hàng.
Chưa có trang quản trị web: cố ý không công khai dữ liệu liên hệ qua API GET.

## 4. Tệp dự án

- index.html: bố cục trang và biểu mẫu.
- style.css: màu sắc, responsive, hiệu ứng và reduced motion.
- app.js: tìm kiếm giả lập, popup và gửi yêu cầu cùng nguồn.
- server.py: máy chủ cục bộ, kiểm tra dữ liệu và lưu SQLite.
- _headers: security headers cho Cloudflare Pages.
- prepare-cloudflare-pages.ps1: tạo thư mục deploy chỉ gồm các tài nguyên công khai đã cho phép.
- docs/PROJECT_CONTEXT.md: mục tiêu và quy tắc dự án.
- docs/CURRENT_STATE.md: trạng thái và hạn chế.
- docs/BAO_CAO_KHOI_TAO.md: bản báo cáo khởi tạo, không phải báo cáo nghiệm thu.
- .github/copilot-instructions.md: hướng dẫn nếu dùng coding agent có hỗ trợ.

## 5. Cấu hình nội dung

- Tên, giới thiệu, popup: sửa index.html.
- Màu: sửa biến ở đầu style.css.
- Chuyến mẫu: sửa templates trong app.js.
- Popup hiện sau khoảng 1,3 giây nếu người dùng chưa tương tác với phần tử khác.
- Đánh dấu không hiện lại rồi đóng: lưu trong sessionStorage, không gửi lên máy chủ.
- Không có giảm giá thật: không dựng mã coupon hay đồng hồ khuyến mãi giả.
- Ảnh minh họa được dựng bằng CSS, không tải từ website khác.

## 6. Phạm vi và giới hạn

Tìm kiếm chỉ gồm 3 sân bay và người lớn; số lượng 1–9 là quy ước của ứng dụng.
Các hãng, mã chuyến, giờ bay và giá đều giả lập; không có tồn chỗ thật.
Bộ dữ liệu giờ bay giống nhau giữa các tuyến để kiểm tra bố cục, không mô tả thời gian bay thật.
Chuyến khứ hồi cùng ngày được kiểm tra giờ về không trước giờ đến chiều đi; chưa có thời gian đệm.
API tiếp nhận chỉ lưu tuyến/ngày/số người/thông tin liên hệ, KHÔNG lưu giá giả như giá đã xác nhận.
Có chống trùng theo requestKey khi gửi lại cùng biểu mẫu; không phát hiện mọi yêu cầu trùng nghiệp vụ.
Giới hạn 30 POST/phút dùng chung cho máy chủ cục bộ; không phải hệ thống chống spam sản xuất.
Thông báo lỗi máy chủ dùng tiếng Việt không dấu để đơn giản hóa xử lý.
Ngày kiểm tra trên máy chủ dựa vào ngày địa phương của máy chạy Python.

## 7. Trước khi đưa lên Internet

Máy chủ này chỉ dành cho phát triển, bind 127.0.0.1. Không mở cổng công khai.
Cần thiết kế triển khai production, HTTPS, quản trị có xác thực, phân quyền,
chính sách dữ liệu, thời hạn lưu, sao lưu/khôi phục, kiểm thử bảo mật,
chống spam, giám sát, API hãng/đại lý và cổng thanh toán được cấp quyền.
SQLite chứa tên và điện thoại, KHÔNG được ứng dụng mã hóa. Bảo vệ máy tính và bản sao lưu.
Không có endpoint tải DB, script ngoài, quảng cáo, tracking hoặc gửi dữ liệu cho AI.
Thương hiệu chính là Bảnh Fuli; tên website/dịch vụ là Bay Cùng Bảnh – Bay Cùng Bố. Không có logo hoặc tài sản của hãng khác.

## 8. Kiểm tra thủ công

- Máy tính và màn hình 360px/390px.
- Popup: X, Escape, mở lại, không hiện lại trong phiên.
- Điểm đi trùng điểm đến; ngày quá khứ; khứ hồi trước ngày đi.
- Chọn chuyến đi/về cùng ngày có giờ không hợp lệ.
- Đổi tiêu chí làm ẩn kết quả cũ, bấm tìm để tạo kết quả mới.
- Tổng tiền nhân đúng số người lớn.
- Nút gửi yêu cầu không hoạt động khi mở bằng file hoặc sai máy chủ.
- API lưu yêu cầu, từ chối dữ liệu sai, không lưu trùng khi cùng requestKey.
- Truy cập /private/requests.sqlite3 phải bị từ chối.

Xem CURRENT_STATE.md để biết phần đã và chưa kiểm thử.
