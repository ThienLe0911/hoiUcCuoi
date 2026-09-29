# ADR 003: Cơ chế lưu game

- Status: Accepted (người dùng duyệt 2026-09-30)
- Date: 2026-09-30
- Người đề xuất: PM (dựa trên phân tích của architect)

## Context
Game một người chơi, không tài khoản. Cần lưu ngày/khoảng, vị trí, quan hệ NPC, cờ cốt truyện, trang lưu bút đã mở.

## Options
1. localStorage, một ô tự động + một ô thủ công, có số `version` để migrate — ưu: đơn giản, offline, không cần server. Nhược: mất khi xóa dữ liệu trình duyệt, không đồng bộ thiết bị.
2. Lưu đám mây (Firebase như gameMeoNo) — ưu: đồng bộ thiết bị. Nhược: cần tài khoản/hạ tầng, quá mức cho bản thử nghiệm.
3. Xuất/nhập file lưu — ưu: sao lưu thủ công. Nhược: bất tiện trên điện thoại.

## Decision
Chọn phương án 1 (xem mục Options).

## Consequences
Nếu chọn phương án 1: toàn bộ trạng thái game phải tuần tự hóa được thành JSON; mọi thay đổi cấu trúc lưu phải tăng `version`.
