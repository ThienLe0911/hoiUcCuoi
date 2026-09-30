// Màn hình phủ toàn khung: tổng kết ngày, hết thời gian.
import Phaser from "phaser";
import { FONT_FAMILY, GAME_HEIGHT, GAME_WIDTH } from "../config";

export interface OverlayContent {
  title: string;
  lines: string[];
  hint: string;
}

export class Overlay {
  private container: Phaser.GameObjects.Container;
  private title: Phaser.GameObjects.Text;
  private body: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private onContinue?: () => void;
  private open = false;

  constructor(scene: Phaser.Scene) {
    const bg = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0f1e, 0.94).setOrigin(0, 0);
    const wrap = { width: GAME_WIDTH - 40 };
    this.title = scene.add.text(GAME_WIDTH / 2, 48, "", { fontFamily: FONT_FAMILY, fontSize: "24px", color: "#f2e6bc" }).setOrigin(0.5, 0);
    this.body = scene.add
      .text(GAME_WIDTH / 2, 84, "", { fontFamily: FONT_FAMILY, fontSize: "16px", color: "#ffffff", align: "center", wordWrap: wrap, lineSpacing: 2 })
      .setOrigin(0.5, 0);
    this.hint = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 26, "", { fontFamily: FONT_FAMILY, fontSize: "12px", color: "#f6d743" }).setOrigin(0.5, 0);
    this.container = scene.add.container(0, 0, [bg, this.title, this.body, this.hint]);
    this.container.setScrollFactor(0).setDepth(40000).setVisible(false);
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(c: OverlayContent, onContinue: () => void): void {
    this.title.setText(c.title);
    this.body.setText(c.lines.join("\n"));
    this.hint.setText(c.hint);
    this.onContinue = onContinue;
    this.open = true;
    this.container.setVisible(true);
  }

  confirm(): void {
    if (!this.open) return;
    this.open = false;
    this.container.setVisible(false);
    const cb = this.onContinue;
    this.onContinue = undefined;
    cb?.();
  }
}
