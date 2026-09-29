# Giấy phép asset

## Font: VT323 (chọn 2026-09-30)
- Tệp: `public/assets/fonts/VT323-Regular.ttf`, giấy phép `VT323-OFL.txt`.
- Nguồn: https://github.com/google/fonts/tree/main/ofl/vt323 (Google Fonts, tác giả Peter Hull).
- Giấy phép: SIL Open Font License 1.1: được dùng trong game phát hành và phân phối kèm, không được bán riêng font; giữ nguyên tệp giấy phép khi phân phối.
- Kiểm tra: đủ 134/134 ký tự tiếng Việt có dấu (chữ hoa/thường với 5 dấu thanh, Ă Â Ê Ô Ơ Ư Đ) bằng fontTools (cmap). Trang thử: `public/font-test.html`.

### Ứng viên đã loại (thiếu ký tự tiếng Việt, cùng kiểm tra cmap)
| Font | Thiếu / 134 |
|------|-------------|
| Tiny5 | 74 |
| Pixelify Sans | 92 |
| Press Start 2P | 94 |
| Jersey 10, Jersey 15, Micro 5 | 96 |
| Silkscreen, DotGothic16 | 102 |

## Đồ họa (tileset, sprite)
Tự tạo bằng `tools/gen-assets.ts`, không dùng lại ảnh tham chiếu hay ảnh của TP Media. Không cần giấy phép bên thứ ba.

## Lưu ý dùng font
Kiểm tra bằng `public/font-test.html`: VT323 đọc tốt ở 12 px trở lên, chấp nhận được ở 10 px; ở 8 px các dấu tiếng Việt dính nhau, không nên dùng. Đề xuất: thoại và HUD dùng 12 px (tối thiểu 10 px).
