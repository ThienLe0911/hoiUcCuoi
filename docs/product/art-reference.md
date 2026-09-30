# Tham chiếu đồ họa — trường Trần Phú (BẢN NHÁP, chờ duyệt)

Ảnh nằm trong `reference/`. Chỉ dùng làm tham khảo để tự vẽ sprite/tile, không dùng lại trực tiếp ảnh.

| Ảnh | Nội dung |
|-----|----------|
| ref-01 | Ảnh pixel gốc của người dùng: cổng, xe buýt 67, kem, cháo lòng |
| ref-02 | Dãy nhà 3–4 tầng nhìn từ vườn cây: hành lang mở, cột xanh, chậu bonsai, tháp chùa phía xa |
| ref-03 | Cổng thật: mái vòm trắng, bảng nâu, băng rôn đỏ, cổng sắt xanh, tường thấp có họa tiết thoi xanh |
| ref-04 | Toàn cảnh từ trên cao: sân giữa nhiều cây lớn, mái tôn xanh dài, mái ngói đỏ |
| ref-05 | Hành lang: cột xanh, lan can xanh ngọc, sàn gạch kem, ống cứu hỏa đỏ |
| ref-06 | Dãy nhà 4–5 tầng nhìn từ sân, hàng cây cao, cột xanh |
| ref-07 | Sân thể chất trong nhà: sân xanh dương, khung rổ MILO, ban công xanh nhạt bao quanh |
| ref-08 | Nhà thi đấu/sân thể chất có mái lưới xanh, lan can, học sinh chơi |
| ref-09 | Sân chính: nhà 3 tầng, lối vào giữa có tượng, cờ đỏ, biển "RÈN ĐỨC – LUYỆN TÀI" |
| ref-10 | Lớp học: tường gạch kem, bảng trắng, rèm xanh lá, bàn ghế gỗ, quạt trần |

## Bảng màu gợi ý (ước lượng từ ảnh, sẽ chốt lại khi làm POC)
- Tường: vàng kem (#E8D9A8 – #F2E6BC)
- Cột và đường viền: xanh da trời nhạt (#6FA8DC – #8FC1E8)
- Khung cửa, lan can: xanh ngọc (#2E9C94 – #3DB5A8)
- Cổng sắt và sân thể chất: xanh dương (#2F6FC2)
- Sàn hành lang: kem xám (#D9D2C0)
- Điểm nhấn: đỏ (cờ, băng rôn, ống cứu hỏa), cây xanh đậm, bàn ghế nâu gỗ
- Ban đêm ("trường ký ức"): đổi tông sang xanh tím

## Đặc điểm kiến trúc cần giữ
- Nhà 3–5 tầng (số tầng từng dãy cần người dùng xác nhận), hành lang ngoài mở, cột xanh đều đặn, lan can xanh ngọc.
- Sân giữa lớn có cây cổ thụ, nhà bao quanh; sân thể chất xanh dương có rổ bóng rổ.
- Cổng: mái vòm cong, bảng tên, cổng sắt xanh; tường thấp gạch kem có họa tiết thoi xanh.
- Bảng tên khẩu hiệu "RÈN ĐỨC – LUYỆN TÀI", cờ đỏ, tượng ở lối vào chính.
- Lớp học: tường dưới gạch kem, quạt trần, rèm xanh lá, bàn ghế gỗ ghép đôi.
- Đồng phục: áo trắng, nữ váy caro và cà vạt, nam quần xám.
- Ngoài trường: xe buýt 67, xe kem, xe cháo lòng, xe máy.

## Ánh xạ khu vực MVP (người dùng đã duyệt 2026-09-30, cập nhật: 6 khu vực)
1. Cổng trường và hàng quán (ref-01, 03)
2. Sân chính (ref-09, 06)
3. Hành lang lớp 12, dãy phía bắc, 3 tầng (ref-05, 10)
4. Hành lang lớp 10, dãy phía nam, 3 tầng (thêm 2026-09-30)
5. Sân thể chất (ref-07, 08)
6. Sân thượng hoặc dãy phòng cũ bị khóa (dùng cho phiên ban đêm)

## Kỹ thuật đồ họa
- Đã chốt: tile 16×16 px, nhân vật khoảng 16×24 px (theo ADR 001).
- Vì chưa có asset: làm bộ tile và sprite khởi đầu bằng pixel art tự tạo (script sinh hoặc vẽ tay bằng Aseprite/Piskel), thay dần về sau.
