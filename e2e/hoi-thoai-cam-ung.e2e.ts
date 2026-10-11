// E2E chế độ cảm ứng (spec he-thong-hoi-thoai AC1: chọn bằng cảm ứng; bố cục hộp thoại đặt phía trên không đè D-pad).
// Dùng sự kiện chạm thật (CDP Input.dispatchTouchEvent) trên màn hình ngang 844×390 có hasTouch.
import type { Page } from "@playwright/test";
import { expect, frames, openGame, placePlayer, probe, test, type Probe } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Tọa độ nút theo khung game 320×180 (khớp src/ui/TouchControls.ts).
const INTERACT = { x: 284, y: 140 };
const DPAD = { x: 42, y: 136 };

/** Bộ điều khiển chạm: đổi tọa độ khung game sang tọa độ màn hình theo vị trí/tỉ lệ canvas, giữ ngón đủ lâu cho vòng lặp game đọc. */
async function touchControls(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  const hold = async (gx: number, gy: number, ms = 90) => {
    const box = await page.locator("canvas").boundingBox();
    if (!box) throw new Error("Không thấy canvas");
    const k = box.width / 320;
    const touchPoints = [{ x: box.x + gx * k, y: box.y + gy * k }];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints });
    await page.waitForTimeout(ms);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await frames(page, 3);
  };
  return {
    interact: () => hold(INTERACT.x, INTERACT.y),
    down: () => hold(DPAD.x, DPAD.y + 20),
    up: () => hold(DPAD.x, DPAD.y - 20),
    /** Bấm nút Tương tác qua các trang cho tới khi hiện lựa chọn (hoặc đóng hộp thoại). */
    async readUntilChoosing(max = 12): Promise<Probe> {
      for (let i = 0; i < max; i++) {
        const s = await probe(page);
        if (s.dialog.choosing || !s.dialog.open) return s;
        await hold(INTERACT.x, INTERACT.y);
      }
      throw new Error("Hội thoại không dừng ở lựa chọn hay đóng sau " + max + " lần chạm");
    },
  };
}

test("cảm ứng: mở bằng nút Tương tác, chọn bằng D-pad ↓ + nút Tương tác; hộp 4 lựa chọn không đè D-pad", async ({ page }, testInfo) => {
  await openGame(page, "area=hanh-lang-lop-12&day=3&period=1&touch=1");
  expect(await page.evaluate(() => (window as any).__game.scene.getScene("Area").touch)).toBe(true);
  await placePlayer(page, 344, 102);
  const before = await probe(page);
  expect(before.prompt).toBe("Lê Hoàng Huy"); // chế độ cảm ứng: nhắc không có tiền tố [E]

  const touch = await touchControls(page);
  await touch.interact(); // mở hội thoại
  expect((await probe(page)).dialog.open).toBe(true);

  let s = await touch.readUntilChoosing();
  expect(s.dialog.rows).toEqual(["▶ Hỏi thẳng: cậu có làm không?"]);
  await touch.interact(); // chọn lựa chọn đầu (con trỏ đang ở 0)
  s = await touch.readUntilChoosing();
  expect(s.dialog.rows).toEqual(["▶ » Đứng ra nhận thay Huy", "  » Đưa mảnh giấy cho cô", "  » Im lặng, giữ bí mật", "  » Âm thầm đi điều tra"]);

  // Bố cục (khung game 320×180): hộp đặt phía trên (dưới HUD ~y32), D-pad tâm (42,136) bán kính 36 chạm tới y=100.
  expect(s.dialog.boxY).toBe(34);
  expect(s.dialog.boxY + s.dialog.boxH).toBeLessThanOrEqual(106);
  expect(s.dialog.rowsBottom, "dòng lựa chọn cuối không được lấn xuống vòng D-pad quá vài pixel").toBeLessThanOrEqual(104);
  await page.screenshot({ path: testInfo.outputPath("cam-ung-4-lua-chon.png") });

  await touch.down(); // D-pad ↓
  s = await probe(page);
  expect(s.dialog.cursor).toBe(1);
  expect(s.dialog.rows[1]).toMatch(/^▶ » Đưa mảnh giấy cho cô/);
  await touch.up(); // D-pad ↑ quay lại
  expect((await probe(page)).dialog.cursor).toBe(0);
  await touch.down();

  await touch.interact(); // xác nhận
  s = await probe(page);
  expect(s.dialog).toMatchObject({ speaker: "Cô chủ nhiệm", body: "Mảnh giấy này... cô sẽ xem lại. Huy, em không còn bị nghi nữa." });
  expect(s.flags).toEqual({ "ngay3.dua-bang-chung": true });

  s = await touch.readUntilChoosing(); // hết nhánh → hộp đóng
  expect(s.dialog.open).toBe(false);
  expect([s.day, s.period]).toEqual([before.day, before.period]); // không tiêu khoảng
});
