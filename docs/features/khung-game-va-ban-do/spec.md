# Spec: Khung game và bản đồ (khung-game-va-ban-do)

- Trạng thái: **Approved** (người dùng duyệt 2026-09-30)
- Ngày: 2026-09-30
- Căn cứ: docs/vision/vision.md, ADR 001 (Phaser 3 + TS + Vite, tile 16×16), ADR 002 (dữ liệu JSON + zod), ADR 003 (lưu game localStorage), docs/product/art-reference.md

## Goal
Dựng "bộ khung chơi được" của Hồi Trống Cuối: nhân vật đi lại trong 6 khu vực trường Trần Phú (pixel art 16×16), chuyển khu vực, và chạy vòng lặp thời gian ngày/khoảng. Chạy trên trình duyệt máy tính và điện thoại. Đây là nền cho mọi feature sau (hội thoại, quan hệ, lưu bút, mini-game, phiên đêm).

## Business Context
Bản thử nghiệm 30–45 phút cần chứng minh phần khám phá và không khí hoài niệm hấp dẫn. Người chơi chưa có gì để tương tác sâu ở feature này; mục tiêu là cảm giác "đi trong trường cũ" và cảm giác thời gian giới hạn. Chưa có asset đồ họa nào, nên feature này gồm cả bộ tile và sprite khởi đầu.

## User Stories
1. Là người chơi máy tính, tôi đi lại bằng WASD hoặc mũi tên và tương tác bằng E hoặc Space.
2. Là người chơi điện thoại, tôi đi lại bằng D-pad ảo và bấm nút Tương tác.
3. Là người chơi, tôi đi qua cửa/lối ra để chuyển giữa các khu vực và thấy tên khu vực.
4. Là người chơi, tôi luôn thấy đang ở ngày nào, khoảng nào trong ngày.
5. Là người chơi, khi tôi thực hiện một hoạt động thì khoảng hiện tại trôi qua; hết 4 khoảng thì sang ngày mới.
6. Là tác giả, tôi thêm/sửa bản đồ và khu vực bằng dữ liệu (Tiled + JSON) mà không phải sửa code.

## Functional Requirements

### FR1. Dự án và màn hình game
- FR1.1 Khởi tạo project Phaser 3 + TypeScript + Vite; `npm run dev` chạy được, `npm run build` ra thư mục tĩnh.
- FR1.2 Độ phân giải logic đề xuất **320×180** (20×11.25 ô), phóng to theo số nguyên, giữ tỉ lệ 16:9, `image-rendering: pixelated`. Thêm viền/letterbox khi màn hình không khớp.
- FR1.3 Màn hình mobile ưu tiên **ngang**. Nếu dọc, hiện nhắc xoay ngang.
- FR1.4 Luồng scene: Boot/Preload → Màn hình tiêu đề (Bắt đầu) → Game (scene khu vực + lớp HUD).

### FR2. Nhân vật và điều khiển
- FR2.1 Nhân vật 16×24, 4 hướng, có hoạt ảnh đi và đứng yên.
- FR2.2 Di chuyển tự do 4 hướng (không đi chéo), tốc độ cố định; va chạm với tường và vật cản.
- FR2.3 Máy tính: WASD/mũi tên, E hoặc Space để tương tác, Esc mở menu tạm dừng.
- FR2.4 Điện thoại: D-pad ảo bên trái, nút Tương tác bên phải, nút menu. Hỗ trợ multi-touch; nút đủ lớn (≥ 44 px CSS).
- FR2.5 Cả hai đầu vào dùng chung một lớp "hành động" (lên/xuống/trái/phải/tương tác/menu) để logic game không phụ thuộc thiết bị.
- FR2.6 Camera bám theo nhân vật; khu vực nhỏ hơn màn hình thì căn giữa.

### FR3. Bản đồ và khu vực
- FR3.1 6 khu vực MVP, mỗi khu là một tilemap Tiled (`.tmj`, tile 16×16):
  1. `cong-truong` — cổng trường, xe buýt 67, xe kem, xe cháo lòng
  2. `san-chinh` — sân giữa, cây cổ thụ, lối vào nhà chính, khẩu hiệu "RÈN ĐỨC – LUYỆN TÀI"
  3. `hanh-lang-lop-12` — dãy hành lang 3 tầng phía bắc, mỗi tầng 3 lớp (tầng 1 trệt: lớp 12; tầng 2: 11B1–11B3; tầng 3: 11B4–11B6), xem FR3.8
  4. `hanh-lang-lop-10` — dãy hành lang 3 tầng phía nam, mỗi tầng 3 lớp, tổng cộng 10C1–10C9 (tầng 1: 10C1–10C3; tầng 2: 10C4–10C6; tầng 3: 10C7–10C9), xem FR3.8
  5. `san-the-chat` — sân xanh dương, rổ bóng rổ
  6. `san-thuong` — sân thượng/dãy cũ; mặc định **khóa** (bị khóa thể hiện bằng cờ trạng thái, mở ở feature khác)
- FR3.2 Mỗi bản đồ có các lớp: nền, vật thể/tường (va chạm), phủ trên đầu, và lớp đối tượng gồm: điểm xuất hiện, lối chuyển khu vực (`exit`), điểm tương tác (`interact`).
- FR3.3 Lối `exit` khai báo khu vực đích và điểm xuất hiện đích; đi vào là chuyển khu vực, có hiệu ứng mờ dần ngắn (≤ 0,5 s).
- FR3.4 Khi vào khu vực, hiện tên khu vực (tiếng Việt) vài giây.
- FR3.5 Khu vực bị khóa: đi vào lối exit hiện thông báo "Bị khóa", không chuyển cảnh. Trạng thái khóa là dữ liệu, có thể mở bằng cờ.
- FR3.6 Đồ thị nối khu vực (cập nhật 2026-09-30):
  - cổng trường ↔ sân chính (cổng chính ở giữa phía nam sân chính, đi từ cổng lên phía bắc là vào sân).
  - sân chính ↔ **hành lang lớp 12** bằng **1 lối**: cửa chính phía bắc, vào tầng trệt.
  - sân chính ↔ **hành lang lớp 10** bằng **2 lối**: hai cầu thang phía nam (hai bên cổng chính), đều vào tầng trệt của dãy lớp 10.
  - sân chính ↔ sân thể chất: sân thể chất nằm ở **phía tây (bên trái)** sân chính.
  - hành lang lớp 12 ↔ sân thượng (khóa), nối từ **tầng cao nhất** của dãy hành lang lớp 12.
- FR3.7 Dữ liệu khu vực (tên, file map, exit, điều kiện khóa) khai báo trong `data/areas.json`, kiểm tra bằng zod khi nạp (ADR 002). Sai dữ liệu → báo lỗi rõ ràng, chỉ ra file và trường sai.
- FR3.8 Mỗi dãy hành lang (lớp 12 và lớp 10) là **một khu vực** gồm **3 dải hành lang ngang xếp chồng** (tầng 3 trên cùng, tầng 2, tầng 1 dưới cùng), mỗi tầng **3 lớp**. Các tầng nối nhau bằng **cầu thang ở hai đầu** dãy; đổi tầng bằng cách đi bộ trong cùng bản đồ, không chuyển cảnh. Lối từ sân chính (FR3.6) đều dẫn vào tầng 1; lối lên sân thượng nằm ở tầng cao nhất của dãy lớp 12.

### FR4. Thời gian (ngày và khoảng)
- FR4.1 Một ngày có 4 khoảng: Trước giờ học, Trong giờ học, Giờ ra chơi, Sau giờ học.
- FR4.2 Trạng thái thời gian: `ngày` (1..N), `khoảng` (0..3), thứ trong tuần. N cấu hình bằng dữ liệu (MVP: 1 tuần; khung hỗ trợ đến 30 ngày).
- FR4.3 Đi lại giữa các khu vực **không** tiêu hao khoảng. Chỉ **hoạt động** (điểm `interact` có `cost: 1`) tiêu hao 1 khoảng.
- FR4.4 Luôn có cách bỏ qua khoảng hiện tại (lệnh "Nghỉ/Chờ" trong menu) để không bị kẹt.
- FR4.5 Hết khoảng thứ 4 → màn hình tổng kết ngày ngắn ("Hết ngày X") → sang ngày mới, khoảng 0, nhân vật xuất hiện ở `cong-truong`.
- FR4.6 Hết ngày cuối (N) → phát sự kiện "hết thời gian" và tạm dừng ở màn hình giữ chỗ (kết thúc thật là feature khác).
- FR4.7 HUD luôn hiện: "Ngày X · Thứ · Tên khoảng" và tên khu vực.
- FR4.8 Bộ đếm thời gian là module thuần logic (không phụ thuộc Phaser) và phát sự kiện `khoảng-đổi`, `ngày-đổi` để feature sau (NPC theo lịch, sự kiện) gắn vào.
- FR4.9 Điểm tương tác giả để thử (đặt trong bản đồ): ghế/băng ghế "Ngồi nghỉ" (tiêu 1 khoảng), biển tên khu vực (không tiêu khoảng, hiện dòng chữ).

### FR5. Hộp thoại tối thiểu và chữ tiếng Việt
- FR5.1 Có hộp thoại một dòng/nhiều dòng đơn giản (không nhánh, không lựa chọn) để hiện thông báo và dòng chữ của điểm tương tác. Hội thoại có nhánh thuộc feature khác.
- FR5.2 Chữ tiếng Việt có dấu hiển thị đúng và đọc được ở 320×180. Chọn font pixel/bitmap hỗ trợ đủ dấu tiếng Việt (kể cả các tổ hợp như "ữ", "ẫ", "ặ") và có bản kiểm tra hiển thị (chuỗi thử chứa toàn bộ chữ cái có dấu).
- FR5.3 Font phải có giấy phép cho phép dùng trong game phát hành.

### FR6. Bộ asset khởi đầu (tự tạo)
- FR6.1 Bộ tile 16×16 tự tạo (không dùng lại ảnh gốc của TP Media hay ảnh chụp): tường kem, cột xanh da trời, lan can xanh ngọc, sàn hành lang, gạch sân, gạch tường thấp có họa tiết thoi xanh, cây, bonsai, cổng sắt xanh, ghế, bàn, sân xanh dương, rổ bóng rổ, cửa, cỏ, đường nhựa và vạch kẻ.
- FR6.2 Sprite nhân vật chính (học sinh áo trắng), sprite xe buýt 67, xe kem, xe cháo lòng, 1–2 sprite học sinh nền (đứng yên) để bản đồ không trống.
- FR6.3 Bảng màu theo docs/product/art-reference.md; mỗi asset dễ thay thế bằng bản vẽ tay sau này mà không đổi code (đặt tên và tọa độ atlas ổn định).
- FR6.4 Phương thức tạo (script sinh hay vẽ tay) do đề xuất tại tasks.md; kết quả cuối phải là file PNG atlas + `.tmj`.

### FR7. Trạng thái game có thể lưu
- FR7.1 Toàn bộ trạng thái của feature (ngày, khoảng, khu vực hiện tại, vị trí, cờ khóa khu vực) nằm trong một đối tượng tuần tự hóa được thành JSON, có trường `version` (chuẩn bị cho ADR 003).
- FR7.2 Lưu/tải thực tế **không** thuộc feature này (xem Out Of Scope).

## Business Rules
- BR1. Đi lại miễn phí, hành động tốn thời gian: thời gian chỉ trôi khi người chơi chọn hoạt động hoặc chọn Nghỉ/Chờ.
- BR2. Không bao giờ có game over hoặc trạng thái kẹt: luôn có thể Nghỉ/Chờ, luôn có lối ra khỏi mọi khu vực mở.
- BR3. Mỗi ngày bắt đầu ở cổng trường, khoảng Trước giờ học.
- BR4. Nhân vật hư cấu; bối cảnh bám trường thật (theo vision.md).
- BR5. Bản đồ và khu vực do dữ liệu quyết định, không hard-code trong code.

## Permissions
Game một người chơi, không tài khoản, không phân quyền. Toàn bộ chạy phía trình duyệt.

## Integrations
- Phaser 3, TypeScript, Vite (ADR 001, đã duyệt).
- zod để kiểm tra dữ liệu (ADR 002, đã duyệt).
- Tiled (công cụ soạn bản đồ, xuất `.tmj`); Tiled là công cụ tác giả, không nằm trong game.
- Không có server, không có API bên ngoài.

## Non Functional Requirements
- NFR1. Chạy mượt (≥ 30 FPS, mục tiêu 60) trên điện thoại tầm trung và trình duyệt máy tính hiện đại: Chrome, Safari (kể cả iOS), Firefox, Edge.
- NFR2. Tổng dung lượng tải lần đầu ≤ 5 MB (asset khởi đầu nhỏ).
- NFR3. Không cần mạng sau khi tải xong; không gọi dịch vụ ngoài.
- NFR4. Độ trễ đầu vào cảm ứng và bàn phím < 100 ms cảm nhận.
- NFR5. Mã nguồn tách: logic thuần (thời gian, trạng thái, nạp dữ liệu) tách khỏi Phaser để kiểm thử đơn vị được.
- NFR6. Có kiểm thử đơn vị cho module thời gian và nạp/kiểm tra dữ liệu khu vực.
- NFR7. Không đưa dữ liệu cá nhân hay gọi theo dõi (analytics) nào.

## Acceptance Criteria
- AC1. `npm run dev` mở game; tiêu đề hiện đúng tên "Hồi Trống Cuối" và dấu tiếng Việt đúng.
- AC2. Trên máy tính, WASD/mũi tên đưa nhân vật đi 4 hướng, không xuyên tường; E/Space tương tác được với điểm tương tác đứng gần.
- AC3. Trên điện thoại (hoặc giả lập cảm ứng), D-pad ảo và nút Tương tác cho kết quả tương tự AC2; giữ D-pad và bấm Tương tác cùng lúc vẫn hoạt động.
- AC4. Từ cổng trường đi được tới sân chính, hành lang lớp 12, sân thể chất; từ đó đi ngược lại được. Cả 6 khu vực tồn tại (đi được tới hành lang lớp 10 qua 2 cầu thang phía nam sân chính); sân thượng báo "Bị khóa" khi thử vào.
- AC5. Đi lại giữa các khu vực không đổi khoảng trong HUD.
- AC6. "Ngồi nghỉ" hoặc "Nghỉ/Chờ" đổi khoảng đúng thứ tự: Trước giờ học → Trong giờ học → Giờ ra chơi → Sau giờ học → tổng kết ngày → ngày sau, khoảng 0, ở cổng trường; thứ trong tuần cập nhật đúng.
- AC7. Sau ngày cuối cấu hình, game phát sự kiện hết thời gian và hiện màn hình giữ chỗ, không lỗi.
- AC8. Sửa `data/areas.json` cho sai (ví dụ trỏ tới file map không tồn tại) → game báo lỗi chỉ rõ chỗ sai, không treo im lặng.
- AC9. Kiểm thử đơn vị của module thời gian và nạp dữ liệu chạy đạt.
- AC10. `npm run build` thành công; bản build chạy được khi mở qua máy chủ tĩnh; dung lượng ≤ 5 MB.
- AC11. Trạng thái game của feature xuất ra được thành JSON có `version` (kiểm bằng kiểm thử đơn vị).

## Out Of Scope
- Hội thoại có nhánh, chỉ số quan hệ (Thân thiết/Tin tưởng/Áp lực), cốt truyện chính.
- NPC thật, lịch sinh hoạt NPC, đường đi NPC (chỉ có học sinh nền đứng yên).
- Lưu/tải game thực tế (ADR 003 áp dụng ở feature khác; feature này chỉ chuẩn bị trạng thái tuần tự hóa được).
- Cuốn lưu bút, mini-game, phiên khám phá ban đêm, kết thúc.
- Âm thanh/nhạc (đề xuất làm sau).
- Phòng giáo viên, thư viện, căn tin, phòng thí nghiệm, nhà thể chất, phòng câu lạc bộ.
- Thời tiết ảnh hưởng lịch.
- Tap-to-move và tìm đường trên điện thoại.
- Chế độ dọc trên điện thoại (chỉ nhắc xoay ngang).

## Quyết định đã chốt khi duyệt (2026-09-30)
1. Độ phân giải logic 320×180 (20×11 ô nhìn thấy): đồng ý.
2. Một tuần MVP là 6 ngày học (Thứ Hai → Thứ Bảy), bỏ Chủ nhật. N = 6 cho MVP.
3. Đồ thị nối khu vực (FR3.6): đồng ý.
4. Sân thượng khóa mặc định, mở ở feature phiên đêm: đồng ý.
5. Game để bạn bè chơi. Vì vậy mọi asset phải tự tạo (không dùng ảnh gốc TP Media hay ảnh chụp), font phải có giấy phép cho phát hành (FR5.3, FR6.1). Cách đưa game lên mạng để gửi link (hosting) là quyết định riêng, chưa thuộc feature này.

## Thay đổi sau khi duyệt (2026-09-30)
Người dùng yêu cầu chỉnh bố cục trường cho sát thực tế, đã cập nhật FR3.1, FR3.6, FR3.8:
- Sân thể chất chuyển sang phía tây (trái) sân chính.
- Sân chính có thêm 2 cầu thang ở phía nam (hai bên cổng chính) để vào hành lang lớp 12, tổng cộng 3 lối vào hành lang (đều vào tầng trệt).
- Hành lang lớp 12 có 3 tầng: tầng trệt là lớp 12, hai tầng trên là lớp 11; là một khu vực có 3 dải hành lang xếp chồng nối bằng cầu thang.

Thay đổi tiếp (cùng ngày): tầng 2 lớp 11B1–11B3, tầng 3 lớp 11B4–11B6. Hai cầu thang phía nam sân chính **không** vào hành lang lớp 12 mà vào **khu vực mới "hành lang lớp 10"** (khu lầu phía nam, 3 lầu, mỗi lầu 3 lớp, từ 10C1 đến 10C9). **Phạm vi MVP tăng từ 5 lên 6 khu vực** theo quyết định của người dùng.
