# ADR 004: Định dạng dữ liệu nội dung (NPC, lịch, hội thoại, nhiệm vụ, quà, flag, thời tiết)

- Status: Accepted (người dùng duyệt 2026-09-30)
- Date: 2026-09-30
- Người đề xuất: PM

## Context
GDD `docs/product/kich-ban-mvp.md` (Approved) mở ra tầng nội dung lớn, xuyên nhiều feature: NPC và **lịch theo ngày/khoảng**, **thời tiết (nắng/mưa)**, hội thoại có nhánh + **lựa chọn bằng hành động**, hệ thống **quan hệ 3 chỉ số**, nhiệm vụ (hằng ngày/theo tuyến/ẩn), lưu bút + ký ức, quà/vật sưu tầm, và **cờ cốt truyện (flag)** quyết định 2 kết thúc.

ADR 002 (Accepted) đã chốt: nội dung tách khỏi code, để trong `data/`, dạng **JSON + kiểm tra bằng zod**, và nêu các thư mục khởi đầu (`data/npcs`, `data/dialogues`, `data/quests`, `data/maps`, `data/minigames`). ADR 004 **không đổi** quyết định đó; nó **chi tiết hóa schema** cho các loại nội dung mới ở GDD, để nhiều feature dùng chung một quy ước, tránh mỗi feature tự đặt cấu trúc rồi xung đột.

Ràng buộc: TypeScript + Vite + zod (ADR 001, 002); lưu game bằng localStorage (ADR 003) nên **flag và chỉ số quan hệ phải serialize gọn**; bộ đếm thời gian là module thuần logic phát `khoảng-đổi`/`ngày-đổi` (FR4.8) nên **lịch NPC và thời tiết tra cứu theo (ngày, khoảng)**.

## Options
1. **Một schema hợp nhất, tách theo thư mục loại nội dung** (mở rộng ADR 002): mỗi loại (`npcs`, `schedules`, `weather`, `dialogues`, `quests`, `gifts`, `flags`) một schema zod riêng, tham chiếu nhau bằng **id chuỗi ổn định**; loader nạp và kiểm tra khi khởi động, sai thì báo rõ file/trường. — Ưu: nhất quán, bắt lỗi sớm, khớp ADR 002, dễ cho nhiều feature. Nhược: cần một "sổ đăng ký id" để tránh trùng/orphan.
2. **Gộp tất cả nội dung một tuyến vào một file lớn** (mỗi NPC một file chứa cả thoại/nhiệm vụ/quà): — Ưu: viết một tuyến ở một chỗ. Nhược: khó tái dùng chung (quà, flag dùng chéo tuyến), file phình to, khó diff.
3. **Định dạng kịch bản riêng (DSL/ink…) cho hội thoại**: — Ưu: viết thoại nhánh mượt. Nhược: thêm công cụ/parser ngoài zod, lệch ADR 002, quá sức MVP.

## Decision
Chọn **phương án 1** (một schema hợp nhất, tách theo thư mục loại nội dung; các loại nội dung tham chiếu nhau bằng id chuỗi ổn định; loader nạp và kiểm tra bằng zod khi khởi động). Lý do: nhất quán và bắt lỗi sớm, khớp ADR 002, cho nhiều feature dùng chung một quy ước, tránh mỗi feature tự đặt cấu trúc rồi xung đột.

## Consequences
Nếu chọn phương án 1:
- Thư mục `data/` bổ sung: `data/npcs`, `data/schedules`, `data/weather`, `data/dialogues`, `data/quests` (gồm lưu bút), `data/gifts`, `data/flags`.
- **Quy ước id**: id chuỗi ổn định, không đổi khi sửa nội dung (vd `npc.huy`, `flag.ngay3_chon_nhan_thay`, `gift.ve_xe_buyt`). Tham chiếu chéo bằng id; loader kiểm tra id tồn tại (không orphan).
- **Lịch NPC**: tra theo `(npcId, ngày, khoảng)` → vị trí/khu vực; có biến thể theo `thời tiết`.
- **Thời tiết**: bảng theo ngày (`data/weather`), MVP đặt Ngày 5 = mưa; mở NPC nhân chứng ẩn.
- **Hiệu ứng lựa chọn** (đổi 3 chỉ số, đặt/lật flag) khai báo dạng dữ liệu trong node hội thoại (đúng tinh thần ADR 002).
- **Quan hệ & flag** đưa vào state lưu được (ADR 003); cần phiên bản schema để lưu cũ không vỡ.
- Việc phải làm tiếp: khi ADR này Accepted, các feature ở mục 13 của GDD `/spec` sẽ bám schema này; nếu phát sinh loại nội dung mới ngoài danh sách trên thì cập nhật ADR (hoặc ADR mới), không tự thêm quy ước rời rạc.
