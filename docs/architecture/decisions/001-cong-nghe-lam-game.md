# ADR 001: Công nghệ làm game

- Status: Accepted (người dùng duyệt 2026-09-30)
- Date: 2026-09-30
- Người đề xuất: PM (dựa trên phân tích của architect)

## Context
Game 2D pixel art top-down, nặng hội thoại, lựa chọn, NPC theo lịch, mini-game ngắn. Tác giả làm một mình, trình độ lập trình trung bình, muốn gửi link cho bạn bè chơi (ưu tiên trình duyệt, có thể cả điện thoại). Cần hiển thị tiếng Việt có dấu tốt. Dự án gameCoTiphu của tác giả đã dùng TypeScript + Vite.

## Options
1. Phaser 3 + TypeScript + Vite — ưu: engine 2D web có sẵn tilemap, sprite, scene, cảm ứng; cùng stack TS/Vite quen thuộc; xuất static, share link dễ. Nhược: phải học Phaser, tự viết lớp hội thoại. Công sức trung bình. (architect khuyến nghị)
2. Godot 4 export HTML5 — ưu: editor trực quan, ít code hạ tầng. Nhược: bản web nặng (~15–30MB), rủi ro trên điện thoại cũ, lệch stack, học GDScript.
3. TypeScript + Vite + Canvas 2D thuần — ưu: nhẹ, toàn quyền kiểm soát. Nhược: tự viết toàn bộ vòng lặp, tilemap, va chạm, camera; công sức cao.

## Decision
Chọn phương án 1: Phaser 3 + TypeScript + Vite. Kích thước tile 16×16 px, nhân vật khoảng 16×24 px (người dùng chọn cùng lúc).

## Consequences
Nếu chọn phương án 1: cần POC font pixel hỗ trợ đủ dấu tiếng Việt trước tiên; thiết kế điều khiển cảm ứng từ đầu; bản đồ dựng bằng Tiled (.tmj). Không cần server.
