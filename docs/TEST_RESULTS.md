# Kiểm tra trong môi trường tạo bộ mã

## Chạy lại trên Windows (23/10/2026, Python 3.12.10)

Chạy `server.py` thật trên máy người dùng, thử bằng PowerShell `Invoke-WebRequest`:

- PASS GET /, /style.css, /app.js, /api/health: 200
- PASS Đường dẫn tới cơ sở dữ liệu: 404
- PASS Yêu cầu hợp lệ: 201; gửi lại cùng khóa: 200, trả đúng mã tiếp nhận cũ
- PASS Cùng khóa, nội dung khác: 409
- PASS Sân bay đi trùng sân bay đến: 400; thiếu đồng ý: 400; thiếu Origin: 403
- PASS Cơ sở dữ liệu chỉ có 1 dòng sau các lần thử (đã xóa thư mục `private` thử sau đó)
- PASS Cú pháp `server.py`
- NOT RUN `node --check` (máy chưa cài Node.js), kiểm tra ID phần tử JavaScript, trình duyệt đồ họa, điện thoại, hỗ trợ tiếp cận, bảo mật

## Bổ sung 1.0.1

- Đã rà soát: thay đổi `select`, ngày hoặc ô đồng ý trong biểu mẫu sẽ làm mới khóa chống trùng ở trình duyệt.
- Đã rà soát: phản hồi máy chủ có thêm `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy` và `Permissions-Policy`.
- Bộ kiểm tra gốc bên dưới là kết quả từ môi trường tạo bộ mã; phần HTTP đã được chạy lại trên Windows ở mục đầu tệp.

- PASS GET /: 200
- PASS GET /style.css: 200
- PASS GET /app.js: 200
- PASS GET /api/health: 200
- PASS Database URL is not public: 404
- PASS Valid request saved: 201
- PASS Same key retry returns original reference
- PASS Same key with different content: 409
- PASS Same origin and destination rejected: 400
- PASS Missing consent rejected: 400
- PASS Missing Origin rejected: 403
- PASS Only one row persisted after retry and invalid requests
- PASS All literal JavaScript element IDs exist in HTML
- PASS JavaScript syntax: node --check
- PASS Python syntax: ast.parse and module import
- NOT RUN graphical browser, mobile device, Windows, accessibility audit, security audit

Các kiểm tra HTTP dùng cơ sở dữ liệu tạm, không đóng gói dữ liệu liên hệ. Không phải chứng nhận production.
