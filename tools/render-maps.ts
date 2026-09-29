// Vẽ ảnh xem trước cho mỗi bản đồ (.tmj) → docs/features/khung-game-va-ban-do/previews/<id>.png
//   npm run render-maps
// Thứ tự vẽ: ground, walls, sprite, overlay. Vùng cản hiện màu đỏ mờ, exit xanh lá, interact vàng (bản _debug).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import pngjs from "pngjs";

const { PNG } = pngjs;
const TILE = 16;

const tilesPng = PNG.sync.read(readFileSync("public/assets/tileset.png"));
const spritesPng = PNG.sync.read(readFileSync("public/assets/sprites.png"));
const spriteFrames = JSON.parse(readFileSync("public/assets/sprites.json", "utf8")).frames as Record<string, { x: number; y: number; w: number; h: number }>;
const COLS = tilesPng.width / TILE;

interface Png {
  width: number;
  height: number;
  data: Buffer;
}
function blit(dst: Png, src: Png, sx: number, sy: number, w: number, h: number, dx: number, dy: number): void {
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const x = dx + i;
      const y = dy + j;
      if (x < 0 || y < 0 || x >= dst.width || y >= dst.height) continue;
      const s = ((sy + j) * src.width + (sx + i)) * 4;
      if (src.data[s + 3] === 0) continue;
      const d = (y * dst.width + x) * 4;
      dst.data[d] = src.data[s];
      dst.data[d + 1] = src.data[s + 1];
      dst.data[d + 2] = src.data[s + 2];
      dst.data[d + 3] = 255;
    }
}
function tint(dst: Png, x0: number, y0: number, w: number, h: number, rgb: [number, number, number], a: number): void {
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      if (x < 0 || y < 0 || x >= dst.width || y >= dst.height) continue;
      const d = (y * dst.width + x) * 4;
      for (let k = 0; k < 3; k++) dst.data[d + k] = Math.round(dst.data[d + k] * (1 - a) + rgb[k] * a);
    }
}
function scale(src: Png, k: number): Png {
  const o = new PNG({ width: src.width * k, height: src.height * k });
  for (let y = 0; y < o.height; y++)
    for (let x = 0; x < o.width; x++) {
      const s = (Math.floor(y / k) * src.width + Math.floor(x / k)) * 4;
      const d = (y * o.width + x) * 4;
      for (let c = 0; c < 4; c++) o.data[d + c] = src.data[s + c];
    }
  return o;
}

mkdirSync("docs/features/khung-game-va-ban-do/previews", { recursive: true });
for (const file of readdirSync("data/maps").filter((f) => f.endsWith(".tmj"))) {
  const id = file.replace(/\.tmj$/, "");
  const map = JSON.parse(readFileSync(`data/maps/${file}`, "utf8"));
  const W = map.width * TILE;
  const H = map.height * TILE;
  const layer = (name: string) => map.layers.find((l: { name: string }) => l.name === name);
  const draw = (img: Png, name: string) => {
    const data: number[] = layer(name).data;
    data.forEach((gid, i) => {
      if (!gid) return;
      const idx = gid - 1;
      blit(img, tilesPng, (idx % COLS) * TILE, Math.floor(idx / COLS) * TILE, TILE, TILE, (i % map.width) * TILE, Math.floor(i / map.width) * TILE);
    });
  };
  const build = (debug: boolean): Png => {
    const img = new PNG({ width: W, height: H });
    img.data.fill(0);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255; // nền đen
    draw(img, "ground");
    draw(img, "walls");
    for (const o of layer("objects").objects) {
      if (o.type !== "sprite") continue;
      const frame = o.properties.find((p: { name: string }) => p.name === "frame").value as string;
      const f = spriteFrames[frame];
      blit(img, spritesPng, f.x, f.y, f.w, f.h, o.x, o.y);
    }
    draw(img, "overlay");
    if (debug) {
      (layer("collision").data as number[]).forEach((gid, i) => {
        if (gid) tint(img, (i % map.width) * TILE, Math.floor(i / map.width) * TILE, TILE, TILE, [255, 0, 0], 0.35);
      });
      for (const o of layer("objects").objects) {
        if (o.type === "exit") tint(img, o.x, o.y, o.width, o.height, [0, 255, 0], 0.5);
        if (o.type === "interact") tint(img, o.x, o.y, o.width, o.height, [255, 220, 0], 0.25);
      }
    }
    return img;
  };
  writeFileSync(`docs/features/khung-game-va-ban-do/previews/${id}.png`, PNG.sync.write(scale(build(false), 3)));
  writeFileSync(`docs/features/khung-game-va-ban-do/previews/${id}_debug.png`, PNG.sync.write(scale(build(true), 3)));
  console.log(`đã vẽ ${id}`);
}
