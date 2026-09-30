# Tasks: khung-game-va-ban-do

- Trạng thái: **Approved** (người dùng duyệt 2026-09-30; đã duyệt vitest, pngjs, git init, chạy song song bằng subagent)
- Ngày: 2026-09-30
- Căn cứ: spec.md (Approved), ADR 001–003 (Accepted)
- Thư mục dự án: gốc `gameHocsinhTranphu/` (hiện chưa là git repo; xem Câu hỏi mở)

## Cấu trúc thư mục đề xuất
```
package.json, tsconfig.json, vite.config.ts, index.html
src/
  main.ts, config.ts
  core/    time.ts, state.ts, actions.ts        (logic thuần, không import Phaser)
  data/    schema.ts, loader.ts                 (zod + nạp dữ liệu)
  scenes/  BootScene.ts, TitleScene.ts, AreaScene.ts
  ui/      Hud.ts, Dialog.ts, TouchControls.ts, PauseMenu.ts
data/      areas.json, maps/*.tmj
public/assets/  tileset.png, sprites.png, fonts/
tools/     gen-assets.ts                        (script sinh asset)
tests/     *.test.ts
```

## Thư viện cần duyệt (theo PM Charter mục 1)
Đã duyệt qua ADR: `phaser`, `typescript`, `vite`, `zod`.
**Chưa duyệt, cần bạn cho phép:**
- `vitest` — chạy kiểm thử đơn vị (NFR6), cùng hệ Vite.
- `pngjs` (devDependency) — script sinh asset ghi file PNG (T7, T8).

## Quy ước mỗi task
Atomic, kiểm chứng được, ghi rõ file tạo/sửa và điều kiện xong. Chưa có code sản phẩm nào tồn tại nên không có blast radius với code cũ.

---

### T1. Khởi tạo project
- Phụ thuộc: duyệt thư viện.
- Làm: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html` (canvas, CSS `image-rendering: pixelated`, nền đen); `src/main.ts` + `src/config.ts` tạo Phaser game 320×180, scale FIT theo số nguyên, letterbox; scripts `dev`, `build`, `test`.
- Xong khi: `npm run dev` hiện khung đen 16:9 đúng tỉ lệ; `npm run build` thành công. (FR1.1, FR1.2, AC10 một phần)

### T2. Chọn font tiếng Việt có dấu (POC)
- Phụ thuộc: T1.
- Làm: tìm font pixel hỗ trợ đủ dấu tiếng Việt, giấy phép cho phép phát hành (OFL hoặc tương đương); nếu không có font phù hợp, đề xuất tự tạo bitmap font. Đặt vào `public/assets/fonts/`, ghi nguồn và giấy phép vào `docs/product/assets-licenses.md`. Trang thử hiển thị chuỗi có mọi chữ cái có dấu (ví dụ "Ắ Ằ Ẳ Ẵ Ặ Ữ Ứ Ừ Ử Ự ỡ ẫ …") ở cỡ 8–10 px trên 320×180.
- Xong khi: mọi dấu hiển thị đúng và đọc được; bạn xem ảnh chụp và duyệt font. (FR5.2, FR5.3)
- Ghi chú: nếu phải chọn font phi-OFL hoặc tự tạo, báo bạn quyết.

### T3. Module thời gian (logic thuần)
- Phụ thuộc: T1.
- Làm: `src/core/time.ts`: 4 khoảng, ngày 1..N (N từ cấu hình, MVP=6), thứ Hai→Thứ Bảy, `advancePeriod()`, phát sự kiện `khoảng-đổi`, `ngày-đổi`, `hết-thời-gian`; sau khoảng thứ 4 chuyển sang ngày sau, khoảng 0.
- Kiểm thử `tests/time.test.ts`: đúng thứ tự khoảng, sang ngày, thứ trong tuần, sự kiện hết thời gian ở ngày N, không vượt quá N.
- Xong khi: test đạt. (FR4.1, FR4.2, FR4.5, FR4.6, FR4.8, AC6, AC7, AC9)

### T4. Trạng thái game tuần tự hóa được
- Phụ thuộc: T3.
- Làm: `src/core/state.ts`: `GameState` gồm `version`, ngày, khoảng, khu vực hiện tại, vị trí, cờ khóa khu vực (`san-thuong` khóa mặc định); `serialize()`/`deserialize()` JSON.
- Kiểm thử `tests/state.test.ts`: round-trip JSON, có `version`, mặc định sân thượng khóa, bắt đầu ở `cong-truong` ngày 1 khoảng 0.
- Xong khi: test đạt. (FR7.1, BR3, AC11)

### T5. Schema và trình nạp dữ liệu khu vực
- Phụ thuộc: T1.
- Làm: `src/data/schema.ts` (zod cho `areas.json`: id, tên, file map, spawn, exits gồm đích và điểm xuất hiện đích, điều kiện khóa); `src/data/loader.ts` kiểm tra và báo lỗi rõ (file, trường, lý do), kiểm tra tham chiếu chéo (exit trỏ tới khu vực có thật, file map tồn tại). Tạo `data/areas.json` cho 5 khu vực theo đồ thị FR3.6 (`san-thuong` khóa).
- Kiểm thử `tests/areas.test.ts`: dữ liệu đúng qua; sai (thiếu trường, đích không tồn tại, map không tồn tại) bị bắt kèm thông báo chỉ đúng chỗ.
- Xong khi: test đạt. (FR3.5, FR3.6, FR3.7, BR5, AC8, AC9)

### T6. Lớp hành động đầu vào và bàn phím
- Phụ thuộc: T1.
- Làm: `src/core/actions.ts` (lên/xuống/trái/phải/tương tác/menu, giữ trạng thái nhấn, không phụ thuộc thiết bị); bộ nghe bàn phím WASD, mũi tên, E, Space, Esc gắn vào lớp này.
- Kiểm thử đơn vị: nhấn/nhả, hai hướng cùng lúc chỉ lấy một (không đi chéo), nhiều nguồn cùng ánh xạ vào một hành động.
- Xong khi: test đạt. (FR2.3, FR2.5)

### T7. Script sinh tileset
- Phụ thuộc: T1, duyệt `pngjs`.
- Làm: `tools/gen-assets.ts` (phần tile) sinh `public/assets/tileset.png` với ô 16×16 theo FR6.1 và bảng màu trong art-reference.md; file `tools/tileset-index.md` (hoặc JSON) ghi tên và tọa độ mỗi tile, ổn định để thay bằng bản vẽ tay.
- Xong khi: mở ảnh thấy đủ danh sách tile trong FR6.1, bạn xem và duyệt phong cách. (FR6.1, FR6.3, FR6.4)
- Song song được với: T3–T6 (không chung file).

### T8. Script sinh sprite
- Phụ thuộc: T7 (dùng chung script và bảng màu).
- Làm: sinh `public/assets/sprites.png` + khai báo khung hình: nhân vật chính 16×24 (4 hướng, đi 4 khung, đứng yên), xe buýt 67, xe kem, xe cháo lòng, 1–2 học sinh nền.
- Xong khi: mở ảnh thấy đủ sprite theo FR6.2, tên khung ổn định; bạn duyệt. (FR6.2, FR6.3)

### T9. Bản đồ mẫu `cong-truong` (lát cắt dọc)
- Phụ thuộc: T5, T7, T8.
- Làm: `data/maps/cong-truong.tmj` (tile 16×16; lớp nền, vật thể/va chạm, phủ trên đầu, đối tượng `spawn`, `exit`, `interact`) dựng theo ref-01 và ref-03; đặt xe buýt 67, xe kem, xe cháo lòng, học sinh nền, băng ghế "Ngồi nghỉ", biển tên. Ghi cấu trúc lớp/đối tượng vào `docs/features/khung-game-va-ban-do/map-format.md`.
- Xong khi: mở được trong Tiled, đúng lớp; qua kiểm tra của loader T5. (FR3.1, FR3.2)

### T10. AreaScene: nạp bản đồ, di chuyển, va chạm, camera
- Phụ thuộc: T4, T6, T9.
- Làm: `src/scenes/AreaScene.ts` nạp map theo `areas.json`; nhân vật 4 hướng có hoạt ảnh; va chạm với lớp va chạm; camera bám nhân vật, căn giữa nếu khu nhỏ hơn màn hình.
- Xong khi: bằng WASD đi lại trong `cong-truong`, không xuyên tường/xe/quầy, camera đúng. (FR2.1, FR2.2, FR2.6, AC2 một phần)

### T11. Hộp thoại tối thiểu và điểm tương tác
- Phụ thuộc: T2, T10.
- Làm: `src/ui/Dialog.ts` (một/nhiều dòng, bấm tương tác để qua dòng, dùng font T2); AreaScene phát hiện điểm `interact` gần nhân vật (E/Space) và chạy: hiện dòng chữ (biển tên), hoặc hoạt động có `cost` (chưa gắn thời gian ở task này, chỉ gọi hàm).
- Xong khi: bấm E cạnh biển hiện chữ đúng dấu; bấm E lần nữa đóng hộp. (FR5.1, FR4.9 một phần, AC2)

### T12. Bốn bản đồ còn lại
- Phụ thuộc: T9.
- Làm: `san-chinh` (ref-09, 06), `hanh-lang-lop-12` (ref-05, 10), `san-the-chat` (ref-07, 08), `san-thuong` (khóa), đủ đối tượng `exit` và `spawn` theo đồ thị FR3.6; có ít nhất một băng ghế "Ngồi nghỉ".
- Xong khi: cả 5 map qua kiểm tra loader; mở được trong Tiled. (FR3.1, FR3.6, AC4 một phần)

### T13. Chuyển khu vực, tên khu vực, khu vực khóa
- Phụ thuộc: T11, T12.
- Làm: đi vào `exit` → mờ dần ≤ 0,5 s → nạp khu vực đích tại điểm xuất hiện đích; hiện tên khu vực vài giây; exit vào khu vực khóa hiện "Bị khóa" và không chuyển.
- Xong khi: đi vòng qua các khu vực theo đồ thị, đi ngược lại được; sân thượng báo "Bị khóa". (FR3.3, FR3.4, FR3.5, AC4)

### T14. HUD, thời gian và menu tạm dừng
- Phụ thuộc: T3, T4, T13.
- Làm: `src/ui/Hud.ts` hiện "Ngày X · Thứ · Tên khoảng" và tên khu vực; hoạt động `cost: 1` gọi `advancePeriod()`; `src/ui/PauseMenu.ts` (Esc/nút menu) có "Tiếp tục" và "Nghỉ/Chờ" (bỏ qua một khoảng); qua khoảng thứ 4 hiện tổng kết "Hết ngày X" rồi sang ngày mới, nhân vật về `cong-truong`; hết ngày 6 hiện màn hình giữ chỗ "hết thời gian" và tạm dừng. Đi lại không tiêu khoảng.
- Xong khi: chạy trọn 6 ngày bằng "Ngồi nghỉ" và "Nghỉ/Chờ", thứ và khoảng đúng, không lỗi. (FR4.3–FR4.7, FR4.9, BR1, BR2, BR3, AC5, AC6, AC7)

### T15. Điều khiển cảm ứng
- Phụ thuộc: T6, T10.
- Làm: `src/ui/TouchControls.ts`: D-pad ảo trái, nút Tương tác phải, nút menu; multi-touch; nút ≥ 44 px CSS; chỉ hiện trên thiết bị cảm ứng; đẩy vào lớp hành động T6.
- Xong khi: trên giả lập cảm ứng (và điện thoại thật nếu có), điều khiển như bàn phím; giữ D-pad + bấm Tương tác cùng lúc vẫn chạy. (FR2.4, AC3)

### T16. Màn hình tiêu đề, luồng scene, nhắc xoay ngang
- Phụ thuộc: T2, T14.
- Làm: `BootScene` (nạp asset), `TitleScene` ("Hồi Trống Cuối", nút Bắt đầu), chuyển sang AreaScene; trên màn dọc trên mobile hiện nhắc xoay ngang.
- Xong khi: luồng Boot → Title → Game chạy; tiêu đề hiển thị dấu đúng. (FR1.3, FR1.4, AC1)

### T17. Hoàn thiện và kiểm tra tổng
- Phụ thuộc: tất cả.
- Làm: `README.md` (cách chạy, build, sửa bản đồ bằng Tiled, thay asset); chạy `npm test`, `npm run build`, đo dung lượng bản build; thử bản build qua máy chủ tĩnh.
- Xong khi: test đạt, build đạt, dung lượng ≤ 5 MB. (NFR1, NFR2, NFR3, AC9, AC10)

---

## Thứ tự và song song
Đường chính: T1 → (T3 → T4) ∥ T5 ∥ T6 ∥ T2 ∥ (T7 → T8) → T9 → T10 → T11 → T12 → T13 → T14 → T15 → T16 → T17.
Các nhóm độc lập, không chung file (dùng được subagent `dev` song song, mỗi cái một git worktree nếu bạn cho phép): {T3, T4}, {T5}, {T6}, {T2}, {T7, T8}. Còn lại tuần tự. Theo PM Charter, tôi sẽ **hỏi bạn** trước khi bật subagent; mặc định tôi tự làm tuần tự.

## Câu hỏi mở (cần bạn quyết)
1. Duyệt thêm hai thư viện: `vitest`, `pngjs`?
2. Dự án chưa là git repo. Bạn muốn tôi `git init` không? (Cần cho worktree song song và để commit/theo dõi thay đổi.)
3. Task nào bạn muốn tôi dừng lại xin duyệt giữa chừng? Đề xuất dừng ở T2 (font), T8 (xem asset), T12 (xem bản đồ).

## Tiến độ (cập nhật 2026-09-30)
Xong: T1–T14 (bản đồ và bố cục đã được duyệt; T14 HUD, thời gian, menu chờ duyệt). Còn: T15–T17.
Ghi chú: T12 làm trước T10/T11 vì game kiểm tra đủ file bản đồ khi khởi động. Sau khi duyệt, bố cục đổi (2026-09-30): thêm khu vực hanh-lang-lop-10 (MVP thành 6 khu vực), xem spec FR3.1, FR3.6, FR3.8.
