# Định dạng bản đồ (.tmj)

Bản đồ nằm ở `data/maps/<id-khu-vực>.tmj` (Tiled JSON, ô 16×16), tileset `public/assets/tileset.png` (id tile ↔ chỉ số trong `public/assets/tileset.json`, gid = chỉ số + 1).

## Lớp
| Lớp | Loại | Dùng để |
|-----|------|---------|
| `ground` | tile | nền (sàn, đường, cỏ) |
| `walls` | tile | vật thể đứng (tường, cột, cây thân, ghế) |
| `collision` | tile, ẩn | ô nào khác 0 là **cản**; giá trị bất kỳ |
| `overlay` | tile | vẽ **đè lên nhân vật** (tán cây, mái vòm) |
| `objects` | object | sprite, exit, interact |

## Đối tượng (lớp `objects`, tọa độ pixel, góc trái-trên)
- `type: "sprite"`: property `frame` (string) = tên khung trong `sprites.json`. Chỉ trang trí; muốn cản thì đánh dấu ô ở lớp `collision`.
- `type: "exit"`: `name` = `id` của exit trong `data/areas.json`. Vùng chữ nhật; nhân vật chạm vào thì chuyển khu vực. Các ô của vùng phải không cản.
- `type: "interact"`: properties
  - `kind`: `"text"` (chỉ hiện chữ) hoặc `"activity"` (hoạt động tiêu khoảng)
  - `text`: nội dung hộp thoại
  - `label`: tên hành động (bắt buộc với `activity`, ví dụ "Ngồi nghỉ")
  - `cost`: số nguyên ≥ 0, số khoảng tiêu (chỉ `activity`)
  Vùng chữ nhật nên rộng hơn vật thể 1 ô để người chơi đứng cạnh được.

## Điểm xuất hiện (spawn)
Nằm trong `data/areas.json` (theo ô), **không** đặt trong .tmj, để chỉ có một nguồn. Ghi chú: lệch nhẹ so với FR3.2 của spec, theo ADR 002/tasks T5.

## Công cụ
- `npm run gen-maps` sinh bản đồ khởi đầu từ `tools/gen-maps.ts` (thư viện `tools/maps-lib.ts`). Sau khi chỉnh tay trong Tiled, đừng chạy lại cho bản đồ đó.
- `npm run render-maps` vẽ ảnh xem trước vào `previews/<id>.png` và `<id>_debug.png` (đỏ = cản, xanh lá = exit, vàng = interact).
- `tests/maps.test.ts` kiểm tra: lớp bắt buộc, kích thước, gid hợp lệ, exit khớp `areas.json`, spawn không bị cản, thuộc tính interact.
