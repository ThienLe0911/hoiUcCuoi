// HUD: "Ngày X · Thứ · Tên khoảng" và tên khu vực, luôn hiện ở góc trên trái.
import Phaser from "phaser";
import { FONT_FAMILY } from "../config";
import type { GameTime } from "../core/time";

export class Hud {
  private text: Phaser.GameObjects.Text;
  private last = "";

  constructor(scene: Phaser.Scene) {
    this.text = scene.add
      .text(4, 4, "", { fontFamily: FONT_FAMILY, fontSize: "12px", color: "#ffffff", backgroundColor: "#10182bcc", padding: { x: 3, y: 1 }, lineSpacing: -2 })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(19990);
  }

  update(time: GameTime, areaName: string): void {
    const s = `Ngày ${time.day} · ${time.weekdayName} · ${time.periodName}\n${areaName}`;
    if (s === this.last) return;
    this.last = s;
    this.text.setText(s);
  }

  setVisible(v: boolean): void {
    this.text.setVisible(v);
  }
}
