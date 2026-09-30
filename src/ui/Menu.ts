// Menu danh sách đơn giản (menu tạm dừng). Điều khiển bằng hành động lên/xuống/tương tác/menu.
import Phaser from "phaser";
import { FONT_FAMILY, GAME_HEIGHT, GAME_WIDTH } from "../config";

export interface MenuItem {
  label: string;
  onSelect: () => void;
}

const W = 190;

export class Menu {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private title: Phaser.GameObjects.Text;
  private rows: Phaser.GameObjects.Text[] = [];
  private scene: Phaser.Scene;
  private items: MenuItem[] = [];
  private cursor = 0;
  private open = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bg = scene.add.rectangle(0, 0, W, 40, 0x10182b, 0.95).setOrigin(0, 0);
    this.bg.setStrokeStyle(1, 0xf2e6bc);
    this.title = scene.add.text(W / 2, 4, "", { fontFamily: FONT_FAMILY, fontSize: "16px", color: "#f2e6bc" }).setOrigin(0.5, 0);
    this.container = scene.add.container(0, 0, [this.bg, this.title]);
    this.container.setScrollFactor(0).setDepth(30000).setVisible(false);
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(title: string, items: MenuItem[]): void {
    this.items = items;
    this.cursor = 0;
    this.open = true;
    this.title.setText(title);
    for (const r of this.rows) r.destroy();
    this.rows = items.map((it, i) => {
      const t = this.scene.add.text(12, 24 + i * 15, it.label, { fontFamily: FONT_FAMILY, fontSize: "12px", color: "#ffffff" }).setOrigin(0, 0);
      this.container.add(t);
      return t;
    });
    const h = 30 + items.length * 15;
    this.bg.setSize(W, h);
    this.container.setPosition(Math.round((GAME_WIDTH - W) / 2), Math.round((GAME_HEIGHT - h) / 2));
    this.refresh();
    this.container.setVisible(true);
  }

  move(delta: number): void {
    if (!this.open) return;
    this.cursor = (this.cursor + delta + this.items.length) % this.items.length;
    this.refresh();
  }

  select(): void {
    if (!this.open) return;
    this.items[this.cursor].onSelect();
  }

  close(): void {
    this.open = false;
    this.container.setVisible(false);
  }

  private refresh(): void {
    this.rows.forEach((r, i) => {
      const on = i === this.cursor;
      r.setText((on ? "▶ " : "  ") + this.items[i].label);
      r.setColor(on ? "#f6d743" : "#ffffff");
    });
  }
}
