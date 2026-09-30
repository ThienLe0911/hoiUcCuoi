// Điều khiển cảm ứng: D-pad ảo (trái), nút Tương tác (phải), nút Menu (góc trên phải).
// Đọc trực tiếp các con trỏ đang chạm mỗi khung hình nên hỗ trợ đa chạm và trượt ngón giữa các hướng.
import Phaser from "phaser";
import { FONT_FAMILY, GAME_WIDTH } from "../config";
import type { Action, ActionState, Direction } from "../core/actions";
import { dpadDirection, inCircle, inRect } from "../core/touch";

// Bố cục theo tọa độ khung 320×180. Vùng chạm ≥ 44px CSS ở màn hình phổ biến (phóng ≥ ~1,8×).
const DPAD = { x: 42, y: 136, r: 36, dead: 7 };
const INTERACT = { x: 284, y: 140, r: 19 };
const MENU = { x: GAME_WIDTH - 40, y: 4, w: 36, h: 24 };

const SOURCE = "touch";

export class TouchControls {
  private actions: ActionState;
  private scene: Phaser.Scene;
  private g: Phaser.GameObjects.Graphics;
  private held = new Set<Action>();
  private objects: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, actions: ActionState) {
    this.scene = scene;
    this.actions = actions;
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(50000);
    const label = (x: number, y: number, s: string, size = "12px") => {
      const t = scene.add.text(x, y, s, { fontFamily: FONT_FAMILY, fontSize: size, color: "#ffffff" }).setOrigin(0.5).setScrollFactor(0).setDepth(50001);
      this.objects.push(t);
      return t;
    };
    label(INTERACT.x, INTERACT.y, "OK", "16px");
    label(MENU.x + MENU.w / 2, MENU.y + MENU.h / 2, "Menu");
    this.objects.push(this.g);
    this.draw();
  }

  /** Gọi mỗi khung hình: đồng bộ hành động với các ngón đang chạm. */
  update(): void {
    const now = new Set<Action>();
    for (const p of this.scene.input.manager.pointers) {
      if (!p.isDown) continue;
      const dir = this.dpadAt(p.x, p.y);
      if (dir) now.add(dir);
      if (inCircle(p.x, p.y, INTERACT.x, INTERACT.y, INTERACT.r + 4)) now.add("interact");
      if (inRect(p.x, p.y, MENU.x - 2, MENU.y - 2, MENU.w + 4, MENU.h + 4)) now.add("menu");
    }
    let changed = false;
    for (const a of now) {
      if (!this.held.has(a)) {
        this.actions.press(a, SOURCE);
        changed = true;
      }
    }
    for (const a of this.held) {
      if (!now.has(a)) {
        this.actions.release(a, SOURCE);
        changed = true;
      }
    }
    this.held = now;
    if (changed) this.draw();
  }

  destroy(): void {
    for (const a of this.held) this.actions.release(a, SOURCE);
    this.held.clear();
    for (const o of this.objects) o.destroy();
  }

  private dpadAt(x: number, y: number): Direction | null {
    if (!inCircle(x, y, DPAD.x, DPAD.y, DPAD.r + 8)) return null;
    return dpadDirection(x - DPAD.x, y - DPAD.y, DPAD.dead);
  }

  private draw(): void {
    const g = this.g;
    g.clear();
    // D-pad
    g.fillStyle(0x10182b, 0.5).fillCircle(DPAD.x, DPAD.y, DPAD.r);
    g.lineStyle(1, 0xf2e6bc, 0.7).strokeCircle(DPAD.x, DPAD.y, DPAD.r);
    const arrow = (dir: Direction, pts: [number, number, number, number, number, number]) => {
      g.fillStyle(this.held.has(dir) ? 0xf6d743 : 0xffffff, this.held.has(dir) ? 0.95 : 0.65);
      g.fillTriangle(DPAD.x + pts[0], DPAD.y + pts[1], DPAD.x + pts[2], DPAD.y + pts[3], DPAD.x + pts[4], DPAD.y + pts[5]);
    };
    arrow("up", [0, -26, -8, -14, 8, -14]);
    arrow("down", [0, 26, -8, 14, 8, 14]);
    arrow("left", [-26, 0, -14, -8, -14, 8]);
    arrow("right", [26, 0, 14, -8, 14, 8]);
    // Tương tác
    g.fillStyle(this.held.has("interact") ? 0xf6d743 : 0x10182b, this.held.has("interact") ? 0.9 : 0.5).fillCircle(INTERACT.x, INTERACT.y, INTERACT.r);
    g.lineStyle(1, 0xf2e6bc, 0.7).strokeCircle(INTERACT.x, INTERACT.y, INTERACT.r);
    // Menu
    g.fillStyle(this.held.has("menu") ? 0xf6d743 : 0x10182b, this.held.has("menu") ? 0.9 : 0.5).fillRoundedRect(MENU.x, MENU.y, MENU.w, MENU.h, 4);
    g.lineStyle(1, 0xf2e6bc, 0.7).strokeRoundedRect(MENU.x, MENU.y, MENU.w, MENU.h, 4);
  }
}
