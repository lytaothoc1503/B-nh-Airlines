# Báo cáo khởi tạo: Website hãng hàng không Bay Cùng Bảnh – Bay Cùng Bố (Bảnh Fuli)
## Mục tiêu
Thiết kế giao diện tìm kiếm một chiều/khứ hồi và tiếp nhận yêu cầu tìm vé.
## Phạm vi
HTML/CSS/JavaScript; Python standard library; SQLite. Chỉ 3 sân bay nội địa,
người lớn, dữ liệu chuyến mẫu. Backend cục bộ lưu liên hệ thực do người dùng nhập.
## Thiết kế
Frontend không gọi dịch vụ ngoài. API POST /api/requests kiểm tra dữ liệu,
khóa gửi lại và lưu giao dịch SQLite. GET chỉ công khai tài nguyên trong whitelist.
## Dữ liệu
Bảng requests lưu reference, request_key, payload_hash, thời gian, trạng thái,
tên, điện thoại, sân bay, ngày bay, số người và thời điểm đồng ý.
Không có thông tin thẻ, căn cước/hộ chiếu hay dữ liệu xuất vé.
## Kết quả và giới hạn
Đây là báo cáo khởi tạo theo mã nguồn, không chứng nhận đã vận hành thương mại.
Các chức năng chưa triển khai và kiểm thử chưa thực hiện nằm trong CURRENT_STATE.md.
## Hướng phát triển
Quản trị có xác thực, chính sách dữ liệu, provider API, giá/tồn chỗ thực,
quy trình giữ chỗ-xuất vé và thanh toán được xác minh máy chủ, triển khai HTTPS.
