# Kịch bản MVP — "Hồi Trống Cuối" (BẢN NHÁP, chờ duyệt)

- Trạng thái: **Approved (người dùng duyệt 2026-09-30)**.
- Ngày: 2026-09-30
- Căn cứ: `idea.md`, `docs/vision/vision.md`, `docs/features/khung-game-va-ban-do/spec.md` (Approved), ADR 001–003.
- Vai trò tài liệu: **tầng thiết kế nội dung xuyên suốt (Game Design Document)** ở mức `docs/product/`, là nguồn chân lý cho các feature nội dung tách ra sau.

**Quyết định người dùng đã chốt (2026-09-30):**
- Bí ẩn = **hiểu lầm + lời nói dối**; sự việc gốc = **lộ đề kiểm tra**.
- 2 kết thúc = **Hoài niệm + Sự thật**.
- 5 tuyến chính + **lớp NPC phụ tương tác được**; **cá biệt và người bạn biến mất là 2 người khác nhau**.
- Nhân vật chính **cố định**, tập trung **lớp 12A3** (lớp cũ của người dùng).
- **Có cơ chế thời tiết (mưa)** cho NPC nhân chứng ẩn.
- 3 mini-game: **né giám thị / ném rổ / chuyền giấy**.

> Ghi chú SPDD: quy ước **định dạng dữ liệu nội dung** (NPC/lịch/hội thoại/nhiệm vụ/quà/flag/thời tiết bằng JSON + zod) là quyết định xuyên feature → cần **ADR 004 (Proposed)** trước khi implement. Xem mục 13.

---

## 1. Nhân vật chính

- Tên: **Lê Hoàng Thiện** — nam.
- Lớp: **12A3** (dãy hành lang lớp 12, tầng trệt — khớp bản đồ FR3.8).
- Xưng hô: "mình/tớ" với bạn, "em" với thầy cô.
- Bối cảnh: ở hiện tại, Thiện trở về trường cũ trước ngày trường bị sửa/phá. Tiếng trống cuối ngày đưa Thiện về lại tuần cuối lớp 12. Thiện mang **hối tiếc trung tâm**: năm ấy chính mình cũng đã im lặng và hiểu lầm người bạn tên Nguyên.
- Vai trò trong bí ẩn: vừa điều tra, vừa **là một mảnh của lỗi lầm** (không phải người ngoài cuộc trong sạch) — đúng trụ cột "không lựa chọn nào hoàn toàn tốt".

---

## 2. Bí ẩn trung tâm & "sự thật" (ai giữ mảnh nào)

**Sự việc gốc (dòng thời gian "thật", trước ngày bế giảng năm ấy):** **đề kiểm tra cuối kỳ bị lộ**. Nghi ngờ dồn về **Hồ Thị Phương Nguyên**. Nguyên không thanh minh, **nhận phần lỗi rồi âm thầm chuyển trường**; nhóm bạn tan rã vì mỗi người ôm một nửa sự thật.

**Sự thật thật sự (người chơi dần ghép lại):**

| Nhân vật | Mảnh sự thật họ nắm / che giấu |
|---|---|
| **Lê Hoàng Huy** (cá biệt) | Người **vô tình liên quan** đến việc lộ đề, làm vì một lý do đáng thương (che cho người khác/hoàn cảnh). Vốn mang tiếng "cá biệt" nên buông xuôi, không thanh minh. |
| **Hồ Thị Phương Nguyên** (biến mất) | Biết Huy sẽ "hết đường" nếu thêm tội, nên **nhận lỗi thay để bảo vệ Huy**. Chỉ xuất hiện đầu tuần và qua **thư từ + phiên đêm**. Dường như biết Thiện sẽ quay lại. |
| **Nguyễn Trần Anh Kiệt** (bạn thân cũ) | Biết Nguyên vô tội nhưng **nói dối một chi tiết** để tự bảo vệ; sống với mặc cảm nên vui vẻ giả tạo. |
| **Trịnh Minh Thư** (lớp trưởng) | Vì áp lực giữ danh dự lớp/thành tích, đã **vô tình đẩy nghi ngờ** về Nguyên nhanh hơn cần thiết. |
| **Nguyễn Ngọc Ngân Trinh** (văn nghệ) | **Chứng kiến một phần** sự thật nhưng im lặng vì khi đó đang rối chuyện gia đình cấm theo nghệ thuật. |
| **Lê Hoàng Thiện** (nhân vật chính) | Đã **im lặng và hiểu lầm** Nguyên — điều dang dở kéo Thiện quay về. |

→ Mỗi tuyến đóng góp một mảnh vào bí ẩn chính (đúng yêu cầu `idea.md`).

---

## 3. Hồ sơ 5 NPC chính (character bible)

Chỉ số khởi đầu theo thang 0–100 (luật ở mục 7). Mặc định các NPC chính học **12A3** cùng Thiện.

### 3.1 Trịnh Minh Thư — Lớp trưởng (nữ, 12A3)
- Lai lịch: học giỏi, luôn "hoàn hảo", gánh kỳ vọng gia đình & danh dự lớp.
- Động cơ: giữ mọi thứ trong tầm kiểm soát; sợ sai sót ảnh hưởng hồ sơ.
- Bí mật: chính mình đã vội đẩy nghi ngờ về Nguyên năm ấy.
- Cung cảm xúc: cứng nhắc/xa cách → thừa nhận mình cũng có lỗi.
- Chỉ số đầu: Thân thiết 30 · Tin tưởng 25 · Áp lực 70.
- Quà ưa thích: sổ tay/bút đẹp. Nhiệm vụ liên quan: trực nhật, báo tường.

### 3.2 Nguyễn Trần Anh Kiệt — Bạn thân cũ (nam, 12A3)
- Lai lịch: bạn thân nhất của Thiện; hoạt ngôn, hay đùa.
- Động cơ: được yêu quý, tránh phải đối diện quá khứ.
- Bí mật: nói dối một chi tiết để thoát trách nhiệm.
- Cung cảm xúc: vui vẻ giả tạo → dám nói thật.
- Chỉ số đầu: Thân thiết 65 · Tin tưởng 40 · Áp lực 45.
- Quà ưa thích: đồ ăn vặt cổng trường. Nhiệm vụ: nhiều manh mối "sớm" đến từ Kiệt.

### 3.3 Lê Hoàng Huy — Học sinh cá biệt (nam, 12A3)
- Lai lịch: hay bị đổ lỗi, ngồi cuối lớp, thực ra tử tế ngầm.
- Động cơ: bảo vệ một người khác; không tin ai sẽ tin mình.
- Bí mật: **vô tình liên quan việc lộ đề** vì một lý do đáng thương.
- Cung cảm xúc: bất cần/phòng thủ → mở lòng khi được tin.
- Chỉ số đầu: Thân thiết 15 · Tin tưởng 10 · Áp lực 60.
- Quà ưa thích: đồ sửa xe/vật nhỏ hữu dụng. **Nhiệm vụ ẩn quan trọng gắn với Huy.**

### 3.4 Nguyễn Ngọc Ngân Trinh — Thành viên văn nghệ (nữ, 12A3)
- Lai lịch: mê hát/vẽ, chuẩn bị tiết mục bế giảng; gia đình phản đối nghệ thuật.
- Động cơ: được sống với đam mê; sợ làm gia đình thất vọng.
- Bí mật: chứng kiến một phần sự thật nhưng đã im lặng.
- Cung cảm xúc: né tránh → dám lên tiếng.
- Chỉ số đầu: Thân thiết 45 · Tin tưởng 35 · Áp lực 55.
- Quà ưa thích: băng cassette/nhãn vở dễ thương. Nhiệm vụ: tập văn nghệ, báo tường.

### 3.5 Hồ Thị Phương Nguyên — Người bạn biến mất (nữ, từng 12A3)
- Lai lịch: bạn cũ Thiện rất quý; đã chuyển trường sau ngày bế giảng.
- Vai trò: xuất hiện **thoáng ở đầu tuần**, sau đó chỉ qua **thư từ tìm được** và **phiên đêm "trường ký ức"**.
- Cung cảm xúc: bí ẩn/xa xăm → được minh oan hoặc được buông bỏ (tùy kết thúc).
- Không dùng 3 chỉ số như NPC thường; thay bằng **tiến độ "trang lưu bút của Nguyên" (0–5 trang)**.

---

## 4. Lớp NPC phụ tương tác được

Sống trong đúng 6 khu vực MVP. Trò chuyện ngắn **không tiêu khoảng**; chỉ hoạt động gắn `cost:1` mới tốn khoảng (FR4.3).

| NPC phụ | Khu vực | Tương tác | Vai trò |
|---|---|---|---|
| Bác bảo vệ / giám thị | Cổng trường | Mini-game né giám thị (đi trễ) | Không khí; khóa/mở cổng theo khoảng |
| Cô bán kem (xe kem) | Cổng trường | Mua kem (làm quà tặng), câu đùa | Nguồn quà + tin đồn nhẹ |
| Chú xe cháo lòng | Cổng trường | Món giới hạn theo khoảng; tin đồn | "Mua trước khi hết món" |
| Bác tài xe buýt 67 | Cổng trường | Thoại hoài niệm; về nhà cuối ngày | Nhịp kết ngày |
| Bác lao công | Sân chính | Nhặt được vật kỷ niệm → **quà ẩn** | Rải collectible |
| Nhóm học sinh nền | Sân chính / hành lang | Nghe tin đồn (mỗi ngày khác) | Gợi ý manh mối gián tiếp |
| Cô chủ nhiệm | Hành lang lớp 12 | Nhiệm vụ trực nhật; nhắc bài | Mốc "trong giờ học" |
| **Em lớp 10 "trú mưa"** | Hành lang lớp 10 | **Chỉ xuất hiện khi trời mưa**; kể một câu chứng kiến then chốt | **NPC nhân chứng ẩn** (mục 5, 8) |
| Nhóm bóng rổ | Sân thể chất | Mini-game ném rổ | Tăng quan hệ + thư giãn |
| Thầy thể dục | Sân thể chất | Thoại; mở/khóa hoạt động | Không khí |

> Sân thượng: **khóa** (FR3.5), mở ở Ngày 6 nếu đủ điều kiện (mục 6, 11).

---

## 5. Thời tiết & lịch NPC theo ngày/khoảng (nối `khoảng-đổi`/`ngày-đổi` — FR4.8)

### 5.1 Cơ chế thời tiết (mưa)
- Mỗi ngày có trạng thái thời tiết dữ liệu: `nắng` / `mưa` (khai báo trong `data/`, không viết cứng).
- **Ngày mưa** mở NPC nhân chứng ẩn (em lớp 10 "trú mưa" ở hành lang lớp 10) và một số thoại/manh mối riêng.
- Đề xuất: **Ngày 5 là ngày mưa** (đồng bộ với "lá thư đầu tiên của Nguyên"). Có thể thêm 1 ngày mưa ngẫu nhiên ở bản đầy đủ.

### 5.2 Lịch NPC
Mỗi NPC có bảng "ở đâu vào khoảng nào" (0=Trước giờ, 1=Trong giờ, 2=Ra chơi, 3=Sau giờ). Ví dụ ngày thường:

| NPC | K0 | K1 | K2 | K3 |
|---|---|---|---|---|
| Thư | Sân chính | Lớp 12A3 | Hành lang 12 | Lớp (ở lại) |
| Kiệt | Cổng trường | Lớp 12A3 | Sân thể chất | Cổng trường |
| Huy | (vắng) | Lớp 12A3 | Sau trường / sân thể chất | Sân thể chất |
| Ngân Trinh | Sân chính | Lớp 12A3 | Hành lang (tập) | Tập văn nghệ |

- "Chỉ gặp được khi đúng khoảng/đúng nơi" tạo **sức ép chọn lựa** (không gặp hết mọi người trong 1 ngày).
- Bảng đầy đủ 5 NPC × 7 ngày × 4 khoảng nằm trong `data/` (feature NPC), không viết cứng trong code.

---

## 6. Beat sheet 6 ngày (MVP — khớp N=6 của khung game)

6 ngày học (Thứ Hai → Thứ Bảy, bỏ Chủ nhật) × 4 khoảng = 24 lượt. Cột "Sự kiện chính" là nhịp bắt buộc; phần còn lại người chơi tự chọn.

| Ngày | Thứ | Sự kiện chính / nhịp cảm xúc | Mở khóa |
|---|---|---|---|
| 1 | Hai | Tỉnh dậy trong quá khứ. Hướng dẫn điều khiển. Gặp lại Kiệt; **thoáng thấy Nguyên** rồi mất hút. Phát hiện **lưu bút mất nhiều trang**. Mini-game **né giám thị**. | Lưu bút (trang 0), cái tên "Nguyên" |
| 2 | Ba | Làm quen không khí lớp 12A3, gặp Thư. **Tin đồn đầu tiên** về "chuyện ngày bế giảng". Nhiệm vụ hằng ngày bắt đầu. | Quà ẩn #1; nhiệm vụ hằng ngày |
| 3 | Tư | Gặp Huy; vụ **đổ lỗi vặt** → **lựa chọn hành động đầu tiên có hệ quả** (mục 9). Manh mối "đề kiểm tra". **Phiên đêm #1** (đêm Ngày 3). | Phiên đêm #1; trang lưu bút Huy |
| 4 | Năm | Tuyến Ngân Trinh + **tập văn nghệ**; mini-game **chuyền giấy**. Mâu thuẫn chỉ số lộ ra (giúp người này mất lòng người kia). | Trang lưu bút Ngân Trinh |
| 5 | Sáu (**mưa**) | Các mảnh sự thật hé lộ, lời kể mâu thuẫn. **NPC nhân chứng ẩn** xuất hiện (trời mưa). **Lá thư đầu tiên của Nguyên**. Mini-game **ném rổ**. **Phiên đêm #2** (đêm Ngày 5, then chốt). | Thư Nguyên #1; manh mối nhân chứng; Phiên đêm #2 |
| 6 | Bảy (bế giảng) | Cao trào điều tra; **quyết định lớn**: bảo vệ ai / phơi bày gì. **Mở khóa sân thượng** nếu đủ trang lưu bút. Ngày bế giảng → **rẽ nhánh kết thúc** theo flag (mục 11). | Kết Hoài niệm / Kết Sự thật |

---

## 7. Hệ thống quan hệ 3 chỉ số (luật)

Mỗi NPC chính có 3 chỉ số 0–100: **Thân thiết**, **Tin tưởng**, **Áp lực**.

- **Thân thiết**: quý Thiện đến đâu. Tăng bởi: tặng quà đúng sở thích, thoại dễ nghe, thắng mini-game cùng họ.
- **Tin tưởng**: sẵn sàng kể bí mật đến đâu. Tăng bởi: **nói thật/điều khó nghe đúng lúc**, giữ lời, hoàn thành nhiệm vụ giúp họ. **Không** tăng chỉ nhờ nịnh.
- **Áp lực**: trạng thái tâm lý. Cao → NPC né tránh, dễ mất Tin tưởng nếu bị ép.
- **Ngưỡng mở nội dung (đề xuất):** Tin tưởng ≥ 60 mở thoại bí mật/trang lưu bút; Áp lực > 70 khóa thoại sâu đến khi giảm.
- **Đánh đổi:** bênh bạn trước lớp → +Thân thiết nhưng −Tin tưởng của giáo viên; nói thật → +Tin tưởng nhưng có thể −Thân thiết tạm. **Không có lựa chọn hoàn toàn tốt.**
- Không có "game over"; chỉ số chỉ đổi **nội dung mở được** và **kết thúc**.

---

## 8. Nhiệm vụ

### 8.1 Hằng ngày (lặp, nhẹ, có thể bỏ qua)
Trực nhật buổi sáng; mua đồ ăn giờ ra chơi (món giới hạn); bắt đúng xe buýt về. Thưởng nhỏ: quan hệ, quà, tin đồn.

### 8.2 Theo tuyến (5 tuyến chính)
Mỗi tuyến 2–3 bước trải trong tuần, kết bằng một trang lưu bút + một mảnh sự thật. Ví dụ tuyến Huy: (1) bênh/không bênh khi bị đổ lỗi → (2) đưa vật hữu dụng/sửa xe giúp → (3) Huy hé lộ lý do thật.

### 8.3 Nhiệm vụ ẩn (hidden quests)
Không hiện trong lưu bút tới khi **kích hoạt bằng điều kiện**:
- Chỉ mở khi **Tin tưởng ≥ 60** với một NPC.
- **Chỉ xuất hiện khi trời mưa** (em lớp 10 nhân chứng — Ngày 5).
- Chỉ mở sau khi **ghép đủ 3 trang lưu bút** liên quan.
- Chuỗi ẩn xuyên tuần dẫn tới **mở khóa sân thượng** (điều kiện kết thúc Sự thật).

---

## 9. Hệ thống lựa chọn bằng hành động

Chọn bằng **hành động**, không chỉ câu thoại. Mẫu tình huống (Ngày 3 — Huy bị nghi):
1. Đứng ra nhận thay bạn.
2. Đưa bằng chứng cho giáo viên.
3. Im lặng để bảo vệ một bí mật khác.
4. Điều tra người thực sự gây ra.

Mỗi lựa chọn đặt/lật **flag** và dịch chỉ số khác nhau; không lựa chọn nào trọn vẹn. Flag tích lũy → quyết định kết thúc (mục 11).

---

## 10. Lưu bút · Ký ức · Quà ẩn · Phiên đêm

### 10.1 Lưu bút (nhật ký nhiệm vụ + chìa khóa ký ức)
Mỗi trang: chân dung NPC · một câu viết trong lưu bút · chi tiết còn mâu thuẫn · manh mối liên quan · vật kỷ niệm sưu tầm. **Phục hồi trang** khi hiểu rõ một nhân vật/ghép đúng ký ức. Ghép đủ trang đúng thứ tự → mở **ký ức quan trọng**.

### 10.2 Quà ẩn / vật sưu tầm
Đề xuất: vé xe buýt cũ, băng cassette, ảnh lớp, bút kỷ niệm, mẩu thư. Vị trí: bác lao công (sân chính), góc khuất hành lang, phần thưởng mini-game/nhiệm vụ ẩn. Vật đúng sở thích → **quà tặng** tăng quan hệ.

### 10.3 Phiên đêm "trường ký ức" (2 phiên trong MVP)
Sau tiếng trống chiều Ngày 3 và Ngày 5: trường vắng, tông xanh tím, phòng đổi vị trí, hội thoại cũ phát lại như bóng ma. Giải câu đố dựa trên vật dụng/ký ức ban ngày để **phục hồi trang lưu bút của Nguyên**. Tượng trưng, **không phải kinh dị**.

---

## 11. Hai kết thúc (điều kiện flag — đề xuất)

- **Kết Hoài niệm:** Thiện **chấp nhận không cứu được tất cả**, hoàn tất lời nhắn cho Nguyên, buông bỏ, trở về hiện tại nhẹ nhõm.
  - Điều kiện: đạt **đủ "thấu hiểu"** (≥ 3/5 tuyến có Tin tưởng ≥ 60) **nhưng chưa** thu đủ manh mối để minh oan công khai.
- **Kết Sự thật:** Thiện **làm sáng tỏ** ai thật sự gây ra, **minh oan cho Nguyên** — nhưng cái giá là **một quan hệ đổ vỡ** (một người bạn bị lộ và xa cách).
  - Điều kiện: thu đủ **5/5 trang lưu bút của Nguyên** + mở khóa **sân thượng** + hoàn thành **đối chất Ngày 6**.
- Khung hỗ trợ mở rộng 5 kết thúc ở bản đầy đủ (Đoàn tụ / Mắc kẹt / Hoàn chỉnh) — ngoài phạm vi MVP.

---

## 12. Kinh tế thời gian (cân bằng)

- Quỹ: **24 lượt** (6 ngày × 4 khoảng); đi lại **không** tốn khoảng, chỉ hoạt động `cost:1` tốn (FR4.3).
- Ước lượng: ~7–9 lượt cho nhịp bắt buộc + 2 phiên đêm; còn ~14 lượt tự do cho quan hệ/nhiệm vụ/mini-game.
- Chủ đích: **không đủ thời gian làm hết** → buộc chọn tuyến ưu tiên → tăng giá trị chơi lại. Cần playtest tinh chỉnh.

---

## 13. Đề xuất tách feature (sau khi duyệt GDD) & ADR cần

Thứ tự chạy `/spec`:
1. `he-thong-npc-va-lich` — NPC, vị trí, lịch theo ngày/khoảng, **thời tiết**, NPC phụ tương tác được.
2. `he-thong-hoi-thoai` — hội thoại nhánh + lựa chọn + lựa chọn-bằng-hành-động + flag.
3. `he-thong-quan-he` — 3 chỉ số, ngưỡng, đánh đổi.
4. `he-thong-nhiem-vu` — nhiệm vụ hằng ngày, theo tuyến, ẩn.
5. `luu-but-va-ky-uc` — nhật ký + phục hồi trang + ghép ký ức.
6. `qua-an-va-suu-tam` — collectible + tặng quà.
7. `mini-game` — né giám thị / ném rổ / chuyền giấy.
8. `phien-dem-truong-ky-uc` — 2 phiên đêm.
9. `ket-thuc` — 2 kết thúc + điều kiện flag.

**ADR liên quan:**
- **ADR 004 — Định dạng dữ liệu nội dung** (đã tạo 2026-09-30, **Proposed**): schema JSON + zod cho NPC/lịch/thời tiết/hội thoại/nhiệm vụ/quà/flag, nối tiếp ADR 002. Xem `docs/architecture/decisions/004-dinh-dang-du-lieu-noi-dung.md`.

---

## 14. Điểm đã chốt & phần để ngỏ

**Đã chốt (2026-09-30):** tên người bạn biến mất = **Hồ Thị Phương Nguyên** (nữ); các NPC chính học **12A3**; ngày mưa cố định = **Ngày 5**; GDD **Approved**; **tách ADR 004**.

**Để ngỏ, tinh chỉnh khi implement (không chặn tiến độ):**
- Con số chỉ số khởi đầu và ngưỡng mở nội dung (cần playtest).
- Chi phí khoảng cụ thể của từng hoạt động (cân bằng quỹ 28 lượt).
- Nội dung câu đố 2 phiên đêm và danh mục quà ẩn chi tiết (chốt ở từng feature spec).
