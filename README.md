# Hồi Trống Cuối

Game pixel art hoài niệm lấy cảm hứng từ ngôi trường cấp ba Trần Phú. Nhân vật trở về trường cũ, tiếng trống vang lên và tỉnh dậy trong năm lớp 12. Ý tưởng đầy đủ nằm ở [idea.md](idea.md); dự án làm theo Spec Driven Development (tài liệu ở [docs/](docs/)).

Trạng thái hiện tại: **khung game** (feature `khung-game-va-ban-do`): đi lại trong 6 khu vực, chuyển khu vực, vòng lặp ngày/khoảng, điều khiển bàn phím và cảm ứng. Chưa có hội thoại, NPC, lưu bút, mini-game.

## Chạy

Cần Node 22 trở lên.

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`. Xem thẳng một khu vực (chỉ khi chạy dev): `?area=san-chinh` (các id khác: `cong-truong`, `hanh-lang-lop-12`, `hanh-lang-lop-10`, `san-the-chat`, `san-thuong`). Đặt thời gian để xem NPC/mưa (chỉ dev): `?day=5&period=0` (Ngày 5 mưa; kết hợp `&area=cong-truong`). Thử giao diện cảm ứng trên máy tính: `?touch=1`.

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
npm run e2e         # kiểm thử end-to-end bằng trình duyệt thật (Playwright), xem mục bên dưới
npm run build       # kiểm tra kiểu + build ra thư mục dist/
npm run preview     # chạy thử bản build
npm run gen-assets  # sinh lại tileset và sprite (tools/gen-assets.ts)
npm run gen-maps    # sinh lại bản đồ khởi đầu (tools/gen-maps.ts) — GHI ĐÈ các .tmj
npm run render-maps # vẽ ảnh xem trước bản đồ vào docs/features/khung-game-va-ban-do/previews/
```

Bản build trong `dist/` là tệp tĩnh, có thể đưa lên bất kỳ máy chủ web tĩnh nào (đường dẫn tương đối).

### Kiểm thử end-to-end (Playwright)

Lần đầu trên máy mới: `npm install` rồi `npx playwright install chromium` (~100 MB, lưu ở cache của người dùng, không nằm trong repo). Sau đó `npm run e2e`.

- Playwright tự bật dev server ở cổng riêng **5199** (không dùng lại server nào đang chạy) và tự tắt khi xong. Cổng 5199 phải rảnh.
- Phải chạy trên **dev server** vì `?area=&day=&period=` và `window.__game` chỉ có ở chế độ dev.
- Kịch bản nằm trong `e2e/*.e2e.ts` (đuôi `.e2e.ts` để vitest không nhặt nhầm): `hoi-thoai.e2e.ts` (bàn phím, đi bộ thật tới Kiệt, 4 hành động của Huy, điều kiện flag, NPC thường, vòng lặp bác lao công) và `hoi-thoai-cam-ung.e2e.ts` (chạm thật qua CDP, kiểm bố cục hộp thoại so với D-pad). Sau mỗi test có kiểm tra không có `console.error`/`pageerror`.
- Một số test dịch người chơi tới cạnh NPC bằng `placePlayer` (đích ở dải hành lang tầng trên khó đi tới); riêng cảnh Kiệt đi bộ thật bằng phím.
- Kiểm kiểu cho e2e: `npx tsc -p e2e`.

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

## NPC, lịch, thời tiết

Nội dung NPC nằm trong `data/` (JSON + kiểm tra bằng zod khi khởi động, [ADR 004](docs/architecture/decisions/004-dinh-dang-du-lieu-noi-dung.md)):

- `data/npcs.json` — danh sách NPC: `id`, `name`, `kind` (`main`/`extra`), `frame` (khung sprite), `interactable`, `line` (câu thoại tối thiểu), `dialogue` (tùy chọn: id cây thoại, xem mục Hội thoại).
- `data/schedules.json` — lịch: mỗi mục `npc`, `day` (1–6), `period` (0–3), `area`, `x`, `y` (ô), `facing`; thêm `weather` (`sunny`/`rainy`) nếu chỉ áp dụng khi thời tiết đó.
- `data/weather.json` — thời tiết theo ngày (MVP: Ngày 5 mưa).

NPC đứng yên theo lịch, là vật cản (không đi xuyên), trò chuyện hiện thoại tối thiểu (không tiêu khoảng). Dữ liệu sai (NPC/khu vực không tồn tại, đặt vào ô tường, trùng lịch) sẽ báo lỗi chỉ rõ chỗ sai ngay khi khởi động. Xem thêm: [spec](docs/features/he-thong-npc-va-lich/spec.md), [GDD kịch bản](docs/product/kich-ban-mvp.md).

## Hội thoại nhánh

Mỗi file `data/dialogues/<id>.json` là **một cây thoại** (kiểm tra bằng zod + liên kết khi khởi động). NPC có trường `dialogue` thì bấm Tương tác sẽ chạy cây thoại thay cho câu `line`. Hội thoại **không tiêu khoảng**.

```json
{
  "id": "vi-du",
  "nodes": [
    { "id": "mo-dau", "speaker": "kiet", "lines": ["Ê Thiện!"], "next": "chon" },
    {
      "id": "chon", "speaker": "narration", "lines": ["Mình nên đáp thế nào?"],
      "choices": [
        { "label": "Đùa lại", "effects": { "setFlags": { "ngay1.dua-lai": true } }, "goto": "end" },
        { "label": "Nhắc chuyện cũ", "isAction": true, "condition": { "flag": "ngay1.dua-lai" }, "goto": "end" }
      ]
    }
  ]
}
```

- Mỗi node có **một trong hai**: `next` (id node kế hoặc `"end"`) hoặc `choices` (tối đa **4**). `speaker` là id NPC hoặc `"narration"`; `lines` là các trang chữ.
- Lựa chọn: `label`, `goto`, tùy chọn `isAction` (lựa chọn bằng hành động, hiện tiền tố `»`), `condition` (`flag` / `allOf` / `anyOf` / `not`; lựa chọn chưa thỏa điều kiện bị ẩn), `effects.setFlags` (đặt cờ cốt truyện).
- Cờ nằm trong `GameState.flags` (lưu bản 2; save bản 1 được tự nâng cấp). Node mà mọi lựa chọn đều ẩn đi tiếp `fallbackGoto` hoặc kết thúc, nên không bao giờ kẹt; vòng lặp không có lối ra sẽ bị loader báo lỗi.
- **Sau khi sửa hoặc thêm hội thoại, chạy `npm test`**: loader chỉ bắt được lỗi cấu trúc, còn test tự duyệt mọi tổ hợp cờ trên mọi cây trong `data/dialogues` để bắt chỗ kẹt (kể cả khi lối thoát duy nhất là một lựa chọn có điều kiện).
- Giới hạn hiển thị (có test canh): mỗi trang thoại ≤ 100 ký tự, nhãn lựa chọn ≤ 34 ký tự, lời dẫn của node 4 lựa chọn ≤ 56 ký tự (1 dòng, để hộp không đè D-pad cảm ứng).
- Chỉ số quan hệ (`effects.relationship`, điều kiện `relationship`) đã chừa chỗ trong schema nhưng **chưa áp dụng** (feature quan hệ); điều kiện `relationship` hiện coi là thỏa.
- Ví dụ thật: `data/dialogues/` (Kiệt mở đầu, "Huy bị nghi", bác lao công). Xem [spec](docs/features/he-thong-hoi-thoai/spec.md).

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
