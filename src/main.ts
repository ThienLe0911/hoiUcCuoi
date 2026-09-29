import Phaser from "phaser";
import { FONT_FAMILY, GAME_HEIGHT, GAME_WIDTH } from "./config";
import { AreaScene } from "./scenes/AreaScene";
import { BootScene } from "./scenes/BootScene";

async function start(): Promise<void> {
  // nạp font trước để Phaser vẽ chữ đúng ngay từ khung đầu
  try {
    const font = new FontFace(FONT_FAMILY, "url(assets/fonts/VT323-Regular.ttf)");
    document.fonts.add(await font.load());
  } catch (err) {
    console.warn("Không nạp được font VT323, dùng font mặc định", err);
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#000000",
    pixelArt: true,
    roundPixels: true,
    physics: { default: "arcade", arcade: { debug: false } },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      zoom: Phaser.Scale.MAX_ZOOM,
    },
    scene: [BootScene, AreaScene],
  });
  if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;
}

void start();
