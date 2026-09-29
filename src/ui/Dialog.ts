// Hộp thoại tối thiểu: một hoặc nhiều trang chữ, bấm Tương tác để qua trang / đóng.
import Phaser from "phaser";
import { FONT_FAMILY, GAME_HEIGHT, GAME_WIDTH } from "../config";

const BOX_H = 44;
const MARGIN = 8;

export class Dialog {
  private box: Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private pages: string[] = [];
  private index = 0;
  private onClose?: () => void;
  private open = false;

  constructor(scene: Phaser.Scene) {
    const w = GAME_WIDTH - MARGIN * 2;
    const bg = scene.add.rectangle(0, 0, w, BOX_H, 0x10182b, 0.92).setOrigin(0, 0);
    bg.setStrokeStyle(1, 0xf2e6bc);
    this.text = scene.add
      .text(6, 4, "", { fontFamily: FONT_FAMILY, fontSize: "12px", color: "#ffffff", wordWrap: { width: w - 20 }, lineSpacing: -2 })
      .setOrigin(0, 0);
    const hint = scene.add.text(w - 10, BOX_H - 12, "▼", { fontFamily: FONT_FAMILY, fontSize: "10px", color: "#f2e6bc" }).setOrigin(0, 0);
    this.box = scene.add.container(MARGIN, GAME_HEIGHT - BOX_H - MARGIN, [bg, this.text, hint]);
    this.box.setScrollFactor(0).setDepth(20000).setVisible(false);
  }

  get isOpen(): boolean {
    return this.open;
  }

  /** Mở hộp thoại. `pages` là danh sách trang; onClose gọi sau khi đóng trang cuối. */
  show(pages: string[], onClose?: () => void): void {
    if (pages.length === 0) return;
    this.pages = pages;
    this.index = 0;
    this.onClose = onClose;
    this.open = true;
    this.text.setText(pages[0]);
    this.box.setVisible(true);
  }

  /** Qua trang kế; hết trang thì đóng. */
  advance(): void {
    if (!this.open) return;
    this.index += 1;
    if (this.index < this.pages.length) {
      this.text.setText(this.pages[this.index]);
      return;
    }
    this.open = false;
    this.box.setVisible(false);
    const cb = this.onClose;
    this.onClose = undefined;
    cb?.();
  }
}
