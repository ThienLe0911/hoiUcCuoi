# Validation: Hệ thống NPC và lịch (he-thong-npc-va-lich)

- Trạng thái: **PASS** (sau khắc phục các phát hiện, 2026-09-30)
- Người kiểm: reviewer (đối chiếu spec, read-only) + qa (chạy test/build) — độc lập với người viết (PM). Người viết đã khắc phục và chạy lại.
- Căn cứ: spec.md (Approved), tasks.md, GDD, ADR 004.

## Kết quả kiểm thử tự động
- `npx tsc --noEmit`: sạch.
- `npx vitest run`: **96/96 test xanh** (11 file).
- `npm run build`: thành công; `dist` **1,6 MB** (≤ 5 MB — AC8).
- Bản build chạy qua máy chủ tĩnh (`vite preview`): `index` và bundle đều HTTP 200.
- Khởi động game (loadContent) với dữ liệu thật: không lỗi (đã kiểm trên trình duyệt).

## Đối chiếu Acceptance Criteria
| AC | Kết quả | Cách kiểm |
|---|---|---|
| AC1 (NPC đổi theo khoảng) | ĐẠT | test npc-flow/schedule + mắt (hành lang 12 giờ học) |
| AC2 (thoại không tiêu khoảng) | ĐẠT | mắt (bấm E bác bảo vệ, HUD giữ Ngày 1) + mã |
| AC3 (NPC nền không mở thoại nhánh) | ĐẠT | `hoc-sinh-nen-1` interactable=false + test |
| AC4 (mưa + nhân chứng ẩn Ngày 5) | ĐẠT | test npc-flow/weather + mắt (mưa cổng trường Ngày 5) |
| AC5 (đổi khoảng cập nhật NPC; không kẹt) | ĐẠT | mã `refreshNpcs` + test BFS không-kẹt |
| AC6 (dữ liệu sai bị báo lỗi) | ĐẠT | test: ô cản, đè exit, npc/area sai, trùng lịch |
| AC7 (test loader + tra cứu) | ĐẠT | vitest |
| AC8 (build ≤5MB, máy chủ tĩnh) | ĐẠT | build 1,6 MB + HTTP 200 |
| AC9 (không NPC nào làm kẹt) | ĐẠT | test BFS mọi khu vực/ngày/khoảng/thời tiết + loader chặn đè exit |

Ghi chú: AC2/AC3/AC5 phần hành vi cảnh Phaser được kiểm **thủ công trong trình duyệt** (không có e2e tự động); logic nền có test.

## Phát hiện & khắc phục
| Mã | Mức | Nội dung | Xử lý |
|---|---|---|---|
| H1 | Cao | Loader không chặn NPC đè lối exit / chokepoint (FR4.3, BR3, AC6, AC9) | **Đã sửa**: `validateSchedules` thêm `onExit`; `content.ts` truyền vào → báo lỗi khi nạp. Test BFS (qa) phủ khả năng đi tới exit. |
| M1 | TB | Loader lúc chạy không chặn "ngày ngoài khoảng" | **Đã sửa**: `content.ts` truyền `maxDay=TOTAL_DAYS`. |
| M2 | TB | Trùng mục "mọi thời tiết" và mục theo thời tiết → npcsInArea/npcPosition không nhất quán | **Đã sửa**: loader chặn cùng (npc,day,period) có cả `*` lẫn thời tiết cụ thể. |
| M3 | TB | Mọi NPC interactable=true → AC3 không có minh chứng | **Đã sửa**: `hoc-sinh-nen-1` interactable=false + test. |
| M4 | TB | Một số AC chỉ kiểm thủ công | Ghi nhận trong bảng AC ở trên. |
| L1–L5 | Thấp | Cosmetic (tên hiển thị, comment FR, chưa mờ khi refresh NPC, NPC phụ chưa phân biệt sprite) | Ghi nhận; xử lý ở việc cải thiện sprite (đề xuất riêng). |

## Việc để lại (không chặn PASS)
- **Sprite NPC người lớn/hàng quán chưa phân biệt** (L4): bác bảo vệ, bác lao công, cô bán kem… đang tái dùng sprite học sinh. Người dùng đã yêu cầu vẽ đẹp hơn → xử lý bằng tinh chỉnh spec FR8 + task riêng.
- **NPC chỉ có khung "nhìn xuống"**: `facing` trong lịch chưa dùng cho hướng sprite.
- **e2e Playwright** cho hành vi cảnh (tương tác, mưa, FPS): chỉ đề xuất, chưa thêm (tránh thêm thư viện khi chưa duyệt).
