// Nạp asset, kiểm tra dữ liệu, tạo hoạt ảnh và phiên chơi rồi vào game.
import Phaser from "phaser";
import { FONT_FAMILY, GAME_WIDTH } from "../config";
import { createSession } from "../core/session";
import { loadContent } from "../data/content";
import sprites from "../../public/assets/sprites.json";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    this.load.image("tileset", "assets/tileset.png");
    this.load.image("sprites", "assets/sprites.png");
  }

  create(): void {
    let content;
    try {
      content = loadContent();
    } catch (err) {
      // AC8: dữ liệu sai thì báo rõ chỗ sai, không treo im lặng.
      const msg = err instanceof Error ? err.message : String(err);
      console.error(msg);
      this.add
        .text(6, 6, msg, { fontFamily: FONT_FAMILY, fontSize: "12px", color: "#ff8080", wordWrap: { width: GAME_WIDTH - 12 } })
        .setOrigin(0, 0);
      return;
    }

    // khung hình trong sprites.png
    const tex = this.textures.get("sprites");
    for (const [name, f] of Object.entries(sprites.frames)) tex.add(name, 0, f.x, f.y, f.w, f.h);
    for (const dir of ["down", "up", "left", "right"]) {
      this.anims.create({
        key: `walk-${dir}`,
        frames: [1, 2, 3, 4].map((i) => ({ key: "sprites", frame: `player_${dir}_${i}` })),
        frameRate: 8,
        repeat: -1,
      });
    }

    // bản đồ vào cache Phaser
    for (const area of content.areas.values()) {
      this.cache.tilemap.add(`map-${area.id}`, { format: Phaser.Tilemaps.Formats.TILED_JSON, data: content.maps.get(area.mapFile) });
    }

    this.registry.set("session", createSession(content));
    this.scene.start("Area");
  }
}
