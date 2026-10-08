// Trợ giúp cho kịch bản e2e: mở game, đọc trạng thái, điều khiển bằng phím, thu lỗi console.
// Game lộ `window.__game` (Phaser.Game) ở chế độ dev; cảnh chính tên "Area". Các trường private trong TypeScript
// (session, dialog, prompt, player...) vẫn đọc được lúc chạy.
import { test as base, expect, type Page } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Probe {
  /** Nhắc "[E] Tên" đang hiện (rỗng nếu không hiện). */
  prompt: string;
  day: number;
  period: number;
  areaId: string;
  flags: Record<string, boolean>;
  player: { x: number; y: number };
  dialog: {
    open: boolean;
    choosing: boolean;
    speaker: string;
    body: string;
    rows: string[];
    cursor: number;
    boxY: number;
    boxH: number;
    /** Đáy dòng lựa chọn cuối (tọa độ màn hình game 320×180); 0 nếu không có lựa chọn. */
    rowsBottom: number;
  };
  /** Menu tạm dừng đang mở? (hội thoại không được mở nó giữa chừng — FR6.3) */
  menuOpen: boolean;
}

/** test có fixture tự động: sau mỗi test khẳng định KHÔNG có console.error / pageerror (AC9). */
export const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("console", (m) => {
        // 404 favicon không liên quan tới game
        if (m.type() === "error" && !/favicon/i.test(m.text() + m.location().url)) errors.push(`console.error: ${m.text()}`);
      });
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      await use(errors);
      expect(errors, "không được có lỗi console/pageerror").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Chờ `n` khung hình để game xử lý đầu vào. */
export async function frames(page: Page, n = 3): Promise<void> {
  await page.evaluate(
    (count) =>
      new Promise<void>((resolve) => {
        let left = count;
        const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick));
        requestAnimationFrame(tick);
      }),
    n,
  );
}

/** Mở game ở một khu vực/thời điểm (chỉ dev) và chờ cảnh Area sẵn sàng. */
export async function openGame(page: Page, query: string): Promise<void> {
  await page.goto(`/?${query}`);
  await page.waitForFunction(() => {
    const sc = (window as any).__game?.scene?.getScene?.("Area");
    return !!sc?.player && sc.sys.isActive();
  });
  await frames(page, 5);
}

export async function probe(page: Page): Promise<Probe> {
  return page.evaluate(() => {
    const sc = (window as any).__game.scene.getScene("Area");
    const d = sc.dialog;
    return {
      prompt: sc.prompt.visible ? sc.prompt.text : "",
      day: sc.session.time.day,
      period: sc.session.time.period,
      areaId: sc.session.state.areaId,
      flags: { ...sc.session.state.flags },
      player: { x: Math.round(sc.player.x), y: Math.round(sc.player.y) },
      dialog: {
        open: d.isOpen,
        choosing: d.isChoosing,
        speaker: d.speakerText.text,
        body: d.text.text,
        rows: d.rows.map((r: any) => r.text),
        cursor: d.cursor,
        boxY: d.box.y,
        boxH: d.bg.height,
        rowsBottom: d.rows.length ? d.box.y + Math.max(...d.rows.map((r: any) => r.y + r.height)) : 0,
      },
      menuOpen: sc.menu.isOpen,
    };
  });
}

/** Đặt cờ cốt truyện trực tiếp (dựng trạng thái từ cảnh khác mà không phải chơi lại). */
export async function setFlag(page: Page, name: string, value = true): Promise<void> {
  await page.evaluate(([n, v]) => ((window as any).__game.scene.getScene("Area").session.state.flags[n as string] = v), [name, value] as const);
}

/** Dịch người chơi tới sát một ô (bỏ qua việc đi bộ; dùng khi đích nằm xa/khó tới, ví dụ hành lang tầng trên). */
export async function placePlayer(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(([px, py]) => (window as any).__game.scene.getScene("Area").player.setPosition(px, py), [x, y] as const);
  await frames(page, 4);
}

/** Đi bộ thật bằng phím: giữ phím tới khi tọa độ `axis` vượt `target` theo hướng `dir` (-1 = giảm). */
export async function walkTo(page: Page, axis: "x" | "y", target: number, dir: -1 | 1): Promise<void> {
  const key = axis === "x" ? (dir < 0 ? "ArrowLeft" : "ArrowRight") : dir < 0 ? "ArrowUp" : "ArrowDown";
  await page.keyboard.down(key);
  await page.waitForFunction(
    ({ axis: a, target: t, dir: d }) => {
      const p = (window as any).__game.scene.getScene("Area").player;
      return d < 0 ? p[a] <= t : p[a] >= t;
    },
    { axis, target, dir },
  );
  await page.keyboard.up(key);
  await frames(page, 3);
}

export async function press(page: Page, code: "KeyE" | "ArrowDown" | "ArrowUp" | "Escape"): Promise<void> {
  await page.keyboard.press(code);
  await frames(page, 3);
}

/** Chọn lựa chọn thứ `index` trong danh sách đang hiện: ↓ đủ số lần rồi Tương tác. */
export async function choose(page: Page, index: number): Promise<void> {
  expect((await probe(page)).dialog.choosing, "phải đang hiện lựa chọn").toBe(true);
  for (let i = 0; i < index; i++) await press(page, "ArrowDown");
  expect((await probe(page)).dialog.cursor).toBe(index);
  await press(page, "KeyE");
}

/** Bấm Tương tác qua các trang cho tới khi hiện lựa chọn (hoặc đóng hộp thoại). */
export async function readUntilChoosing(page: Page, max = 12): Promise<Probe> {
  for (let i = 0; i < max; i++) {
    const s = await probe(page);
    if (s.dialog.choosing || !s.dialog.open) return s;
    await press(page, "KeyE");
  }
  throw new Error("Hội thoại không dừng ở lựa chọn hay đóng sau " + max + " lần bấm");
}

/** Bấm Tương tác tới khi hộp thoại đóng. Trả về số lần bấm. */
export async function readUntilClosed(page: Page, max = 12): Promise<number> {
  for (let i = 0; i < max; i++) {
    const s = await probe(page);
    if (!s.dialog.open) return i;
    if (s.dialog.choosing) throw new Error("Đang hiện lựa chọn, cần choose()");
    await press(page, "KeyE");
  }
  throw new Error("Hộp thoại không đóng sau " + max + " lần bấm");
}
