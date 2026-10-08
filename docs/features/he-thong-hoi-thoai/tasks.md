# Tasks: Hệ thống hội thoại nhánh (he-thong-hoi-thoai)

- Trạng thái: **Approved** (người dùng ra lệnh `/implement he-thong-hoi-thoai` ngày 2026-10-08, coi như duyệt tasks; chưa duyệt chạy song song bằng subagent → PM tự làm tuần tự, theo mặc định của charter)
- Ngày: 2026-10-01
- Căn cứ: `spec.md` (Approved), GDD `docs/product/kich-ban-mvp.md` (Approved), ADR 001–004 (Accepted).

## Thư viện
**Không cần thư viện mới** (zod, vitest đã có). Nếu phát sinh sẽ hỏi duyệt trước (PM Charter mục 1).

## Blast radius (file đã tồn tại sẽ sửa)
- `src/core/state.ts` — thêm `flags`, nâng `STATE_VERSION` 1→2, migration. **Ảnh hưởng** `tests/state.test.ts` (đang kỳ vọng version 1) và mọi nơi gọi `createInitialState`/`serialize`/`deserialize` (`session.ts`, `AreaScene.restartGame`). Grep trước khi sửa.
- `src/data/schema.ts`, `src/data/loader.ts` — thêm schema + loader hội thoại; `NpcSchema` thêm trường `dialogue?`. **Nhiều task đụng 2 file này → tuần tự phần schema.**
- `src/data/content.ts` — nạp & kiểm tra `data/dialogues` khi khởi động.
- `src/ui/Dialog.ts` — mở rộng hỗ trợ lựa chọn (hoặc tách thành phần lựa chọn). Grep nơi gọi `Dialog`/`.show(`.
- `src/scenes/AreaScene.ts` — tương tác NPC có `dialogue` → chạy cây thoại; áp `setFlags` vào `state.flags`.
- `data/npcs.json` — thêm trường `dialogue` cho vài NPC mẫu.

## File mới (dự kiến)
```
src/core/dialogue.ts           (engine thuần: điều kiện, lọc lựa chọn, áp setFlags, node kế)
data/dialogues/*.json          (3 cây thoại mẫu)
tests/dialogue.test.ts, tests/dialogue-flow.test.ts
(cập nhật) tests/state.test.ts (version 2 + migration)
```

## Quy ước mỗi task
Atomic, kiểm chứng được, ghi rõ file tạo/sửa, phụ thuộc, điều kiện xong (kèm FR/AC). **[∥]** = chạy song song được với task cùng đợt (khác file).

---

### T1. Nâng save v2: kho flag trong GameState [∥ T2]
- Phụ thuộc: —
- Sửa: `src/core/state.ts` (grep nơi dùng `STATE_VERSION`/`createInitialState`/`deserialize` trước); cập nhật `tests/state.test.ts`.
- Làm: thêm `flags: Record<string,boolean>` vào `GameState`; `STATE_VERSION` 1→2; `createInitialState` đặt `flags:{}`; `serialize`/`deserialize` kèm `flags`; **migration**: nạp dữ liệu v1 (thiếu `flags`) → nâng thành v2 với `flags:{}`; v>2 báo lỗi.
- Xong khi: test state nạp v2 đạt, nâng cấp v1→v2 không lỗi, v3 báo lỗi. (FR4, AC7, BR7)

### T2. Schema + loader hội thoại [∥ T1]
- Phụ thuộc: —
- Sửa: `src/data/schema.ts`, `src/data/loader.ts`.
- Làm: `DialogueSchema` (cây thoại: `id`, `start?`, `nodes[]` với `id`/`speaker`/`lines`/(`next`|`choices`)); `ChoiceSchema` (`label`, `isAction?`, `condition?`, `effects?` gồm `setFlags` + chừa `relationship`), `goto`; `ConditionSchema` (`allOf`/`anyOf`/`not` theo flag); `NpcSchema` thêm `dialogue?` (kebab). `validateDialogues`: zod + liên kết (`goto`/`next` tới node tồn tại hoặc `"end"`; `speaker` = npcId tồn tại hoặc `"narration"`; **≤ 4 lựa chọn/node**; cảnh báo node mồ côi). Lỗi chỉ rõ cây/node/trường.
- Xong khi: nạp cây hợp lệ đạt; goto hỏng/speaker sai/>4 lựa chọn → lỗi rõ. (FR1, FR2, FR3, FR5.3, NFR2)

### T3. Engine hội thoại (logic thuần) [∥ T4]
- Phụ thuộc: T2.
- Tạo: `src/core/dialogue.ts` — hàm thuần: `startNode(tree)`, `visibleChoices(node, flags)` (lọc theo `condition`; bỏ qua `relationship` nếu có), `applyEffects(flags, effects)` → flags mới (chỉ `setFlags`), `nextNode(tree, node, choiceIndex|undefined)`; `evalCondition(cond, flags)` (allOf/anyOf/not). Node `choices` mà không lựa chọn nào hiển thị → trả `fallbackGoto`/kết thúc (không kẹt). `tests/dialogue.test.ts`.
- Xong khi: test điều kiện, áp setFlags, đi node kế, fallback khi mọi lựa chọn ẩn — đạt. (FR2, FR3, FR9, BR5, AC10)

### T4. Nội dung 3 cây thoại mẫu [∥ T3]
- Phụ thuộc: T2.
- Tạo: `data/dialogues/*.json` — (a) Kiệt mở đầu Ngày 1, (b) **Huy bị nghi Ngày 3** với 4 lựa chọn-hành-động đặt flag + rẽ nhánh khác nhau (không lựa chọn nào trọn vẹn), (c) một NPC phụ ngắn; gắn `dialogue` cho các NPC tương ứng trong `data/npcs.json`. Có ít nhất 1 lựa chọn/nhánh gắn `condition` theo flag (minh chứng AC3).
- Xong khi: dữ liệu hợp lệ qua `validateDialogues`; dùng tên nhân vật đã chốt. (FR7, FR8, AC2, AC3, BR6)

### T5. Nối content.ts (nạp & kiểm tra khi khởi động)
- Phụ thuộc: T2, T4.
- Sửa: `src/data/content.ts` — nạp `data/dialogues`, `validateDialogues` với tham chiếu npcId; đưa `dialogues: Map<string, DialogueTree>` vào `Content`.
- Xong khi: khởi động nạp dialogues, dữ liệu sai báo lỗi rõ. (FR1.4, NFR2, AC6)

### T6. Giao diện lựa chọn
- Phụ thuộc: T3.
- Sửa/Tạo: mở rộng `src/ui/Dialog.ts` (hoặc thành phần mới) hiển thị danh sách lựa chọn, điều hướng lên/xuống + chọn bằng Tương tác (như `Menu`), hỗ trợ cảm ứng; `isAction` hiển thị khác biệt; tối đa 4.
- Xong khi: mở được node có lựa chọn, chọn bằng phím và cảm ứng; chữ có dấu đúng ở 320×180. (FR5)

### T7. Tích hợp AreaScene (NPC có cây thoại)
- Phụ thuộc: T1, T3, T5, T6.
- Sửa: `src/scenes/AreaScene.ts` — NPC có `dialogue` → chạy engine + UI lựa chọn; áp `setFlags` vào `session.state.flags`; **không tiêu khoảng**; NPC không có `dialogue` giữ thoại tối thiểu.
- Xong khi: nói chuyện NPC mẫu ra cây thoại + lựa chọn; chọn khác nhau đặt flag khác nhau; HUD không đổi khoảng; NPC thường vẫn thoại tối thiểu. (FR6, AC1, AC2, AC4, AC5)

### T8. Test tích hợp luồng hội thoại
- Phụ thuộc: T1, T3, T4.
- Tạo: `tests/dialogue-flow.test.ts` — chạy cây "Huy bị nghi": 2 lựa chọn → 2 nhánh + 2 bộ flag khác nhau (AC2); 1 lựa chọn ẩn cho tới khi flag bật (AC3); node mọi lựa chọn ẩn → không kẹt (AC10); di trú save v1→v2 (AC7).
- Xong khi: các ca AC đạt. (AC2, AC3, AC7, AC10, FR9)

### T9. Build, kiểm chứng, tài liệu
- Phụ thuộc: T1–T8.
- Làm: `npm run build` ≤ 5 MB; chạy trình duyệt: nói chuyện Huy, chọn, thấy nhánh + flag đổi, không lỗi console; cập nhật README (mục hội thoại + định dạng `data/dialogues`).
- Xong khi: AC9 đạt; không hồi quy feature trước. (AC9, NFR5)

---

## Kế hoạch chạy song song (cho `/implement`)
- **Đợt 1 [∥]:** T1 (`state.ts`) và T2 (`schema.ts`/`loader.ts`) — khác file.
- **Đợt 2 [∥]:** T3 (`dialogue.ts`) và T4 (`data/dialogues` + `npcs.json`) — khác file, đều sau T2.
- **Đợt 3 [∥]:** T5 (`content.ts`, sau T2+T4) và T6 (`Dialog.ts`, sau T3) — khác file.
- **Đợt 4:** T7 (`AreaScene.ts`, cần T1/T3/T5/T6) — tuần tự.
- **Đợt 5:** T8 → T9.

> PM Charter mục 2: chỉ giao subagent `dev` (worktree riêng) cho cặp task **thật sự độc lập, khác file** (T1∥T2, T3∥T4, T5∥T6). Task đụng chung `AreaScene.ts`/`schema.ts` làm tuần tự.

## Ghi chú kiến trúc (vùng được bảo vệ)
- **Nâng `STATE_VERSION` 1→2 + thêm `flags`** là thay đổi quy ước lưu — **đã được duyệt** (spec FR4), ghi trong spec (không tách ADR). Giữ **tương thích ngược** (migration v1→v2).
- Không đổi luồng auth (không có), API (không có), audit (không có). Định dạng dữ liệu theo ADR 004.
