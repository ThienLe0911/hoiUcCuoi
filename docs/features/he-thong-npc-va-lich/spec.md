# Spec: Hệ thống NPC và lịch (he-thong-npc-va-lich)

- Trạng thái: **Approved (người dùng duyệt 2026-09-30)**
- Ngày: 2026-09-30
- Căn cứ: `docs/vision/vision.md`, `docs/product/kich-ban-mvp.md` (GDD, Approved), `docs/features/khung-game-va-ban-do/spec.md` (Approved), ADR 001–004 (đều Accepted).
- Quyết định phạm vi đã chốt khi mở spec (2026-09-30): **N = 6 ngày** (khớp khung game); **NPC tĩnh theo lịch** (không tìm đường thời gian thực); **feature này chỉ hiển thị NPC + thoại tối thiểu** (hội thoại nhánh & 3 chỉ số quan hệ để feature sau); **có hiệu ứng mưa đồ họa**.

## Goal
Đưa **NPC sống theo lịch** vào bộ khung đã có: mỗi NPC xuất hiện đúng khu vực/vị trí theo (ngày, khoảng, thời tiết), có thể tương tác ở mức tối thiểu (đứng cạnh, bấm Tương tác → hiện một câu thoại), và ngày mưa có hiệu ứng mưa cùng NPC nhân chứng ẩn. Đây là nền để các feature sau (hội thoại có nhánh, quan hệ, nhiệm vụ, lưu bút) gắn nội dung thật vào NPC.

## Business Context
Khung game (T1–T17) mới có "học sinh nền đứng yên" và đã **cố ý loại** NPC thật, lịch sinh hoạt, đường đi NPC, thời tiết ra khỏi phạm vi của nó (Out Of Scope của khung game). Feature này tiếp nhận đúng phần đó. GDD `kich-ban-mvp.md` đã chốt danh sách 5 NPC chính + lớp NPC phụ, bảng lịch theo khoảng, và cơ chế mưa (Ngày 5). Trải nghiệm cốt lõi "mỗi ngày phải chọn gặp ai" chỉ thành hình khi NPC thực sự **chỉ có mặt ở đúng chỗ, đúng lúc**.

## User Stories
1. Là người chơi, tôi thấy các bạn/NPC xuất hiện ở những nơi khác nhau tùy khoảng trong ngày, nên phải chọn đi gặp ai.
2. Là người chơi, tôi đứng cạnh một NPC tương tác được và bấm Tương tác thì thấy NPC nói một câu.
3. Là người chơi, vào ngày mưa tôi thấy trời mưa và gặp được một NPC chỉ xuất hiện khi mưa.
4. Là người chơi, tôi phân biệt được NPC nào bắt chuyện được và NPC nền chỉ để cho cảnh đỡ trống.
5. Là tác giả, tôi khai báo NPC, lịch và thời tiết bằng dữ liệu (JSON + zod) mà không phải sửa code.

## Functional Requirements

### FR1. Dữ liệu NPC (`data/npcs`)
- FR1.1 Mỗi NPC có: `id` chuỗi ổn định (vd `npc.thu`, `npc.hoc-sinh-nen-1`), tên hiển thị (tiếng Việt), `loai` (`chinh` | `phu`), `frame` sprite (tên khung trong `sprites.json`), cờ `tuong-tac-duoc` (bool).
- FR1.2 NPC tương tác được có **thoại tối thiểu**: **một câu trung tính** (không lộ cốt truyện), xem **Phụ lục A**. Không nhánh, không lựa chọn (xem FR5). Có thể mở rộng theo (ngày, khoảng) ở feature hội thoại sau.
- FR1.3 MVP gồm **5 NPC chính** — Trịnh Minh Thư, Nguyễn Trần Anh Kiệt, Lê Hoàng Huy, Nguyễn Ngọc Ngân Trinh, Hồ Thị Phương Nguyên — và **các NPC phụ** ở GDD mục 4 (bảo vệ/giám thị, cô bán kem, chú cháo lòng, bác tài xe buýt, bác lao công, học sinh nền, cô chủ nhiệm, em lớp 10 "trú mưa", nhóm bóng rổ, thầy thể dục).
- FR1.4 Kiểm tra bằng zod khi nạp (ADR 002/004). Dữ liệu sai → báo lỗi chỉ rõ file và trường.

### FR2. Lịch NPC (`data/schedules`)
- FR2.1 Tra theo `(npcId, ngày 1..6, khoảng 0..3)` → `{ areaId, o: {x,y}, huong }` **hoặc** `"vang"` (không có mặt).
- FR2.2 Mục lịch có thể gắn **điều kiện thời tiết** (`nang` | `mua` | bỏ trống = mọi thời tiết). Ví dụ em lớp 10 "trú mưa" chỉ có mục lịch điều kiện `mua`.
- FR2.3 Vị trí `o` phải nằm trong bản đồ khu vực và **không rơi vào ô cản**; loader kiểm tra và báo lỗi nếu sai.
- FR2.4 Lịch là dữ liệu; không hard-code trong code (BR khung game BR5, ADR 004).

### FR3. Thời tiết (`data/weather`)
- FR3.1 Bảng theo `ngày 1..6` → `nang` | `mua`. MVP: **Ngày 5 = mưa**, các ngày khác nắng.
- FR3.2 Có hàm thuần logic `thoiTietCuaNgay(ngay)` (không phụ thuộc Phaser) để hệ đặt NPC và hiệu ứng dùng chung.
- FR3.3 Thời tiết suy ra từ ngày (tất định) → **không cần lưu riêng** trong trạng thái game.

### FR4. Đặt NPC vào khu vực theo lịch
- FR4.1 Khi **vào khu vực** hoặc khi nhận sự kiện `khoảng-đổi` / `ngày-đổi` (FR4.8 khung game), hệ thống tính tập NPC nên có mặt tại **khu vực hiện tại** cho `(ngày, khoảng, thời tiết)` và hiển thị sprite tại `o`, đúng `huong`.
- FR4.2 NPC **tĩnh**: đứng yên tại vị trí lịch, không tìm đường, không di chuyển giữa các ô trong khoảng. Cho phép hoạt ảnh "đứng yên/thở" nhẹ nếu asset có.
- FR4.3 NPC là **vật cản cứng**: nhân vật **không đi xuyên** NPC (va chạm như tường). Vì vậy **không được** đặt NPC chặn ô `exit` hay lối đi rộng 1 ô khiến người chơi kẹt; loader/kiểm thử báo lỗi khi vị trí lịch chặn lối duy nhất (bảo đảm "không bao giờ kẹt" của khung game).
- FR4.4 Đổi khoảng/ngày → NPC cũ biến mất, NPC theo lịch mới hiện ra (không hoạt ảnh đi lại; chỉ đổi hiển thị, có thể kèm mờ nhẹ ≤ 0,3 s).

### FR5. Tương tác NPC ở mức tối thiểu
- FR5.1 Đứng cạnh NPC `tuong-tac-duoc` và bấm Tương tác (E/Space/nút cảm ứng) → hiện **hộp thoại tối thiểu** (FR5 khung game) với một dòng thoại của NPC theo FR1.2.
- FR5.2 **Không** nhánh, **không** lựa chọn, **không** đổi chỉ số hay đặt cờ cốt truyện. Cấu trúc phải đủ rõ để feature `he-thong-hoi-thoai` thay thế phần thoại mà không phải dựng lại phần đặt NPC.
- FR5.3 NPC không tương tác được (học sinh nền) → không phản hồi, hoặc hiện một câu bâng quơ cố định ngắn, không tiêu khoảng.
- FR5.4 Trò chuyện tối thiểu **không tiêu khoảng** (BR1 khung game: chỉ hoạt động `activity`/Nghỉ mới tiêu khoảng).

### FR6. Hiệu ứng mưa (đồ họa)
- FR6.1 Ngày mưa: hiển thị **lớp phủ mưa** (hạt mưa hoặc overlay hoạt ảnh) ở các **khu vực ngoài trời** (cổng trường, sân chính, sân thể chất). Khu vực trong nhà (hành lang) không phủ mưa toàn màn (tùy chọn mưa ngoài lan can, không bắt buộc MVP).
- FR6.2 Hiệu ứng nhẹ, giữ hiệu năng ≥ 30 FPS (NFR1 khung game); tắt hoàn toàn vào ngày nắng.
- FR6.3 **Âm thanh mưa không thuộc feature này** (chưa có hệ thống audio; để feature audio sau) — xem Out Of Scope.

### FR7. Trạng thái lưu được
- FR7.1 Hiện diện/vị trí NPC và thời tiết đều **suy ra** từ `(ngày, khoảng)` → feature này **không thêm** trường lưu mới; vẫn tương thích đối tượng trạng thái tuần tự hóa của khung game (FR7 khung game).
- FR7.2 Trạng thái "đã trò chuyện / quan hệ" là của feature sau, không thuộc feature này.

### FR8. Asset NPC (tự tạo)
- FR8.1 Sprite NPC tự tạo theo `docs/product/art-reference.md` (không dùng ảnh gốc). Tên khung atlas ổn định để thay bản vẽ tay sau mà không đổi code (như FR6.3 khung game). Sprite học sinh cơ sở chỉ tái dùng cho **NPC là học sinh**.
- FR8.2 Phân biệt được bằng mắt: 5 NPC chính, **và mọi NPC người lớn/hàng quán có sprite riêng** (bảo vệ/giám thị, lao công, bán kem, cháo lòng, tài xe buýt, chủ nhiệm, thể dục) — khác trang phục/mũ và **có đạo cụ nhận diện** (vd chổi cho lao công, mũ kê pi cho bảo vệ, tạp dề/nón cho người bán). *(Cập nhật đã duyệt 2026-09-30 — trước đó cho phép tái dùng sprite học sinh cho NPC phụ.)*

### FR9. Công cụ & kiểm thử
- FR9.1 Module tra cứu lịch/thời tiết là **logic thuần** (không phụ thuộc Phaser) để kiểm thử đơn vị (NFR5 khung game).
- FR9.2 Kiểm thử đơn vị: loader `npcs`/`schedules`/`weather` (zod hợp lệ & bắt lỗi); hàm `(npcId,ngày,khoảng,thời tiết)→vị trí|vắng`; hàm "tập NPC tại khu vực X ở (ngày,khoảng,thời tiết)"; kiểm tra vị trí lịch không rơi ô cản và không chặn exit.
- FR9.3 (Tùy chọn) mở rộng `render-maps`/preview để vẽ NPC theo một (ngày,khoảng) giúp soát dữ liệu.

## Business Rules
- BR1. NPC, lịch, thời tiết **do dữ liệu quyết định**, không hard-code (ADR 002/004).
- BR2. NPC **tĩnh theo lịch**; không tìm đường/di chuyển thời gian thực.
- BR3. Không đặt NPC chặn lối đi hay `exit` khiến người chơi kẹt (giữ nguyên "không bao giờ kẹt" của khung game).
- BR4. Tương tác NPC ở feature này **chỉ hiện thoại tối thiểu**: không nhánh, không lựa chọn, không đổi chỉ số, không cốt truyện thật.
- BR5. Thời tiết **tất định theo ngày** (MVP: Ngày 5 mưa). Mưa vừa mở NPC nhân chứng ẩn (qua điều kiện lịch), vừa bật hiệu ứng mưa ở khu vực ngoài trời.
- BR6. Nhân vật hư cấu (vision.md); tên cụ thể theo người dùng cấp: Thiện (nhân vật chính), Thư, Kiệt, Huy, Ngân Trinh, Nguyên.
- BR7. Trò chuyện tối thiểu không tiêu khoảng; chỉ hoạt động `activity`/Nghỉ mới tiêu khoảng (kế thừa khung game).

## Permissions
Game một người chơi, chạy hoàn toàn phía trình duyệt, không tài khoản, không phân quyền (kế thừa khung game).

## Integrations
- Phaser 3 + TypeScript + Vite (ADR 001).
- zod kiểm tra dữ liệu (ADR 002, 004).
- Sự kiện thời gian `khoảng-đổi` / `ngày-đổi` từ module thời gian khung game (FR4.8).
- Hộp thoại tối thiểu của khung game (FR5) để hiện thoại NPC.
- Mô hình đối tượng bản đồ (`objects`, ô 16×16) và `data/areas.json` của khung game (map-format.md).
- Không server, không API ngoài.

## Non Functional Requirements
- NFR1. Giữ ≥ 30 FPS (mục tiêu 60) kể cả khi hiển thị nhiều NPC + hiệu ứng mưa, trên điện thoại tầm trung và trình duyệt hiện đại.
- NFR2. Nạp dữ liệu NPC/lịch/thời tiết sai → báo lỗi chỉ rõ file/trường, không treo im lặng.
- NFR3. Logic tra cứu tách khỏi Phaser, có kiểm thử đơn vị (NFR5, NFR6 khung game).
- NFR4. Không tăng đáng kể dung lượng tải: asset NPC nhỏ, tổng bản build vẫn ≤ 5 MB (NFR2 khung game).
- NFR5. Chữ tiếng Việt trong thoại NPC hiển thị đúng dấu ở 320×180 (kế thừa FR5.2 khung game).
- NFR6. Không thu thập dữ liệu cá nhân, không gọi dịch vụ ngoài.

## Acceptance Criteria
- AC1. Vào một khu vực ở các khoảng khác nhau của cùng một ngày → tập NPC hiển thị thay đổi đúng theo `data/schedules`.
- AC2. Đứng cạnh một NPC chính và bấm Tương tác → hiện hộp thoại tối thiểu với câu thoại của NPC; HUD **không** đổi khoảng.
- AC3. NPC không tương tác được không mở hộp thoại nhánh; cùng lắm hiện câu bâng quơ ngắn.
- AC4. Ngày 5: có **hiệu ứng mưa** ở khu vực ngoài trời và **em lớp 10 "trú mưa"** xuất hiện ở hành lang lớp 10; các ngày khác không mưa và NPC này vắng.
- AC5. Đổi khoảng bằng "Ngồi nghỉ"/"Nghỉ/Chờ" → NPC cập nhật theo lịch mới ngay; không NPC nào chặn khiến người chơi không ra được khỏi khu vực.
- AC6. Sửa `data/schedules` cho một NPC vào **ô cản** hoặc **chặn exit** → kiểm thử/loader báo lỗi rõ; sửa một `npcId` không tồn tại trong `data/npcs` → báo lỗi tham chiếu.
- AC7. Kiểm thử đơn vị của loader và hàm tra cứu lịch/thời tiết chạy đạt.
- AC8. `npm run build` thành công; bản build chạy được qua máy chủ tĩnh; dung lượng ≤ 5 MB; giữ ≥ 30 FPS khi có NPC + mưa.
- AC9. Không có NPC nào làm người chơi kẹt ở bất kỳ khu vực mở nào (rà theo BR3).

## Out Of Scope
- Hội thoại **có nhánh** và **lựa chọn bằng hành động** (feature `he-thong-hoi-thoai`).
- **3 chỉ số quan hệ** (Thân thiết/Tin tưởng/Áp lực) và hệ quả (feature `he-thong-quan-he`).
- Nhiệm vụ hằng ngày/theo tuyến/ẩn (feature `he-thong-nhiem-vu`).
- Lưu bút, ký ức, quà tặng, phiên đêm, mini-game, kết thúc (các feature riêng).
- **NPC tìm đường / đi lại / tuần tra** trong khu vực.
- **Thời tiết ngẫu nhiên** hoặc thời tiết ảnh hưởng ngoài việc mở NPC ẩn và hiệu ứng mưa.
- **Âm thanh mưa** và mọi âm thanh/nhạc (feature audio sau).
- Lưu/tải game thực tế (ADR 003 áp dụng ở feature khác).

## Đã chốt khi duyệt (2026-09-30)
1. Thoại NPC: **một câu trung tính mỗi NPC** (không lộ cốt truyện) — xem Phụ lục A.
2. NPC là **vật cản cứng** (nhân vật không đi xuyên), kèm ràng buộc không đặt NPC chặn lối/exit (FR4.3, BR3).
3. Mưa **chỉ phủ khu vực ngoài trời** (cổng trường, sân chính, sân thể chất); không phủ hành lang (FR6.1).

## Phụ lục A — Thoại tối thiểu (một câu trung tính mỗi NPC)
Câu placeholder cho FR5, giữ trong `data/npcs`. Trung tính, không tiết lộ bí ẩn; feature hội thoại sau sẽ thay bằng thoại có nhánh.

### NPC chính
| NPC | Câu thoại |
|---|---|
| Trịnh Minh Thư (lớp trưởng) | "Trực nhật xong chưa? Tuần này lớp mình bị nhắc rồi đấy." |
| Nguyễn Trần Anh Kiệt (bạn thân) | "Ê Thiện! Lát ra chơi làm ván gì không?" |
| Lê Hoàng Huy (cá biệt) | "Nhìn gì? Không có gì đâu mà xem." |
| Nguyễn Ngọc Ngân Trinh (văn nghệ) | "Tiết mục bế giảng tập hoài chưa xong, mệt ghê." |
| Hồ Thị Phương Nguyên (biến mất) | "Ừ… lâu rồi mới gặp lại cậu." |

### NPC phụ
| NPC | Câu thoại |
|---|---|
| Bác bảo vệ / giám thị | "Vào lớp đi, sắp trống rồi đó!" |
| Cô bán kem | "Kem ốc quế hay kem ly đây con?" |
| Chú xe cháo lòng | "Cháo lòng nóng đây, ăn không cháu?" |
| Bác tài xe buýt 67 | "Xe sắp chạy, lên nhanh nào!" |
| Bác lao công | "Để bác quét cho sạch cái sân này." |
| Học sinh nền | "Nghe nói cuối tuần có bài kiểm tra đó." |
| Cô chủ nhiệm | "Em nhớ nộp bài đầy đủ nhé." |
| Em lớp 10 "trú mưa" | "Mưa to quá, em đứng đây trú nhờ chút ạ." |
| Nhóm bóng rổ | "Vào chơi một chân không?" |
| Thầy thể dục | "Khởi động kỹ rồi hãy chơi nghe." |
