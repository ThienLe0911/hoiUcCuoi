import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./config";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#000000",
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: Phaser.Scale.MAX_ZOOM,
  },
});
