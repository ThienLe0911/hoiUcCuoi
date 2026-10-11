// Hộp thoại: nhiều trang chữ (có tên người nói) và, nếu có, danh sách lựa chọn ở trang cuối.
// Bấm Tương tác để qua trang / xác nhận; lên/xuống để chọn (cùng cách điều khiển với Menu).
import Phaser from "phaser";
import { FONT_FAMILY, GAME_HEIGHT, GAME_WIDTH } from "../config";

const BOX_H = 44;
const MARGIN = 8;
const TOP_Y = 34; // vị trí khi đặt phía trên (có điều khiển cảm ứng ở dưới)
// Khoảng cách dòng lựa chọn. Node 4 lựa chọn + lời dẫn 1 dòng → hộp cao 71px; khi đặt phía trên (cảm ứng) hộp kết thúc ở y=105
// và dòng cuối ở ≈y101, còn D-pad (tâm y=136, r=36) chỉ chạm tới y=100 sát x=42. Lời dẫn 2 dòng sẽ đè D-pad, nên lời dẫn của node
// 4 lựa chọn phải ≤ 1 dòng (tests/dialogue-flow.test.ts canh quy tắc này).
const ROW_H = 12;
const SPEAKER_H = 11;

export interface DialogChoiceItem {
  label: string;
  /** Lựa chọn bằng hành động: hiển thị khác biệt (tiền tố » và màu xanh nhạt). */
  isAction?: boolean;
}

export interface DialogNode {
  /** Tên người nói (không có = lời dẫn). */
  speaker?: string;
  pages: string[];
  choices?: DialogChoiceItem[];
  /** Gọi sau khi đóng hộp thoại; kèm chỉ số lựa chọn nếu có lựa chọn. */
  onDone?: (choiceIndex?: number) => void;
}

export class Dialog {
  private box: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private speakerText: Phaser.GameObjects.Text;
  private text: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private rows: Phaser.GameObjects.Text[] = [];
  private scene: Phaser.Scene;
  private w: number;
  private top: boolean;
  private node: DialogNode = { pages: [] };
  private index = 0;
  private cursor = 0;
  private choosing = false;
  private open = false;

  /** `top`: đặt hộp thoại ở phía trên (khi có điều khiển cảm ứng ở phía dưới). */
  constructor(scene: Phaser.Scene, top = false) {
    this.scene = scene;
    this.top = top;
    this.w = GAME_WIDTH - MARGIN * 2;
    this.bg = scene.add.rectangle(0, 0, this.w, BOX_H, 0x10182b, 0.92).setOrigin(0, 0);
    this.bg.setStrokeStyle(1, 0xf2e6bc);
    this.speakerText = scene.add.text(6, 2, "", { fontFamily: FONT_FAMILY, fontSize: "12px", color: "#f6d743" }).setOrigin(0, 0);
    this.text = scene.add
      .text(6, 4, "", { fontFamily: FONT_FAMILY, fontSize: "12px", color: "#ffffff", wordWrap: { width: this.w - 20 }, lineSpacing: -2 })
      .setOrigin(0, 0);
    this.hint = scene.add.text(this.w - 10, BOX_H - 12, "▼", { fontFamily: FONT_FAMILY, fontSize: "10px", color: "#f2e6bc" }).setOrigin(0, 0);
    this.box = scene.add.container(MARGIN, this.boxY(BOX_H), [this.bg, this.speakerText, this.text, this.hint]);
    this.box.setScrollFactor(0).setDepth(20000).setVisible(false);
  }

  get isOpen(): boolean {
    return this.open;
  }

  /** Đang hiện danh sách lựa chọn (giao diện cần chuyển lên/xuống sang `move`). */
  get isChoosing(): boolean {
    return this.open && this.choosing;
  }

  /** Mở hộp thoại chỉ có chữ. `pages` là danh sách trang; onClose gọi sau khi đóng trang cuối. */
  show(pages: string[], onClose?: () => void): void {
    this.showNode({ pages, onDone: () => onClose?.() });
  }

  /** Mở hộp thoại đầy đủ: tên người nói, các trang, và (tùy chọn) lựa chọn ở trang cuối. */
  showNode(node: DialogNode): void {
    if (node.pages.length === 0) return;
    this.node = node;
    this.index = 0;
    this.cursor = 0;
    this.open = true;
    this.box.setVisible(true);
    this.renderPage();
  }

  /** Qua trang kế; đang chọn thì xác nhận lựa chọn; hết trang thì đóng. */
  advance(): void {
    if (!this.open) return;
    if (this.choosing) {
      this.finish(this.cursor);
      return;
    }
    this.index += 1;
    if (this.index < this.node.pages.length) {
      this.renderPage();
      return;
    }
    this.finish(undefined);
  }

  /** Di chuyển con trỏ lựa chọn (vòng tròn). Bỏ qua nếu không đang chọn. */
  move(delta: number): void {
    if (!this.isChoosing) return;
    const n = this.node.choices?.length ?? 0;
    this.cursor = (this.cursor + delta + n) % n;
    this.refreshRows();
  }

  private boxY(h: number): number {
    return this.top ? TOP_Y : GAME_HEIGHT - h - MARGIN;
  }

  private finish(choiceIndex: number | undefined): void {
    this.open = false;
    this.choosing = false;
    this.clearRows();
    this.box.setVisible(false);
    const cb = this.node.onDone;
    this.node = { pages: [] };
    cb?.(choiceIndex);
  }

  private clearRows(): void {
    for (const r of this.rows) r.destroy();
    this.rows = [];
  }

  /** Vẽ trang hiện tại; nếu là trang cuối và có lựa chọn thì hiện luôn danh sách lựa chọn dưới đó. */
  private renderPage(): void {
    const { speaker, pages, choices } = this.node;
    const textTop = speaker ? 4 + SPEAKER_H : 4;
    this.speakerText.setText(speaker ?? "").setVisible(!!speaker);
    this.text.setY(textTop).setText(pages[this.index]);
    this.clearRows();

    const last = this.index === pages.length - 1;
    if (last && choices && choices.length > 0) {
      this.choosing = true;
      this.hint.setVisible(false);
      const listTop = Math.ceil(textTop + this.text.height) + 3;
      const h = listTop + choices.length * ROW_H + 4;
      this.bg.setSize(this.w, h);
      this.box.setY(this.boxY(h));
      this.rows = choices.map((_, i) => {
        const t = this.scene.add.text(6, listTop + i * ROW_H, "", { fontFamily: FONT_FAMILY, fontSize: "12px", color: "#ffffff" }).setOrigin(0, 0);
        this.box.add(t);
        return t;
      });
      this.refreshRows();
    } else {
      this.choosing = false;
      this.bg.setSize(this.w, BOX_H);
      this.box.setY(this.boxY(BOX_H));
      this.hint.setVisible(true).setY(BOX_H - 12);
    }
  }

  private refreshRows(): void {
    const choices = this.node.choices ?? [];
    this.rows.forEach((r, i) => {
      const on = i === this.cursor;
      const c = choices[i];
      r.setText((on ? "▶ " : "  ") + (c.isAction ? "» " : "") + c.label);
      r.setColor(on ? "#f6d743" : c.isAction ? "#9fe0ff" : "#ffffff");
    });
  }
}
