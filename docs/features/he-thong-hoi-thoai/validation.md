# Validation: Hệ thống hội thoại nhánh (he-thong-hoi-thoai)

- Trạng thái: **ĐẠT CÓ ĐIỀU KIỆN** (2026-10-08) — không có BLOCKER/HIGH; còn 2 điểm chỉ có kiểm tay của người viết, chưa kiểm độc lập (xem "Điều kiện để PASS").
- Người kiểm: `reviewer` (đối chiếu spec, chỉ đọc) và `qa` (chạy test/build, lấp lỗ hổng test), độc lập với người viết (PM). Người viết xử lý phát hiện nhỏ rồi chạy lại.
- Căn cứ: spec.md (Approved), tasks.md (Approved), GDD, ADR 003/004 (Accepted).

## Kết quả kiểm thử tự động (chạy lại sau chỉnh sửa)
- `npx tsc --noEmit`: sạch.
- `npx vitest run`: **205/205 test xanh** (15 file). Gồm 154 test của người viết, +50 ca do QA thêm (`tests/dialogue-qa.test.ts`), +1 ca canh quy tắc hiển thị.
- `npm run build`: thành công; `dist` **1,6 MB** (≤ 5 MB).
- QA không sửa `src/` hay `data/`; không cài thêm thư viện.

## Đối chiếu Acceptance Criteria
| AC | Kết quả | Cách xác minh |
|---|---|---|
| AC1 (cây thoại nhiều trang → lựa chọn; phím và cảm ứng) | ĐẠT CÓ ĐIỀU KIỆN | Logic: test tự động. Phím: người viết kiểm trong trình duyệt. **Cảm ứng: chưa chụp ảnh**, chỉ có số đo bố cục. |
| AC2 (hai lựa chọn → nhánh và flag khác nhau) | ĐẠT | `dialogue-flow.test.ts` trên dữ liệu thật: 4 hành động → 4 flag + 4 kết cục khác nhau. |
| AC3 (lựa chọn chỉ hiện khi flag bật) | ĐẠT | Test (xuyên cảnh Kiệt → Huy, và cây bác lao công); người viết kiểm trong game: có flag thì hiện 2 lựa chọn, chưa có thì 1. |
| AC4 (không đổi khoảng) | ĐẠT | Reviewer đọc mã: hội thoại không gọi `spendPeriods`. Người viết kiểm trong game: HUD giữ nguyên (Ngày 1/khoảng 0 và Ngày 3/khoảng 1). Chưa có test tự động ở mức cảnh. |
| AC5 (NPC không có `dialogue` giữ thoại tối thiểu) | ĐẠT | Reviewer đọc mã (`talkTo` nhánh rơi về `def.line`) + test dữ liệu. Chưa kiểm lại trong trình duyệt ở nhánh này (nhánh mã không đổi so với feature NPC). |
| AC6 (dữ liệu sai báo lỗi rõ khi khởi động) | ĐẠT | `dialogue-schema.test.ts` + ca QA (báo gộp nhiều file, nhiều lỗi cùng cây); `BootScene` bắt lỗi và hiện lên màn hình. |
| AC7 (save v2; nạp v2; nâng cấp v1→v2; v>2 lỗi) | ĐẠT | `state.test.ts` + QA (khóa độc `__proto__`, flags null/lồng, trường lạ, version sai kiểu). |
| AC8 (test đơn vị loader, điều kiện, setFlags, đi hết nhánh, di trú) | ĐẠT | 205 test xanh, QA tự chạy lại và em chạy lại. |
| AC9 (build ≤ 5 MB; không lỗi console khi đi hết hội thoại mẫu) | ĐẠT MỘT PHẦN | Build 1,6 MB: đạt. Console: sạch khi khởi động, đi hết cây Kiệt và hai nhánh của cây Huy. **Chưa đi hết cả 3 cây và mọi nhánh trong trình duyệt**; do người viết kiểm tay, chưa độc lập. |
| AC10 (mọi lựa chọn ẩn → không kẹt) | ĐẠT | Test duyệt toàn bộ không gian trạng thái flag trên cả 3 cây thật: mọi trạng thái đều tới được `end`; thêm ca fallback/runner. |

## Phát hiện và xử lý
| Mã | Mức | Nội dung | Xử lý |
|---|---|---|---|
| M1 | MEDIUM → LOW | Bố cục cảm ứng: node 4 lựa chọn có thể đè D-pad. Reviewer ước lượng hộp cao ~81 px; **đo thật** trong trình duyệt là 71 px (đáy y=105, dòng cuối ≈ y101, D-pad chỉ chạm tới y=100 sát x=42) vì lời dẫn chỉ 1 dòng. Chú thích trong `Dialog.ts` tự mâu thuẫn. | **Đã sửa chú thích**; thêm test: lời dẫn của node 4 lựa chọn ≤ 56 ký tự (1 dòng). Ảnh chụp chế độ cảm ứng vẫn chưa có. |
| M2 | MEDIUM | Loader chống kẹt "lạc quan": coi mọi `goto` của lựa chọn là đi được dù có điều kiện. | Đã có biện pháp: `dialogue-flow.test.ts` duyệt mọi tổ hợp flag trên **mọi cây trong `data/dialogues`**, nên nội dung viết thêm sau này cũng bị bắt khi chạy `npm test`. Đã ghi vào README. |
| M3 | MEDIUM → LOW | Hộp chữ cao cố định 44 px; trang quá dài sẽ tràn. | Hiện an toàn (trang dài nhất 87 ký tự, giới hạn ≤ 100 ký tự ≈ 2 dòng, có test canh). Ghi vào README. Chưa làm hộp tự giãn. |
| L1 | LOW | `deserialize` không giới hạn tên khóa trong `flags`. | Hiện an toàn (chưa nạp localStorage thật; đã test `__proto__`). Khi làm lưu/tải thật nên lọc khóa theo regex tên flag. |
| L2 | LOW | Điều kiện `relationship` coi là thỏa; `{not: relationship}` thành sai. | Cố ý (chừa chỗ). Cần định nghĩa lại ngữ nghĩa ở feature quan hệ. Đã ghi README. |
| L3 | LOW | Tên flag (`ngay3.nhan-thay`) khác ví dụ trong ADR 004 (`flag.ngay3_chon_nhan_thay`). | Không vi phạm ADR (ví dụ minh họa); dự án nhất quán kebab. Nên đồng bộ tài liệu khi tiện. |
| Q1 | LOW | `setFlags` chứa khóa `__proto__` bị zod bỏ lặng lẽ thay vì báo lỗi. | Không có nguy cơ ô nhiễm (đã test). Tùy chọn siết sau. |
| Q2 | LOW | `areaLocks` là mảng vẫn được `deserialize` chấp nhận (có từ v1). | Ngoài phạm vi, mức thấp. |

## Mục lệch spec / đáng biết
- Khóa `relationship` đổi sang tiếng Anh (`npc/closeness/trust/pressure`) cho khớp quy ước schema; **spec FR3.2 đã được cập nhật**.
- Loader chặt hơn spec: vòng lặp không lối thoát là **lỗi** (spec chỉ yêu cầu cảnh báo node mồ côi).
- Thêm `tests/dialogue-schema.test.ts` và `tests/dialogue-qa.test.ts` ngoài danh sách file dự kiến trong tasks.
- **Hạn chế đã biết (không tính lỗi):** mỗi NPC chỉ gắn một cây thoại, chưa chọn theo ngày — cây "Huy bị nghi" chạy cả khi nói chuyện Ngày 1. Việc chọn cây theo ngày/sự kiện thuộc feature nhiệm vụ.
- Vấn đề cũ của feature NPC (ngoài phạm vi): lịch Huy/Thư/Ngân Trinh đứng ở dải hành lang trên cùng của lớp 12, trong khi lớp 12 ở tầng trệt.

## Điều kiện để PASS
1. **Chụp màn hình chế độ cảm ứng** ở node 4 lựa chọn của cảnh "Huy bị nghi" (`?touch=1`, Ngày 3 khoảng 1 ở hành lang lớp 12) để xác nhận không đè D-pad. Chưa làm được vì pane trình duyệt đang ẩn nên game không chạy bình thường.
2. **Đi hết cả 3 cây và mọi nhánh trong trình duyệt** (console sạch), hoặc đóng bằng e2e tự động.

## Khuyến nghị
- **E2E bằng Playwright** để đóng AC1/AC4/AC5/AC9 một cách tự động. Cần anh duyệt cài `@playwright/test` (devDependency) và `npx playwright install chromium` (~150 MB). E2E phải chạy trên dev server vì `?area=&day=&period=` và `window.__game` chỉ có ở chế độ dev. Kịch bản đề xuất của QA: (1) Kiệt: đi tới, bấm E, chọn, kiểm flag và HUD không đổi, không lỗi console; (2) Huy: có/không có flag Kiệt → 2/1 lựa chọn, 4 hành động ở 4 lần chạy; (3) NPC thường (Thư): thoại 1 trang, không đổi flags; (4) cảm ứng (`hasTouch`): ảnh chụp hộp không đè D-pad; (5) đi hết 3 cây, không `pageerror`.
- Khi làm feature nhiệm vụ/sự kiện: thêm cơ chế chọn cây thoại theo ngày/điều kiện.
- Khi làm feature quan hệ: định nghĩa lại ngữ nghĩa điều kiện `relationship` (L2).
