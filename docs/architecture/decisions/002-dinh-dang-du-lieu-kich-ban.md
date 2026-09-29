# ADR 002: Định dạng dữ liệu kịch bản

- Status: Accepted (người dùng duyệt 2026-09-30)
- Date: 2026-09-30
- Người đề xuất: PM (dựa trên phân tích của architect)

## Context
Nội dung game (hội thoại, NPC, lịch sinh hoạt, lưu bút, mini-game) nhiều hơn code. Cần tách khỏi code để tác giả viết thêm dễ và tránh sai cấu trúc.

## Options
1. JSON + kiểm tra bằng schema (zod) trong thư mục `data/` — ưu: hợp TypeScript, bắt lỗi sớm. Nhược: JSON dài khó đọc khi viết thoại.
2. YAML — ưu: dễ viết thoại. Nhược: thêm thư viện parse, khó gõ kiểu.
3. Hard-code trong TypeScript — ưu: nhanh lúc đầu. Nhược: trộn nội dung với code, khó mở rộng.

## Decision
Chọn phương án 1 (xem mục Options).

## Consequences
Nếu chọn phương án 1: `data/npcs`, `data/dialogues`, `data/quests` (lưu bút), `data/maps` (Tiled), `data/minigames`; hiệu ứng lựa chọn (thay đổi chỉ số, cờ cốt truyện) khai báo dạng dữ liệu. Thêm thư viện zod (cần duyệt cùng ADR này).
