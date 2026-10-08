// E2E hội thoại nhánh (spec he-thong-hoi-thoai: AC1–AC5, AC9, AC10 ở mức cảnh Phaser) — điều khiển bằng bàn phím thật.
// Sau mỗi test, fixture tự động khẳng định không có console.error / pageerror (AC9).
import { choose, expect, frames, openGame, placePlayer, press, probe, readUntilChoosing, readUntilClosed, setFlag, test, walkTo } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

const KIET = "Nguyễn Trần Anh Kiệt";
const HUY = "Lê Hoàng Huy";

test.describe("Kiệt mở đầu — đi bộ thật tới NPC (AC1, AC4)", () => {
  const paths = [
    { index: 0, label: "Đùa lại như ngày xưa", flag: "ngay1.dua-lai-kiet", reply: "Haha, đúng chất rồi! Ra chơi nhớ xuống sân thể chất nhé." },
    { index: 1, label: "Hỏi: hôm nay thứ mấy?", flag: "ngay1.hoi-thu", reply: "Thứ Hai chứ thứ mấy! Mày ngủ gật hả?" },
    { index: 2, label: "Nhắc chuyện ngày bế giảng", flag: "ngay1.nhac-be-giang", reply: "..." },
  ];

  for (const p of paths) {
    test(`đi tới Kiệt rồi chọn "${p.label}" → đặt flag, kết thúc, thời gian không đổi`, async ({ page }) => {
      await openGame(page, "area=cong-truong&day=1&period=0");
      const before = await probe(page);

      // đi bộ thật: sang trái dọc hàng dưới rồi lên (đi thẳng lên từ spawn sẽ vướng bác bảo vệ)
      await walkTo(page, "x", 120, -1);
      await walkTo(page, "y", 128, -1);
      expect((await probe(page)).prompt).toBe(`[E] ${KIET}`);

      await press(page, "KeyE");
      let s = await probe(page);
      expect(s.dialog).toMatchObject({ open: true, choosing: false, speaker: KIET, body: "Ê Thiện! Mày làm gì đứng ngẩn ra đấy?" });

      s = await readUntilChoosing(page);
      expect(s.dialog.speaker).toBe(""); // lời dẫn không có người nói
      expect(s.dialog.rows).toEqual(["▶ Đùa lại như ngày xưa", "  Hỏi: hôm nay thứ mấy?", "  Nhắc chuyện ngày bế giảng"]);

      await choose(page, p.index);
      s = await probe(page);
      expect(s.dialog.body).toBe(p.reply);
      expect(s.flags).toEqual({ [p.flag]: true });

      await readUntilClosed(page);
      s = await probe(page);
      expect(s.dialog.open).toBe(false);
      expect([s.day, s.period]).toEqual([before.day, before.period]); // AC4: không tiêu khoảng
      expect(s.flags).toEqual({ [p.flag]: true });
    });
  }

  test("Esc khi đang hội thoại không mở menu tạm dừng (FR6.3); nhấn ↓ lúc đọc không dồn sang lúc chọn", async ({ page }) => {
    await openGame(page, "area=cong-truong&day=1&period=0");
    await walkTo(page, "x", 120, -1);
    await walkTo(page, "y", 128, -1);
    await press(page, "KeyE");
    await press(page, "Escape");
    let s = await probe(page);
    expect(s.dialog.open).toBe(true);
    expect(s.menuOpen).toBe(false);

    for (let i = 0; i < 3; i++) await press(page, "ArrowDown"); // bấm ↓ khi đang ĐỌC
    s = await readUntilChoosing(page);
    expect(s.dialog.cursor).toBe(0);
    expect(s.dialog.rows[0]).toMatch(/^▶ /);
  });
});

test.describe("Cảnh Huy bị nghi — lựa chọn bằng hành động (AC2, AC3)", () => {
  /** Mở hội thoại với Huy (Ngày 3 giờ học, hành lang lớp 12). Dịch người chơi tới cạnh Huy vì anh đứng ở dải tầng trên. */
  async function talkToHuy(page: import("@playwright/test").Page) {
    await openGame(page, "area=hanh-lang-lop-12&day=3&period=1");
    await placePlayer(page, 344, 102);
    expect((await probe(page)).prompt).toBe(`[E] ${HUY}`);
    await press(page, "KeyE");
  }

  test("chưa có flag của Kiệt → chỉ 1 lựa chọn tiếp cận", async ({ page }) => {
    await talkToHuy(page);
    const s = await readUntilChoosing(page);
    expect(s.dialog.rows).toEqual(["▶ Hỏi thẳng: cậu có làm không?"]);
  });

  test("có flag 'ngay1.nhac-be-giang' → hiện thêm lựa chọn 'Nhắc chuyện Kiệt né tránh', chọn nó đặt flag mới", async ({ page }) => {
    await openGame(page, "area=hanh-lang-lop-12&day=3&period=1");
    await setFlag(page, "ngay1.nhac-be-giang");
    await placePlayer(page, 344, 102);
    await press(page, "KeyE");
    let s = await readUntilChoosing(page);
    expect(s.dialog.rows).toEqual(["▶ Hỏi thẳng: cậu có làm không?", "  Nhắc chuyện Kiệt né tránh"]);

    await choose(page, 1);
    s = await probe(page);
    expect(s.dialog).toMatchObject({ speaker: HUY, body: "Kiệt né à? Thằng đó biết nhiều hơn nó chịu nói đấy." });
    expect(s.flags).toEqual({ "ngay1.nhac-be-giang": true, "ngay3.nghi-kiet-giau": true });

    // chơi nốt đường này: huy-ve-kiet (2 trang) → node quyết định 4 hành động → kết thúc
    s = await readUntilChoosing(page);
    expect(s.dialog.rows).toHaveLength(4);
    await choose(page, 3);
    await readUntilClosed(page);
    expect((await probe(page)).flags).toEqual({ "ngay1.nhac-be-giang": true, "ngay3.nghi-kiet-giau": true, "ngay3.dieu-tra": true });
  });

  test("flag đặt ở Ngày 1 (Kiệt) còn nguyên khi sang cảnh khác ở Ngày 3 và mở khóa lựa chọn của Huy", async ({ page }) => {
    await openGame(page, "area=cong-truong&day=1&period=0");
    await walkTo(page, "x", 120, -1);
    await walkTo(page, "y", 128, -1);
    await press(page, "KeyE");
    await readUntilChoosing(page);
    await choose(page, 2); // "Nhắc chuyện ngày bế giảng"
    await readUntilClosed(page);
    expect((await probe(page)).flags).toEqual({ "ngay1.nhac-be-giang": true });

    // sang hành lang lớp 12, Ngày 3 giờ học — scene.restart giữ nguyên phiên chơi như khi đi qua lối ra
    await page.evaluate(() => {
      const sc = (window as any).__game.scene.getScene("Area");
      sc.session.time.restore({ day: 3, period: 1 });
      Object.assign(sc.session.state, { day: 3, period: 1 });
      sc.scene.restart({ areaId: "hanh-lang-lop-12", spawn: "default" });
    });
    await page.waitForFunction(() => (window as any).__game.scene.getScene("Area").session.state.areaId === "hanh-lang-lop-12");
    await frames(page, 6);
    await placePlayer(page, 344, 102);
    await press(page, "KeyE");
    const s = await readUntilChoosing(page);
    expect(s.dialog.rows).toEqual(["▶ Hỏi thẳng: cậu có làm không?", "  Nhắc chuyện Kiệt né tránh"]);
  });

  const actions = [
    { index: 0, label: "Đứng ra nhận thay Huy", flag: "ngay3.nhan-thay", speaker: "Cô chủ nhiệm", body: "Em nhận? Vậy chiều nay em lên phòng giáo vụ gặp cô." },
    { index: 1, label: "Đưa mảnh giấy cho cô", flag: "ngay3.dua-bang-chung", speaker: "Cô chủ nhiệm", body: "Mảnh giấy này... cô sẽ xem lại. Huy, em không còn bị nghi nữa." },
    { index: 2, label: "Im lặng, giữ bí mật", flag: "ngay3.im-lang", speaker: "", body: "Mình cúi đầu. Cô chủ nhiệm hỏi, cả lớp im phăng phắc." },
    { index: 3, label: "Âm thầm đi điều tra", flag: "ngay3.dieu-tra", speaker: "", body: "Mình chưa nói gì, chỉ ghi nhớ từng chi tiết." },
  ];

  for (const a of actions) {
    test(`hành động "${a.label}" → đúng 1 flag riêng, nhánh riêng, kết thúc không tiêu khoảng`, async ({ page }) => {
      await talkToHuy(page);
      const before = await probe(page);
      let s = await readUntilChoosing(page);
      await choose(page, 0); // "Hỏi thẳng: cậu có làm không?"
      s = await readUntilChoosing(page);

      // node quyết định: đúng 4 lựa chọn hành động
      expect(s.dialog.rows).toEqual(["▶ » Đứng ra nhận thay Huy", "  » Đưa mảnh giấy cho cô", "  » Im lặng, giữ bí mật", "  » Âm thầm đi điều tra"]);
      expect(s.dialog.body).toBe("Cô chủ nhiệm sắp bước vào lớp. Phải quyết định ngay.");

      await choose(page, a.index);
      s = await probe(page);
      expect(s.dialog).toMatchObject({ speaker: a.speaker, body: a.body });
      expect(s.flags).toEqual({ [a.flag]: true });

      await readUntilClosed(page);
      s = await probe(page);
      expect(s.dialog.open).toBe(false);
      expect([s.day, s.period]).toEqual([before.day, before.period]);
      expect(s.flags).toEqual({ [a.flag]: true });
    });
  }
});

test.describe("NPC không có cây thoại (AC5)", () => {
  test("Thư chỉ hiện thoại tối thiểu 1 trang, không lựa chọn, không đổi flag", async ({ page }) => {
    await openGame(page, "area=hanh-lang-lop-12&day=3&period=1");
    await placePlayer(page, 184, 102);
    expect((await probe(page)).prompt).toBe("[E] Trịnh Minh Thư");
    await press(page, "KeyE");
    let s = await probe(page);
    expect(s.dialog).toMatchObject({ open: true, choosing: false, speaker: "", body: "Trực nhật xong chưa? Tuần này lớp mình bị nhắc rồi đấy." });
    await press(page, "KeyE");
    s = await probe(page);
    expect(s.dialog.open).toBe(false);
    expect(s.flags).toEqual({});
  });
});

test.describe("Cây bác lao công — menu lặp có lối ra và lựa chọn có điều kiện (AC3, AC10)", () => {
  test("lựa chọn 'mẩu thư' chỉ hiện sau khi hỏi bác nhặt được gì; thoát bằng 'Chào bác rồi đi'", async ({ page }) => {
    await openGame(page, "area=san-chinh&day=1&period=0");
    await placePlayer(page, 264, 182);
    expect((await probe(page)).prompt).toBe("[E] Bác lao công");
    await press(page, "KeyE");

    let s = await readUntilChoosing(page);
    expect(s.dialog.rows).toEqual(["▶ Hỏi bác nhặt được những gì", "  » Giúp bác quét sân", "  Chào bác rồi đi"]); // chưa có 'mẩu thư'

    await choose(page, 1); // Giúp bác quét sân → quay lại menu
    s = await readUntilChoosing(page);
    expect(s.dialog.rows).toHaveLength(3);

    await choose(page, 0); // Hỏi bác nhặt được những gì → menu có thêm lựa chọn
    s = await readUntilChoosing(page);
    expect(s.dialog.rows).toEqual(["▶ Hỏi bác nhặt được những gì", "  » Giúp bác quét sân", "  Hỏi về mẩu thư bác từng nhặt", "  Chào bác rồi đi"]);

    await choose(page, 2); // mẩu thư → menu
    s = await readUntilChoosing(page);
    expect(s.dialog.rows).toHaveLength(4);

    await choose(page, 3); // Chào bác rồi đi → kết thúc
    await readUntilClosed(page);
    s = await probe(page);
    expect(s.dialog.open).toBe(false);
    expect(s.flags).toEqual({ "bac-lao-cong.quet-san-giup": true, "bac-lao-cong.ke-do-nhat": true, "bac-lao-cong.hoi-mau-thu": true });
    expect([s.day, s.period]).toEqual([1, 0]);
  });
});
