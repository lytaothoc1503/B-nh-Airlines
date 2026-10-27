# Trạng thái hiện tại — 1.2

## Đã hoàn tất

- Trang chủ có tiêu đề/hero mới và sáu thẻ điểm đến; hộp thoại điểm đến vẫn dẫn về biểu mẫu tìm chuyến hiện có.
- Giữ tìm chuyến một chiều/khứ hồi, sắp xếp, chọn chuyến, thông tin chuyến bay và gửi yêu cầu tư vấn.
- Máy chủ cục bộ chấp nhận sáu mã sân bay; yêu cầu tiếp tục được kiểm tra và lưu SQLite, không lưu giá/chuyến mẫu.
- `BANHFULI10` giảm 10% trên giá mẫu ở trình duyệt; không phải ưu đãi, báo giá hoặc thanh toán thật.
- Có responsive desktop/điện thoại, minh họa CSS, Anime.js cục bộ và hỗ trợ reduced motion.
- Luồng điểm đến, tìm chuyến một chiều/khứ hồi, thông tin chuyến, mã mẫu và kiểm tra mobile đã chạy; xem [TEST_RESULTS.md](./TEST_RESULTS.md).

## Còn thiếu

- Chưa xác nhận trên điện thoại vật lý hoặc qua kiểm thử bảo mật production.
- Tài khoản, quản trị yêu cầu, email/SMS, API hãng, tồn chỗ, thanh toán, ghế/hành lý và đổi/hủy/hoàn tiền chưa triển khai.

## Đang bị chặn

- Chưa thể đưa biểu mẫu tiếp nhận yêu cầu lên production: Cloudflare Pages hiện chỉ phục vụ tệp tĩnh, không chạy `server.py` hoặc SQLite. Không thu thập thông tin liên hệ trên bản Pages.
- Triển khai production cần backend riêng, xác thực/phân quyền, chính sách dữ liệu và kiểm thử bảo mật trước khi nhận thông tin khách hàng.
