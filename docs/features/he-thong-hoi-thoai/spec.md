# Spec: Hệ thống hội thoại nhánh (he-thong-hoi-thoai)

- Trạng thái: **Approved (người dùng duyệt 2026-10-01)**
- Ngày: 2026-10-01
- Căn cứ: `docs/vision/vision.md`, `docs/product/kich-ban-mvp.md` (GDD, Approved), `docs/features/khung-game-va-ban-do/spec.md`, `docs/features/he-thong-npc-va-lich/spec.md` (Approved), ADR 001–004 (Accepted).
- Quyết định phạm vi đã chốt khi mở spec (2026-10-01): thêm **kho flag vào GameState + nâng `STATE_VERSION` 1→2** (anh đã duyệt — chạm quy ước lưu); **lựa chọn hiển thị dạng danh sách trong hộp thoại** (menu-style, kể cả "lựa chọn bằng hành động"); phạm vi = **engine + 2–3 hội thoại mẫu** (không viết hết 6 ngày); hiệu ứng lựa chọn = **`setFlags` dùng ngay + chừa sẵn trường chỉ số quan hệ** (feature sau áp dụng).

## Goal
Dựng **engine hội thoại có nhánh** cho NPC: nhiều trang chữ, các **lựa chọn** (gồm "lựa chọn bằng hành động") rẽ nhánh và **đặt cờ cốt truyện (flag)**, có **điều kiện hiển thị** theo flag. Thay thế thoại tối thiểu của NPC khi NPC có cây thoại. Kèm 2–3 hội thoại mẫu (gồm cảnh Ngày 3 "Huy bị nghi" ở GDD mục 9) để chứng minh engine. Đây là nền cho quan hệ, nhiệm vụ, lưu bút, kết thúc.

## Business Context
Khung game + feature NPC mới chỉ cho NPC nói **một câu placeholder**. Trụ cột thiết kế của game là **"chọn bằng hành động, không có lựa chọn hoàn toàn tốt"** và **flag quyết định ký ức/kết thúc** — chỉ thành hình khi có engine hội thoại nhánh + flag. Feature này tạo ra bộ máy đó và vài hội thoại mẫu; nội dung đầy đủ 6 ngày sẽ viết dần (đổ dữ liệu, không sửa code).

## User Stories
1. Là người chơi, khi nói chuyện với một NPC quan trọng, tôi đọc nhiều trang thoại và tới lúc phải **chọn** giữa các phương án.
2. Là người chơi, một số lựa chọn là **hành động** (vd "Đứng ra nhận lỗi") và lựa chọn của tôi làm câu chuyện rẽ hướng khác.
3. Là người chơi, lựa chọn trước đó ảnh hưởng về sau (qua flag): có thoại/nhánh chỉ mở khi tôi đã làm điều gì đó.
4. Là người chơi, cảm nhận **không có lựa chọn nào hoàn toàn tốt** — mỗi lựa chọn được/mất khác nhau.
5. Là tác giả, tôi viết cây hội thoại (trang, lựa chọn, điều kiện, hiệu ứng) bằng dữ liệu (JSON + zod) mà không sửa code.

## Functional Requirements

### FR1. Dữ liệu hội thoại (`data/dialogues`)
- FR1.1 Một cây thoại có `id` ổn định và tập **node**. Mỗi node: `id`, `speaker` (`npcId` hoặc `"narration"`), `lines` (mảng trang chữ tiếng Việt), và **một trong hai**: `next` (id node kế hoặc `"end"`) **hoặc** `choices` (mảng lựa chọn).
- FR1.2 **Lựa chọn (choice):** `label` (nhãn hiển thị), tùy chọn `isAction` (bool — đánh dấu "lựa chọn bằng hành động"), tùy chọn `condition` (điều kiện flag), `effects` (xem FR3), và `goto` (id node kế hoặc `"end"`).
- FR1.3 Node bắt đầu: node đầu tiên hoặc trường `start` của cây thoại.
- FR1.4 Kiểm tra bằng zod + liên kết: mọi `goto`/`next` trỏ tới node tồn tại hoặc `"end"`; `speaker` là npcId tồn tại hoặc `"narration"`; không node mồ côi không tới được (cảnh báo). Lỗi chỉ rõ cây thoại/node/trường.

### FR2. Điều kiện hiển thị (`condition`)
- FR2.1 `condition` khai báo theo flag, tối thiểu: `allOf`/`anyOf`/`not` trên tên flag (true nếu flag đã bật). Chừa sẵn khả năng điều kiện theo **chỉ số quan hệ** (feature sau), hiện bỏ qua nếu xuất hiện.
- FR2.2 Lựa chọn không thỏa điều kiện thì **ẩn**. Nếu một node `choices` mà **không lựa chọn nào** hiển thị được → đi theo `fallbackGoto` (nếu có) hoặc kết thúc hội thoại an toàn (không kẹt).

### FR3. Hiệu ứng lựa chọn (`effects`)
- FR3.1 `setFlags`: map `tên-flag → bool`, áp vào `GameState.flags` khi chọn (dùng ngay).
- FR3.2 Chừa sẵn trường `relationship` (vd `{ npcId, thanThiet?, tinTuong?, apLuc? }`) trong schema cho feature `he-thong-quan-he`; feature này **đọc được nhưng không áp dụng** (bỏ qua, không lỗi).
- FR3.3 Hiệu ứng là **dữ liệu**, không hard-code (ADR 004).

### FR4. Kho flag trong trạng thái game (nâng cấp save)
- FR4.1 Thêm `flags: Record<string, boolean>` vào `GameState`.
- FR4.2 Nâng `STATE_VERSION` **1 → 2**; cập nhật `serialize`/`deserialize` + kiểm tra `flags`.
- FR4.3 **Di trú (migration):** dữ liệu lưu phiên bản 1 (không có `flags`) được **nâng cấp** thành phiên bản 2 bằng cách thêm `flags: {}` (không ném lỗi vì thiếu `flags`). Phiên bản > 2 vẫn báo lỗi không hỗ trợ.
- FR4.4 `createInitialState()` khởi tạo `flags: {}`.
- FR4.5 Đây vẫn là **chuẩn bị lưu** (chưa lưu localStorage thật — thuộc feature khác); flag sống trong GameState của phiên.

### FR5. Giao diện lựa chọn
- FR5.1 Hộp thoại hiển thị danh sách lựa chọn (nhãn), điều hướng **lên/xuống**, chọn bằng **Tương tác** (phím E/Space hoặc nút cảm ứng) — nhất quán với `Menu` sẵn có.
- FR5.2 Lựa chọn `isAction` có thể hiển thị khác biệt (vd tiền tố "» " hoặc nhãn hành động) để gợi "chọn bằng hành động".
- FR5.3 Chữ tiếng Việt có dấu đúng ở 320×180; **tối đa 4 lựa chọn mỗi node** (hợp màn 320×180); loader báo lỗi nếu node có > 4 lựa chọn hiển thị.

### FR6. Tích hợp với NPC
- FR6.1 NPC trong `data/npcs.json` có thể có trường `dialogue` (id cây thoại). Khi tương tác NPC đó → mở **cây thoại** thay vì thoại tối thiểu.
- FR6.2 NPC không có `dialogue` → giữ nguyên hành vi thoại tối thiểu (he-thong-npc-va-lich FR5).
- FR6.3 Hội thoại (kể cả có lựa chọn) **không tiêu khoảng** (giữ BR của khung game); không mở menu tạm dừng giữa chừng.
- FR6.4 Có thể mở hội thoại ngoài NPC (vd `narration` cho sự kiện cốt truyện), nhưng MVP tối thiểu gắn vào NPC.

### FR7. Lựa chọn bằng hành động (nội dung trụ cột)
- FR7.1 Dựng cảnh mẫu **Ngày 3 "Huy bị nghi"** (GDD mục 9) với 4 lựa chọn-hành-động: (1) nhận thay, (2) đưa bằng chứng, (3) im lặng, (4) điều tra — mỗi lựa chọn đặt flag khác nhau và rẽ nhánh khác nhau; **không lựa chọn nào trọn vẹn**.
- FR7.2 Thể hiện đánh đổi bằng nội dung (lời đáp/hệ quả qua flag), chưa cần số chỉ số quan hệ.

### FR8. Nội dung mẫu
- FR8.1 2–3 cây thoại mẫu đặt trong `data/dialogues`, gắn vào NPC qua FR6: ví dụ cây mở đầu với Kiệt (Ngày 1), cây "Huy bị nghi" (Ngày 3, FR7), và một cây ngắn của NPC khác.
- FR8.2 Nội dung mẫu dùng đúng tên nhân vật đã chốt (Thiện, Thư, Kiệt, Huy, Ngân Trinh, Nguyên).

### FR9. Logic thuần & kiểm thử
- FR9.1 Máy chạy hội thoại (chọn node, lọc lựa chọn theo điều kiện, áp hiệu ứng setFlags, tính node kế) là **logic thuần** (không phụ thuộc Phaser) để kiểm thử đơn vị.
- FR9.2 Kiểm thử: loader `dialogues` (zod + liên kết goto); đánh giá điều kiện flag; áp `setFlags` đổi state; đi hết một nhánh mẫu; serialize/deserialize v2 + di trú v1→v2.

## Business Rules
- BR1. Hội thoại/điều kiện/hiệu ứng **do dữ liệu quyết định** (ADR 004), không hard-code.
- BR2. **Flag là nguồn** cho rẽ nhánh và (về sau) kết thúc; lưu trong `GameState.flags`.
- BR3. Feature này **không thay đổi chỉ số quan hệ** — chỉ chừa sẵn trường trong schema; áp dụng thuộc `he-thong-quan-he`.
- BR4. Hội thoại (kể cả lựa chọn) **không tiêu khoảng** (BR1 khung game).
- BR5. **Không bao giờ kẹt**: node lựa chọn mà không lựa chọn nào thỏa điều kiện phải có lối thoát (fallback hoặc kết thúc).
- BR6. **Không có lựa chọn hoàn toàn tốt** (trụ cột thiết kế) — nội dung mẫu phải thể hiện đánh đổi.
- BR7. Nâng cấp save phải **tương thích ngược** (v1 → v2 không làm hỏng dữ liệu cũ).

## Permissions
Game một người chơi, chạy phía trình duyệt, không tài khoản, không phân quyền.

## Integrations
- Hộp thoại (`src/ui/Dialog.ts`) — mở rộng để hỗ trợ lựa chọn (hoặc thêm thành phần lựa chọn), tái dùng mẫu điều hướng của `Menu`.
- Tương tác NPC (`src/scenes/AreaScene.ts`, he-thong-npc-va-lich FR5) — rẽ sang cây thoại khi NPC có `dialogue`.
- `GameState` (`src/core/state.ts`) — thêm `flags`, nâng version.
- zod (ADR 002/004); dữ liệu trong `data/dialogues`, `data/npcs.json`.
- Không server, không API ngoài.

## Non Functional Requirements
- NFR1. Giữ ≥ 30 FPS; mở/điều hướng hội thoại mượt trên điện thoại & máy tính.
- NFR2. Dữ liệu hội thoại sai (goto hỏng, speaker không tồn tại, node mồ côi) → báo lỗi chỉ rõ chỗ sai khi khởi động.
- NFR3. Máy chạy hội thoại tách khỏi Phaser, có kiểm thử đơn vị.
- NFR4. Chữ tiếng Việt có dấu đúng ở 320×180.
- NFR5. Không tăng đáng kể dung lượng; tổng build vẫn ≤ 5 MB.
- NFR6. Không thu thập dữ liệu cá nhân, không gọi dịch vụ ngoài.

## Acceptance Criteria
- AC1. Nói chuyện với NPC có `dialogue` → hiện cây thoại (nhiều trang) và tới node có **lựa chọn**; chọn được bằng phím và cảm ứng.
- AC2. Hai lựa chọn khác nhau ở cảnh "Huy bị nghi" dẫn tới **nhánh/kết quả khác nhau** và đặt **flag khác nhau** (kiểm bằng state sau hội thoại).
- AC3. Một lựa chọn/nhánh **chỉ hiển thị khi một flag đã bật** (điều kiện FR2) — minh chứng bằng test và trong game.
- AC4. Hội thoại **không đổi khoảng** trên HUD trước/sau khi nói chuyện.
- AC5. NPC không có `dialogue` vẫn chỉ hiện **thoại tối thiểu** như cũ.
- AC6. Dữ liệu hội thoại sai (goto trỏ node không tồn tại / speaker sai) → báo lỗi rõ khi khởi động.
- AC7. `STATE_VERSION` = 2; `deserialize` nạp được dữ liệu **v2**, và **nâng cấp v1→v2** (thêm `flags: {}`) không lỗi; v>2 báo lỗi.
- AC8. Kiểm thử đơn vị: loader dialogues, đánh giá điều kiện, áp setFlags, đi hết một nhánh, di trú save — đều đạt.
- AC9. `npm run build` thành công, ≤ 5 MB; game chạy, không lỗi console khi mở/đi hết hội thoại mẫu.
- AC10. Node lựa chọn mà mọi lựa chọn bị ẩn → không kẹt (có fallback/kết thúc) — kiểm bằng test.

## Out Of Scope
- **3 chỉ số quan hệ** và áp dụng hiệu ứng chỉ số (feature `he-thong-quan-he`) — ở đây chỉ chừa trường schema.
- Nhiệm vụ, lưu bút/ký ức, quà, phiên đêm, mini-game, kết thúc.
- **Lưu/tải game thật** (localStorage) — vẫn chỉ chuẩn bị tuần tự hóa.
- **Hành động trong thế giới thật** (đi tới vật/NPC để "làm") — lựa chọn ở đây là menu trong hộp thoại.
- Viết **đầy đủ hội thoại 6 ngày** — chỉ 2–3 cây mẫu.
- Âm thanh/nhạc.

## Đã chốt khi duyệt (2026-10-01)
1. **Không tách ADR riêng** cho "cờ cốt truyện trong save + di trú version" — ghi trong spec này (FR4) là đủ. (Vẫn tuân ADR 003/004.)
2. **Tối đa 4 lựa chọn** mỗi node (FR5.3).
3. Duyệt **3 cây thoại mẫu**: (a) Kiệt mở đầu Ngày 1, (b) Huy bị nghi Ngày 3 (4 lựa chọn-hành-động), (c) một NPC phụ ngắn.
