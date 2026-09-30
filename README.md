# Hồi Trống Cuối

Game pixel art hoài niệm lấy cảm hứng từ ngôi trường cấp ba Trần Phú. Nhân vật trở về trường cũ, tiếng trống vang lên và tỉnh dậy trong năm lớp 12. Ý tưởng đầy đủ nằm ở [idea.md](idea.md); dự án làm theo Spec Driven Development (tài liệu ở [docs/](docs/)).

Trạng thái hiện tại: **khung game** (feature `khung-game-va-ban-do`): đi lại trong 6 khu vực, chuyển khu vực, vòng lặp ngày/khoảng, điều khiển bàn phím và cảm ứng. Chưa có hội thoại, NPC, lưu bút, mini-game.

## Chạy

Cần Node 22 trở lên.

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`. Xem thẳng một khu vực (chỉ khi chạy dev): `?area=san-chinh` (các id khác: `cong-truong`, `hanh-lang-lop-12`, `hanh-lang-lop-10`, `san-the-chat`, `san-thuong`). Thử giao diện cảm ứng trên máy tính: `?touch=1`.

Thử trên điện thoại qua Wi-Fi nội bộ:

```bash
npm run dev -- --host
```

## Điều khiển

| Hành động | Bàn phím | Cảm ứng |
|-----------|----------|---------|
| Đi | WASD hoặc mũi tên | D-pad ảo (bên trái) |
| Tương tác / qua trang thoại | E hoặc Space | Nút OK (bên phải) |
| Menu tạm dừng | Esc | Nút Menu (góc trên phải) |

Trên điện thoại hãy xoay ngang. Trong menu có "Nghỉ/Chờ" để bỏ qua một khoảng.

## Cách chơi (khung hiện tại)

- Mỗi ngày có 4 khoảng: Trước giờ học, Trong giờ học, Giờ ra chơi, Sau giờ học. Một tuần trong game gồm 6 ngày học (Thứ Hai đến Thứ Bảy).
- Đi lại giữa các khu vực **không** tốn thời gian. Chỉ hoạt động (ví dụ "Ngồi nghỉ" ở băng ghế) hoặc "Nghỉ/Chờ" mới qua một khoảng.
- Hết khoảng cuối thì sang ngày mới, luôn bắt đầu ở cổng trường. Hết ngày thứ 6 game dừng ở màn hình giữ chỗ.
- Sân thượng đang bị khóa (sẽ mở ở feature sau).

## Lệnh

```bash
npm test            # kiểm thử đơn vị (vitest)
npm run build       # kiểm tra kiểu + build ra thư mục dist/
npm run preview     # chạy thử bản build
npm run gen-assets  # sinh lại tileset và sprite (tools/gen-assets.ts)
npm run gen-maps    # sinh lại bản đồ khởi đầu (tools/gen-maps.ts) — GHI ĐÈ các .tmj
npm run render-maps # vẽ ảnh xem trước bản đồ vào docs/features/khung-game-va-ban-do/previews/
```

Bản build trong `dist/` là tệp tĩnh, có thể đưa lên bất kỳ máy chủ web tĩnh nào (đường dẫn tương đối).

## Cấu trúc

```
src/core/     logic thuần, không phụ thuộc Phaser: thời gian, trạng thái, hành động đầu vào, cảm ứng
src/data/     nạp và kiểm tra dữ liệu (zod)
src/scenes/   Boot, Title, Area (cảnh một khu vực)
src/ui/       HUD, hộp thoại, menu, màn hình phủ, điều khiển cảm ứng
data/         areas.json (khu vực, lối nối) và maps/*.tmj (bản đồ Tiled)
public/assets/  tileset.png/json, sprites.png/json, fonts/
tools/        script sinh asset và bản đồ
tests/        kiểm thử
docs/         vision, kiến trúc (ADR), sản phẩm, spec/tasks của từng feature
```

## Sửa bản đồ

Bản đồ là file Tiled JSON (`data/maps/<id>.tmj`, ô 16×16). Định dạng lớp và đối tượng: [map-format.md](docs/features/khung-game-va-ban-do/map-format.md).

- Cách nhanh: mở file `.tmj` bằng [Tiled](https://www.mapeditor.org/), chỉnh rồi lưu. Vẫn dùng tileset `public/assets/tileset.png`.
- Cách bằng code: sửa `tools/gen-maps.ts` rồi `npm run gen-maps`. Lệnh này **ghi đè** tất cả `.tmj`, đừng chạy nếu bạn đã chỉnh tay trong Tiled.
- Lối nối khu vực, điểm xuất hiện, khu vực khóa: `data/areas.json`. Dữ liệu sai sẽ hiện lỗi chỉ rõ chỗ sai ngay khi khởi động game.
- Sau khi sửa, chạy `npm test` (kiểm tra cấu trúc bản đồ) và `npm run render-maps` (xem ảnh).

## Thay đồ họa

Tile và sprite hiện là bản khởi đầu tự tạo bằng `tools/gen-assets.ts`. Muốn thay bằng bản vẽ tay (Aseprite, Piskel...):

1. Giữ đúng bố cục ô: `tileset.png` lưới 16 cột, ô 16×16; thứ tự ô theo `public/assets/tileset.json`.
2. Với sprite, giữ nguyên tên khung và kích thước trong `public/assets/sprites.json` (hoặc sửa file json cho khớp).
3. Đừng chạy `npm run gen-assets` sau khi đã thay ảnh (sẽ ghi đè).

## Font và giấy phép

Font VT323 (SIL OFL 1.1), đủ ký tự tiếng Việt có dấu. Chi tiết và lưu ý cỡ chữ: [assets-licenses.md](docs/product/assets-licenses.md). Đồ họa tự tạo, không dùng lại ảnh tham chiếu. Ảnh trong `docs/product/reference/` chỉ để tham khảo, **không đưa vào bản phát hành**.

## Tài liệu

- Tầm nhìn: [docs/vision/vision.md](docs/vision/vision.md)
- Quyết định kiến trúc: [docs/architecture/decisions/](docs/architecture/decisions/README.md)
- Spec, tasks của khung game: [docs/features/khung-game-va-ban-do/](docs/features/khung-game-va-ban-do/)
