// Hình học điều khiển cảm ứng (logic thuần, không phụ thuộc Phaser/DOM).
import type { Direction } from "./actions";

/** Hướng của D-pad từ vector (dx, dy) so với tâm; null nếu trong vùng chết. Chỉ 4 hướng, không đi chéo. */
export function dpadDirection(dx: number, dy: number, dead: number): Direction | null {
  if (Math.hypot(dx, dy) < dead) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

export function inCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
  return Math.hypot(px - cx, py - cy) <= r;
}

export function inRect(px: number, py: number, x: number, y: number, w: number, h: number): boolean {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}
