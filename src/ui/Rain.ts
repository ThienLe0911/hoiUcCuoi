// Hiệu ứng mưa nhẹ (T9), vẽ bằng Graphics theo không gian màn hình (scrollFactor 0).
// Chỉ dùng ở khu vực ngoài trời vào ngày mưa; giữ nhẹ để không tụt FPS.
import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
}

export class Rain {
  private g: Phaser.GameObjects.Graphics;
  private drops: Drop[] = [];

  constructor(scene: Phaser.Scene, count = 70) {
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(9000);
    for (let i = 0; i < count; i++) this.drops.push(this.make(true));
  }

  private make(spread: boolean): Drop {
    return {
      x: Math.random() * (GAME_WIDTH + 20) - 10,
      y: spread ? Math.random() * GAME_HEIGHT : -4,
      len: 4 + Math.random() * 5,
      speed: 140 + Math.random() * 90,
    };
  }

  /** dt: giây trôi qua khung trước. */
  update(dt: number): void {
    this.g.clear();
    this.g.lineStyle(1, 0x9fb8d6, 0.55);
    for (const d of this.drops) {
      d.y += d.speed * dt;
      d.x -= d.speed * 0.25 * dt; // nghiêng nhẹ
      if (d.y > GAME_HEIGHT) {
        Object.assign(d, this.make(false));
      }
      this.g.lineBetween(d.x, d.y, d.x - 1, d.y + d.len);
    }
  }

  destroy(): void {
    this.g.destroy();
  }
}
