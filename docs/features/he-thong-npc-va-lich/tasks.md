# Tasks: Hệ thống NPC và lịch (he-thong-npc-va-lich)

- Trạng thái: **Approved** (người dùng duyệt 2026-09-30; cho phép chạy song song bằng subagent `dev` trong git worktree riêng cho các cặp task độc lập T2∥T3, T4∥T6)
- Ngày: 2026-09-30
- Căn cứ: `spec.md` (Approved), GDD `docs/product/kich-ban-mvp.md` (Approved), ADR 001–004 (Accepted).

## Tiến độ (2026-09-30)
**Đã xong:** T1–T9, T11, T12 (84 test xanh, build 1,6 MB, kiểm chứng trực quan NPC + tương tác + mưa trong trình duyệt). T2∥T3 chạy bằng subagent `dev` (worktree), đã gộp. **Bỏ T10** (vẽ NPC trong preview — tùy chọn, không cần cho MVP). Nhánh: `feat/he-thong-npc-va-lich`.

## Thư viện
**Không cần thư viện mới.** Hạt mưa dùng particle sẵn có của Phaser; kiểm thử dùng `vitest` (đã có). Nếu phát sinh nhu cầu lib mới khi implement sẽ hỏi duyệt trước (PM Charter mục 1).

## Blast radius (file đã tồn tại sẽ sửa)
- `src/data/schema.ts`, `src/data/loader.ts` — thêm schema + nạp cho NPC/lịch/thời tiết. **Nhiều task đụng 2 file này → phải tuần tự phần schema.**
- `src/scenes/AreaScene.ts` — thêm đặt NPC, va chạm NPC, tương tác NPC, móc hiệu ứng mưa. **Nhiều task đụng file này → tuần tự.**
- `src/ui/Dialog.ts` — dùng lại (không đổi API nếu tránh được); nếu phải đổi, kiểm tra nơi gọi.
- `tools/gen-assets.ts`, `tools/render-maps.ts` — thêm sinh sprite NPC / vẽ NPC xem trước.
- Tra tham chiếu trước khi sửa từng symbol (grep) ngay trong task, báo lại nếu rộng hơn dự kiến.

## File mới (dự kiến)
```
data/npcs.json, data/weather.json, data/schedules.json
src/core/weather.ts        (logic thuần: thoiTietCuaNgay)
src/core/schedule.ts       (logic thuần: tra cứu lịch, tập NPC theo khu vực)
src/ui/Rain.ts             (hiệu ứng mưa)
tests/npcs.test.ts, tests/weather.test.ts, tests/schedule.test.ts, tests/npc-flow.test.ts
```

## Quy ước mỗi task
Atomic, kiểm chứng được, ghi rõ file tạo/sửa, phụ thuộc, và điều kiện xong (kèm FR/AC liên quan). Ký hiệu **[∥]** = có thể chạy song song với task khác cùng nhóm (khác file).

---

### T1. Schema + loader cho NPC / lịch / thời tiết
- Phụ thuộc: —
- Sửa: `src/data/schema.ts`, `src/data/loader.ts` (grep nơi dùng loader trước khi sửa).
- Làm: định nghĩa 3 schema zod — `NpcSchema` (`id`, `ten`, `loai`: `chinh|phu`, `frame`, `tuongTacDuoc`, `thoai`), `WeatherSchema` (map `ngày 1..6 → nang|mua`), `ScheduleSchema` (mục `(npcId, ngày, khoảng) → {areaId,o{x,y},huong}|"vang"`, kèm điều kiện thời tiết tùy chọn). Thêm hàm nạp + kiểm tra, báo lỗi chỉ rõ file/trường.
- Xong khi: nạp dữ liệu hợp lệ trả về đúng kiểu; dữ liệu sai (thiếu trường, sai kiểu) ném lỗi rõ ràng. (FR1.1, FR1.4, FR2.1, FR3.1, NFR2)

### T2. Dữ liệu NPC — `data/npcs.json` [∥ T3]
- Phụ thuộc: T1.
- Tạo: `data/npcs.json` gồm **5 NPC chính** (Thư, Kiệt, Huy, Ngân Trinh, Nguyên) + **NPC phụ** (GDD mục 4), mỗi NPC có `frame`, `tuongTacDuoc`, và **câu thoại trung tính theo Phụ lục A của spec**. Tạo `tests/npcs.test.ts` kiểm tra nạp đạt + có đủ NPC chính + id không trùng.
- Xong khi: loader nạp `npcs.json` đạt; test xanh. (FR1.1–FR1.4, Phụ lục A)

### T3. Thời tiết — `data/weather.json` + `src/core/weather.ts` [∥ T2]
- Phụ thuộc: T1.
- Tạo: `data/weather.json` (Ngày 5 = `rainy`, còn lại `sunny`); `src/core/weather.ts` hàm thuần `weatherOfDay(table, day)`; `tests/weather.test.ts`. (Tên trường/giá trị tiếng Anh khớp `schema.ts`.)
- Xong khi: `weatherOfDay(table,5)==='rainy'`, các ngày khác `'sunny'`; test xanh. (FR3.1–FR3.3, BR5)

### T4. Lịch NPC — `data/schedules.json` + `src/core/schedule.ts`
- Phụ thuộc: T1, T2, T3.
- Tạo: `data/schedules.json` (lịch 5 NPC chính + NPC phụ theo bảng GDD mục 5; em lớp 10 "trú mưa" có mục điều kiện `rainy`); `src/core/schedule.ts` hàm thuần `npcPosition(schedules,npcId,day,period,weather)` → vị trí | `null` (vắng) và `npcsInArea(schedules,areaId,day,period,weather)` → danh sách NPC; `tests/schedule.test.ts`. (Tên/giá trị tiếng Anh khớp code.)
- Xong khi: tra cứu đúng theo dữ liệu; ngày mưa em lớp 10 có mặt, ngày nắng vắng; test xanh. (FR2.1–FR2.4, FR4.1, BR2)

### T5. Kiểm tra hợp lệ vị trí lịch
- Phụ thuộc: T4.
- Sửa/Thêm: hàm kiểm tra (trong `src/data/loader.ts` hoặc `src/core/schedule.ts`) đọc bản đồ + `areas.json`: mọi vị trí lịch phải trong bản đồ, **không rơi ô cản**, **không chặn ô `exit`/lối 1 ô**, và `npcId`/`areaId` tồn tại. Bổ sung ca test vào `tests/schedule.test.ts`.
- Xong khi: đặt NPC vào ô cản/chặn exit hoặc `npcId` sai → báo lỗi rõ; dữ liệu đúng thì qua. (FR2.3, FR4.3, AC6, BR3)

### T6. Sprite NPC (tự tạo) — `tools/gen-assets.ts` [∥ T4/T5]
- Phụ thuộc: T2 (tên `frame`).
- Sửa: `tools/gen-assets.ts` sinh thêm khung NPC (nhuộm lại/biến thể sprite học sinh cơ sở), tên khung ổn định khớp `frame` trong `npcs.json`; cập nhật `sprites.png`/`sprites.json`.
- Xong khi: `npm run gen-assets` tạo đủ khung; 5 NPC chính phân biệt được bằng mắt; preview không lỗi. (FR8.1, FR8.2)

### T7. Đặt NPC vào khu vực theo lịch — `src/scenes/AreaScene.ts`
- Phụ thuộc: T4, T6. (grep nơi AreaScene xử lý `objects`/nghe sự kiện thời gian trước khi sửa)
- Sửa: `AreaScene.ts` — khi vào khu vực và khi nhận `khoảng-đổi`/`ngày-đổi`, tính `npcTaiKhuVuc(...)` và vẽ sprite tại `o`, đúng `huong`; NPC là **vật cản cứng** (va chạm với nhân vật); đổi khoảng/ngày thì làm mới tập NPC (mờ nhẹ ≤ 0,3 s), không hoạt ảnh đi lại.
- Xong khi: đi lại các khoảng thấy NPC đổi đúng; không đi xuyên NPC; không NPC nào chặn khiến kẹt. (FR4.1–FR4.4, AC1, AC5, AC9)

### T8. Tương tác NPC tối thiểu — `src/scenes/AreaScene.ts` (+ `Dialog.ts`)
- Phụ thuộc: T7, T2.
- Sửa: khi đứng cạnh NPC `tuongTacDuoc` và bấm Tương tác → mở `Dialog` hiện câu thoại của NPC (Phụ lục A); **không tiêu khoảng**; NPC nền hiện câu bâng quơ cố định hoặc không phản hồi. Không nhánh, không đổi chỉ số.
- Xong khi: tương tác 5 NPC chính ra đúng câu thoại; HUD không đổi khoảng; NPC nền không mở thoại nhánh. (FR5.1–FR5.4, AC2, AC3, BR4, BR7)

### T9. Hiệu ứng mưa đồ họa — `src/ui/Rain.ts` (+ hook `AreaScene.ts`)
- Phụ thuộc: T3, T7.
- Tạo/Sửa: `src/ui/Rain.ts` (particle/overlay mưa); trong `AreaScene.ts`, nếu `thoiTietCuaNgay(ngàyHiệnTại)==='mua'` và khu vực **ngoài trời** (cổng trường, sân chính, sân thể chất) thì bật mưa, ngược lại tắt.
- Xong khi: Ngày 5 có mưa ở 3 khu vực ngoài trời, hành lang không phủ; ngày nắng không mưa; giữ ≥ 30 FPS. (FR6.1–FR6.3, AC4, NFR1)

### T10. (Tùy chọn) Vẽ NPC trong preview — `tools/render-maps.ts` [∥]
- Phụ thuộc: T4.
- Sửa: `render-maps.ts` nhận (ngày, khoảng) và vẽ NPC theo lịch vào ảnh preview để soát dữ liệu.
- Xong khi: `npm run render-maps` vẽ được NPC đúng vị trí cho một (ngày,khoảng) mẫu. (FR9.3)

### T11. Kiểm thử tích hợp luồng NPC — `tests/npc-flow.test.ts`
- Phụ thuộc: T7, T8, T9.
- Tạo: test luồng (ở mức logic + scene test được): AC1 (đổi khoảng → tập NPC đổi), AC4 (ngày mưa mở em lớp 10 + cờ mưa bật ở khu ngoài trời), AC5/AC9 (không kẹt), AC2 (thoại không tiêu khoảng).
- Xong khi: các ca AC tương ứng xanh. (AC1–AC5, AC9, FR9.2)

### T12. Build, hiệu năng, tài liệu
- Phụ thuộc: T1–T11.
- Làm: `npm run build` đạt, bản build chạy qua máy chủ tĩnh, dung lượng ≤ 5 MB; kiểm ≥ 30 FPS khi có NPC + mưa; cập nhật README/ghi chú dữ liệu nếu cần.
- Xong khi: AC7, AC8 đạt; không hồi quy khung game. (AC7, AC8, NFR4)

---

## Kế hoạch chạy song song (cho `/implement`)
- **Đợt 1 (tuần tự nền):** T1.
- **Đợt 2 [∥]:** T2 và T3 song song (khác file dữ liệu; phần schema đã xong ở T1).
- **Đợt 3:** T4 (cần T2+T3); **T6 [∥ T4]** chạy song song (khác file: `gen-assets.ts`).
- **Đợt 4:** T5 (sau T4); **T10 [∥]** bất kỳ lúc nào sau T4.
- **Đợt 5 (tuần tự vì cùng `AreaScene.ts`):** T7 → T8 → T9.
- **Đợt 6:** T11 → T12.

> Theo PM Charter mục 2: chỉ dùng subagent `dev` chạy song song cho các cặp task **thật sự độc lập, khác file** (vd T2∥T3, T4∥T6, kèm worktree riêng). Các task đụng chung `AreaScene.ts`/`schema.ts` phải tuần tự, PM tự làm.

## Ghi chú kiến trúc (không đổi nếu chưa duyệt)
- Không đổi luồng xác thực (không có), quy ước DB (localStorage, ADR 003 — feature này không thêm trường lưu, FR7.1), API (không có), audit logging (không có).
- Định dạng dữ liệu theo ADR 004 (JSON + zod, id chuỗi ổn định).
