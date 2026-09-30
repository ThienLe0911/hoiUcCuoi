// Màn hình tiêu đề: "Hồi Trống Cuối". Bấm E/Space hoặc chạm để bắt đầu.
import Phaser from "phaser";
import { FONT_FAMILY, GAME_WIDTH } from "../config";
import { attachKeyboard } from "../core/keyboard";
import type { Session } from "../core/session";

export class TitleScene extends Phaser.Scene {
  private started = false;

  constructor() {
    super("Title");
  }

  create(): void {
    const { actions } = this.registry.get("session") as Session;
    this.started = false;
    const touch = this.sys.game.device.input.touch || new URLSearchParams(location.search).has("touch");

    // nền: dải trời chiều chuyển màu, hàng cây bụi và mặt đường (gợi cảnh cổng trường)
    const g = this.add.graphics();
    const bands = [0x1a2447, 0x23305c, 0x2e3f72, 0x3c5088, 0x5a6fa6, 0xd9a86a];
    bands.forEach((c, i) => g.fillStyle(c, 1).fillRect(0, (i * 120) / bands.length + 0, GAME_WIDTH, 120 / bands.length + 1));
    g.fillStyle(0x8a8d93, 1).fillRect(0, 150, GAME_WIDTH, 30);
    g.fillStyle(0xf5f5f5, 1);
    for (let x = 6; x < GAME_WIDTH; x += 40) g.fillRect(x, 165, 20, 2);
    g.fillStyle(0xd8b27a, 1).fillRect(0, 120, GAME_WIDTH, 30);

    // xe buýt 67 chạy ngang qua
    const bus = this.add.image(-90, 112, "sprites", "bus_67").setOrigin(0, 0);
    this.tweens.add({ targets: bus, x: GAME_WIDTH + 20, duration: 9000, repeat: -1, repeatDelay: 1500 });
    this.add.image(262, 140, "sprites", "student_boy").setOrigin(0.5, 1).setDepth(5);
    this.add.image(280, 140, "sprites", "student_girl").setOrigin(0.5, 1).setDepth(5);

    this.add
      .text(GAME_WIDTH / 2, 30, "Hồi Trống Cuối", { fontFamily: FONT_FAMILY, fontSize: "40px", color: "#f2e6bc", stroke: "#10182b", strokeThickness: 4 })
      .setOrigin(0.5, 0);
    this.add
      .text(GAME_WIDTH / 2, 76, "Tiếng trống vang lên, bạn trở về năm lớp 12.", { fontFamily: FONT_FAMILY, fontSize: "14px", color: "#ffffff", stroke: "#10182b", strokeThickness: 3 })
      .setOrigin(0.5, 0);

    const prompt = this.add
      .text(GAME_WIDTH / 2, 98, touch ? "Chạm để bắt đầu" : "Bấm E hoặc Space để bắt đầu", { fontFamily: FONT_FAMILY, fontSize: "16px", color: "#ffffff", stroke: "#10182b", strokeThickness: 3 })
      .setOrigin(0.5, 0);
    this.tweens.add({ targets: prompt, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });

    const detach = attachKeyboard(actions);
    this.input.once("pointerdown", () => this.start());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => detach());
    this.events.on(Phaser.Scenes.Events.UPDATE, () => {
      if (actions.consumePressed("interact")) this.start();
    });
  }

  private start(): void {
    if (this.started) return;
    this.started = true;
    const cam = this.cameras.main;
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start("Area", {}));
    cam.fadeOut(300, 0, 0, 0);
  }
}
