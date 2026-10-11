# Validation: Hệ thống hội thoại nhánh (he-thong-hoi-thoai)

- Trạng thái: **PASS** (2026-10-08). Đợt 1 ra "ĐẠT CÓ ĐIỀU KIỆN" vì AC1/AC4/AC5/AC9 chỉ có kiểm tay; người dùng duyệt cài Playwright, e2e tự động và ảnh chụp bố cục cảm ứng đã đóng các điều kiện đó.
- Người kiểm: `reviewer` (đối chiếu spec, chỉ đọc) và `qa` (chạy test/build, lấp lỗ hổng test), độc lập với người viết (PM). **Riêng bộ e2e Playwright do PM cài đặt** theo kịch bản QA đề xuất (xem "Giới hạn của kết luận").
- Căn cứ: spec.md (Approved), tasks.md (Approved), GDD, ADR 003/004 (Accepted).

## Kết quả kiểm thử tự động
- `npx tsc --noEmit` và `npx tsc -p e2e`: sạch.
- `npx vitest run`: **205/205 test xanh** (15 file): 154 của người viết, +50 do QA thêm (`tests/dialogue-qa.test.ts`), +1 canh bố cục.
- `npm run e2e` (Playwright, Chromium thật): **14/14 test xanh**, chạy 3 lần liên tiếp đều đạt (không chập chờn). 13 test bàn phím trên desktop + 1 test cảm ứng thật.
- `npm run build`: thành công; `dist` **1,6 MB** (≤ 5 MB).
- Kiểm tra e2e không "pass rỗng": cố tình làm hỏng `Dialog.move()` thì e2e **đỏ** ngay tại bước chọn lựa chọn; sau đó đã khôi phục nguyên trạng.

## Đối chiếu Acceptance Criteria
| AC | Kết quả | Cách xác minh |
|---|---|---|
| AC1 (cây thoại nhiều trang → lựa chọn; phím và cảm ứng) | ĐẠT | Phím: e2e đi bộ thật tới Kiệt, bấm E, chọn bằng ↓/E. Cảm ứng: e2e dùng sự kiện chạm thật (nút Tương tác + D-pad ↓/↑) trên màn hình ngang 844×390; ảnh bằng chứng `evidence/cam-ung-4-lua-chon.png`. |
| AC2 (hai lựa chọn → nhánh và flag khác nhau) | ĐẠT | Test dữ liệu thật (4 hành động → 4 kết cục) + e2e chạy từng hành động trong game: mỗi lần đúng 1 flag `ngay3.*` riêng, lời thoại nhánh riêng. |
| AC3 (lựa chọn chỉ hiện khi flag bật) | ĐẠT | Test; e2e: có/không có flag của Kiệt → Huy hiện 2/1 lựa chọn; flag đặt ở Ngày 1 còn nguyên khi sang cảnh khác ở Ngày 3; cây bác lao công ẩn/hiện "mẩu thư". |
| AC4 (không đổi khoảng) | ĐẠT | e2e: mọi test hội thoại khẳng định (ngày, khoảng) trước = sau. Reviewer xác nhận qua mã: không có đường gọi `spendPeriods`. |
| AC5 (NPC không có `dialogue` giữ thoại tối thiểu) | ĐẠT | e2e (Thư): 1 trang, không lựa chọn, flags không đổi; reviewer đọc mã. |
| AC6 (dữ liệu sai báo lỗi rõ khi khởi động) | ĐẠT | `dialogue-schema.test.ts` + ca QA; `BootScene` bắt lỗi và hiện lên màn hình. |
| AC7 (save v2; nạp v2; nâng cấp v1→v2; v>2 lỗi) | ĐẠT | `state.test.ts` + ca QA (khóa độc `__proto__`, flags null/lồng, trường lạ, version sai kiểu). |
| AC8 (test đơn vị loader, điều kiện, setFlags, đi hết nhánh, di trú) | ĐẠT | 205 test xanh; QA và PM đều chạy lại. |
| AC9 (build ≤ 5 MB; không lỗi console khi đi hết hội thoại mẫu) | ĐẠT | Build 1,6 MB. e2e có fixture tự động khẳng định **không có `console.error`/`pageerror`** sau từng test; các test cùng nhau chơi qua **mọi node của cả 3 cây** (Kiệt 3 nhánh; Huy 2 đường tiếp cận × 4 hành động; bác lao công đủ menu lặp và lối thoát). |
| AC10 (mọi lựa chọn ẩn → không kẹt) | ĐẠT | Test duyệt toàn bộ không gian trạng thái flag trên cả 3 cây thật; e2e menu lặp thoát được. |

## Phát hiện và xử lý
| Mã | Mức | Nội dung | Xử lý |
|---|---|---|---|
| M1 | MEDIUM → LOW (đã đóng) | Bố cục cảm ứng: node 4 lựa chọn có thể đè D-pad. | Số đo thật: hộp cao 71 px, đáy y=105, dòng cuối ≈ y101. **Ảnh chụp thật từ e2e cảm ứng**: chữ cả 4 dòng không bị D-pad che; D-pad chỉ chạm phần lề trống dưới đáy hộp. Đã sửa chú thích sai trong `Dialog.ts`; test canh lời dẫn ≤ 56 ký tự; e2e canh `rowsBottom ≤ 104`. |
| M2 | MEDIUM | Loader chống kẹt "lạc quan" với lựa chọn có điều kiện. | Test duyệt mọi tổ hợp flag trên **mọi cây** trong `data/dialogues` bắt được trường hợp này khi chạy `npm test`. Ghi vào README. |
| M3 | MEDIUM → LOW | Hộp chữ cao cố định 44 px, trang quá dài sẽ tràn. | Hiện an toàn (trang dài nhất 87 ký tự; giới hạn ≤ 100 ký tự ≈ 2 dòng, có test canh). Ghi vào README. Chưa làm hộp tự giãn. |
| L1 | LOW | `deserialize` không giới hạn tên khóa trong `flags`. | An toàn hiện tại (chưa nạp localStorage thật; đã test `__proto__`). Khi làm lưu/tải thật nên lọc khóa theo regex tên flag. |
| L2 | LOW | Điều kiện `relationship` coi là thỏa; `{not: relationship}` thành sai. | Cố ý (chừa chỗ). Định nghĩa lại ở feature quan hệ. Đã ghi README. |
| L3 | LOW | Tên flag (`ngay3.nhan-thay`) khác ví dụ trong ADR 004. | Không vi phạm ADR; dự án nhất quán kebab. Nên đồng bộ tài liệu khi tiện. |
| Q1 | LOW | `setFlags` chứa khóa `__proto__` bị zod bỏ lặng lẽ thay vì báo lỗi. | Không có nguy cơ ô nhiễm (đã test). Tùy chọn siết sau. |
| Q2 | LOW | `areaLocks` là mảng vẫn được `deserialize` chấp nhận (có từ v1). | Ngoài phạm vi, mức thấp. |
| A1 | LOW (có sẵn) | `npm audit`: 1 lỗ hổng mức high ở `source-map-js` (DoS qua source map, phụ thuộc gián tiếp của công cụ build). | **Đã có trong lockfile trước khi cài Playwright** (kiểm bằng cách audit lockfile cũ). Chưa sửa vì `npm audit fix` đổi phụ thuộc, cần người dùng duyệt. |

## Mục lệch spec / đáng biết
- Khóa `relationship` đổi sang tiếng Anh (`npc/closeness/trust/pressure`); **spec FR3.2 đã được cập nhật**.
- Loader chặt hơn spec: vòng lặp không lối thoát là **lỗi** (spec chỉ yêu cầu cảnh báo node mồ côi).
- Thêm `tests/dialogue-schema.test.ts`, `tests/dialogue-qa.test.ts` và bộ `e2e/` ngoài danh sách file dự kiến trong tasks.
- **Thư viện mới được người dùng duyệt (2026-10-08):** `@playwright/test` ^1.64.0 (devDependency) + Chromium headless shell (~100 MB, ở cache người dùng `~/Library/Caches/ms-playwright`, không nằm trong repo). Không đổi công nghệ chạy game.
- **Hạn chế đã biết (không tính lỗi):** mỗi NPC chỉ gắn một cây thoại, chưa chọn theo ngày — cây "Huy bị nghi" chạy cả khi nói chuyện Ngày 1. Việc chọn cây theo ngày/sự kiện thuộc feature nhiệm vụ.
- Vấn đề cũ của feature NPC (ngoài phạm vi): lịch Huy/Thư/Ngân Trinh đứng ở dải hành lang trên cùng của lớp 12, trong khi lớp 12 ở tầng trệt; vì thế e2e dịch người chơi tới cạnh họ (`placePlayer`) thay vì đi bộ. Riêng cảnh Kiệt đi bộ thật.
- Vite in cảnh báo `Assets in public directory cannot be imported from JavaScript` (BootScene import `public/assets/sprites.json`); có từ trước, vô hại.

## Giới hạn của kết luận
- Bộ e2e do PM (người viết feature) cài đặt, dựa trên kịch bản QA đề xuất; **chưa có người thứ hai rà soát**. Độ tin cậy được củng cố bởi: chạy lặp 3 lần không chập chờn, kiểm tra cố ý phá `Dialog.move()` thì đỏ, và e2e đọc trạng thái thật qua `window.__game`. Nếu cần độc lập hoàn toàn, có thể giao `qa` rà soát và mở rộng e2e.
- e2e chỉ chạy trên Chromium (Safari/Firefox, điện thoại thật chưa kiểm). Cảm ứng được mô phỏng bằng sự kiện chạm CDP trên màn hình ngang, không phải thiết bị thật.
- Hạn chế môi trường: e2e phụ thuộc chế độ dev (`?area=&day=&period=`, `window.__game`) nên không kiểm bản build.

## Khuyến nghị
- Khi làm feature nhiệm vụ/sự kiện: thêm cơ chế chọn cây thoại theo ngày/điều kiện, và thêm e2e cho đường đó.
- Khi làm feature quan hệ: định nghĩa lại ngữ nghĩa điều kiện `relationship` (L2).
- Cân nhắc `npm audit fix` cho A1 (cần duyệt) và đưa `npm run e2e` vào CI nếu sau này có CI.
