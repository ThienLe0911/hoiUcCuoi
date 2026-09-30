// Sinh bộ pixel art khởi đầu (tự tạo) cho "Hồi Trống Cuối".
//   npm run gen-assets
// Kết quả (xác định, chạy lặp lại cho ra file giống nhau):
//   public/assets/tileset.png + tileset.json   (ô 16×16, 16 cột)
//   public/assets/sprites.png + sprites.json   (khung hình có tên)
//   docs/product/asset-preview.png             (ảnh xem nhanh, phóng 4×)
//
// Thêm tile mới: (1) viết hàm vẽ 16×16 trong TILE_DRAWERS bên dưới với một id mới,
// (2) chạy lại script. Id → chỉ số nằm trong tileset.json; code game chỉ dùng id,
// nên có thể thay tileset.png bằng bản vẽ tay miễn là giữ đúng thứ tự/chỉ số.
// Bảng màu theo docs/product/art-reference.md.
import { mkdirSync, writeFileSync } from "node:fs";
import pngjs from "pngjs";

const { PNG } = pngjs;

// ---------- Bảng màu ----------
const C = {
  outline: "#33384d",
  cream: "#efe2b4", creamShade: "#e0cd98", creamLight: "#f8eec9", creamDark: "#cbbe94",
  sky: "#7fb5e6", skyShade: "#5e96cc", skyLight: "#a9d0f1",
  teal: "#33a99e", tealDark: "#24827a", tealLight: "#6cd0c4",
  blue: "#2f6fc2", blueDark: "#22529a", blueLight: "#5b94e0",
  floor: "#d9d2c0", floorShade: "#c6bea9", floorDark: "#b3ab95",
  paver: "#d8b27a", paverShade: "#c49a60", paverLight: "#e6c690",
  grass: "#4caf50", grassDark: "#3b8f3f", grassLight: "#6cc96e",
  leaf: "#2e7d32", leafDark: "#1f5e27", leafLight: "#56a85a",
  trunk: "#7a4a2a", trunkDark: "#5a3520",
  red: "#d93a3a", redDark: "#a82828", yellow: "#f6d743",
  road: "#8a8d93", roadDark: "#7a7d83", white: "#f5f5f5",
  wood: "#a9713d", woodDark: "#85552b", woodLight: "#c58c55",
  courtBlue: "#2f63b8", courtBlueDark: "#274f96", courtBrown: "#8b5e3c",
  brick: "#b5573c", brickDark: "#8f4230",
  skin: "#f1c7a0", skinShade: "#d9a97f", hair: "#2a2a36",
  shirt: "#f4f4f4", shirtShade: "#d3d5e0", pants: "#8a8fa0", pantsDark: "#6b7086", shoe: "#2c2c38",
  skirt: "#6e5c8a", skirtDark: "#4a3f63",
  bus: "#7ed957", busDark: "#3fa33b", busRoof: "#f2ecc8", busWin: "#2b3f5c", busWinLight: "#4f74a3",
  pink: "#f4a6c8", pinkDark: "#d87aa6", pot: "#f0f0f0", potShade: "#cfcfd8",
  gray: "#9a9ca6", grayDark: "#6f717d", black: "#1e1e26",
} as const;

type RGBA = [number, number, number, number];
const cache = new Map<string, RGBA>();
function rgba(hex: string): RGBA {
  let v = cache.get(hex);
  if (!v) {
    const n = parseInt(hex.slice(1), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
    cache.set(hex, v);
  }
  return v;
}

// ---------- Ảnh RGBA đơn giản ----------
class Img {
  w: number;
  h: number;
  d: Uint8Array;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.d = new Uint8Array(w * h * 4);
  }
  px(x: number, y: number, hex: string | null): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    if (hex === null) {
      this.d[i + 3] = 0;
      return;
    }
    const c = rgba(hex);
    this.d[i] = c[0];
    this.d[i + 1] = c[1];
    this.d[i + 2] = c[2];
    this.d[i + 3] = 255;
  }
  get(x: number, y: number): RGBA {
    const i = (y * this.w + x) * 4;
    return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]];
  }
  opaque(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    return this.d[(y * this.w + x) * 4 + 3] > 0;
  }
  rect(x: number, y: number, w: number, h: number, hex: string): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, hex);
  }
  box(x: number, y: number, w: number, h: number, hex: string): void {
    for (let i = 0; i < w; i++) {
      this.px(x + i, y, hex);
      this.px(x + i, y + h - 1, hex);
    }
    for (let j = 0; j < h; j++) {
      this.px(x, y + j, hex);
      this.px(x + w - 1, y + j, hex);
    }
  }
  disc(cx: number, cy: number, r: number, hex: string): void {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
        if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) this.px(x, y, hex);
  }
  blit(src: Img, dx: number, dy: number, sx = 0, sy = 0, sw = src.w, sh = src.h): void {
    for (let j = 0; j < sh; j++)
      for (let i = 0; i < sw; i++) {
        const x = sx + i;
        const y = sy + j;
        if (!src.opaque(x, y)) continue;
        const c = src.get(x, y);
        const ox = dx + i;
        const oy = dy + j;
        if (ox < 0 || oy < 0 || ox >= this.w || oy >= this.h) continue;
        const k = (oy * this.w + ox) * 4;
        this.d[k] = c[0];
        this.d[k + 1] = c[1];
        this.d[k + 2] = c[2];
        this.d[k + 3] = 255;
      }
  }
  flipX(): Img {
    const o = new Img(this.w, this.h);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (!this.opaque(x, y)) continue;
        const c = this.get(x, y);
        const k = (y * this.w + (this.w - 1 - x)) * 4;
        o.d[k] = c[0];
        o.d[k + 1] = c[1];
        o.d[k + 2] = c[2];
        o.d[k + 3] = 255;
      }
    return o;
  }
  /** Viền tối 1px quanh phần đã vẽ (chỉ vào ô trong suốt kề bên). */
  outline(hex: string): void {
    const add: [number, number][] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.opaque(x, y)) continue;
        if (this.opaque(x - 1, y) || this.opaque(x + 1, y) || this.opaque(x, y - 1) || this.opaque(x, y + 1)) add.push([x, y]);
      }
    for (const [x, y] of add) this.px(x, y, hex);
  }
  scaled(k: number): Img {
    const o = new Img(this.w * k, this.h * k);
    for (let y = 0; y < o.h; y++)
      for (let x = 0; x < o.w; x++) {
        const c = this.get(Math.floor(x / k), Math.floor(y / k));
        const i = (y * o.w + x) * 4;
        o.d[i] = c[0];
        o.d[i + 1] = c[1];
        o.d[i + 2] = c[2];
        o.d[i + 3] = c[3];
      }
    return o;
  }
  save(path: string): void {
    const png = new PNG({ width: this.w, height: this.h });
    png.data = Buffer.from(this.d);
    writeFileSync(path, PNG.sync.write(png));
  }
}

/** Nhiễu xác định (không dùng ngẫu nhiên). */
function hash(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

// ---------- Tile 16×16 ----------
type Draw = (t: Img) => void;

function wallBg(t: Img): void {
  t.rect(0, 0, 16, 16, C.cream);
  t.rect(0, 0, 16, 1, C.creamLight);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) if (hash(x, y, 1) > 0.94) t.px(x, y, C.creamShade);
}
function floorBg(t: Img): void {
  t.rect(0, 0, 16, 16, C.floor);
  t.rect(0, 0, 16, 1, C.floorShade);
  t.rect(0, 0, 1, 16, C.floorShade);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) if (hash(x, y, 2) > 0.95) t.px(x, y, C.floorShade);
}
function grassBg(t: Img): void {
  t.rect(0, 0, 16, 16, C.grass);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const h = hash(x, y, 3);
      if (h > 0.9) t.px(x, y, C.grassDark);
      else if (h < 0.05) t.px(x, y, C.grassLight);
    }
}
function roadBg(t: Img): void {
  t.rect(0, 0, 16, 16, C.road);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) if (hash(x, y, 4) > 0.93) t.px(x, y, C.roadDark);
}
function paverBg(t: Img, seed = 5): void {
  t.rect(0, 0, 16, 16, C.paver);
  for (let by = 0; by < 2; by++)
    for (let bx = 0; bx < 2; bx++) {
      const ox = bx * 8;
      const oy = by * 8;
      t.box(ox, oy, 8, 8, C.paverShade);
      t.px(ox + 1, oy + 1, C.paverLight);
      t.px(ox + 2, oy + 1, C.paverLight);
      t.px(ox + 1, oy + 2, C.paverLight);
      if (hash(bx, by, seed) > 0.5) t.px(ox + 4, oy + 4, C.paverShade);
    }
}
function pillarAt(t: Img, top: boolean): void {
  wallBg(t);
  t.rect(4, 0, 8, 16, C.sky);
  t.rect(4, 0, 2, 16, C.skyLight);
  t.rect(10, 0, 2, 16, C.skyShade);
  t.rect(3, 0, 1, 16, C.outline);
  t.rect(12, 0, 1, 16, C.outline);
  if (top) {
    t.rect(2, 0, 12, 3, C.sky);
    t.rect(2, 0, 12, 1, C.skyLight);
    t.rect(2, 3, 12, 1, C.outline);
    t.rect(2, 0, 1, 4, C.outline);
    t.rect(13, 0, 1, 4, C.outline);
  }
}
function doorAt(t: Img): void {
  wallBg(t);
  t.rect(3, 2, 10, 14, C.teal);
  t.box(3, 2, 10, 14, C.tealDark);
  t.rect(5, 4, 6, 5, C.skyLight);
  t.box(5, 4, 6, 5, C.tealDark);
  t.px(10, 12, C.yellow);
}
function windowAt(t: Img): void {
  wallBg(t);
  t.rect(2, 3, 12, 9, C.tealDark);
  t.rect(3, 4, 10, 7, C.skyLight);
  t.rect(3, 4, 10, 2, C.sky);
  t.rect(7, 4, 2, 7, C.teal);
  t.rect(3, 7, 10, 1, C.teal);
  t.rect(1, 12, 14, 1, C.creamDark);
}
/** Tán cây 32×32 (ghép từ 4 ô). */
function canopy(): Img {
  const c = new Img(32, 32);
  c.disc(16, 16, 15, C.leaf);
  c.disc(12, 12, 9, C.leafLight);
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++)
      if (c.opaque(x, y)) {
        const h = hash(x, y, 6);
        if (h > 0.86) c.px(x, y, C.leafDark);
        else if (h < 0.08) c.px(x, y, C.leafLight);
      }
  c.disc(21, 22, 6, C.leafDark);
  c.disc(19, 19, 4, C.leaf);
  c.outline(C.leafDark);
  return c;
}
const CANOPY = canopy();

const TILE_DRAWERS: [string, Draw][] = [
  ["empty", () => {}],
  ["wall_cream", wallBg],
  ["wall_cream_base", (t) => {
    wallBg(t);
    t.rect(0, 11, 16, 5, C.creamDark);
    t.rect(0, 11, 16, 1, C.creamShade);
  }],
  ["pillar_blue", (t) => pillarAt(t, false)],
  ["pillar_blue_top", (t) => pillarAt(t, true)],
  ["railing_teal", (t) => {
    t.rect(0, 5, 16, 2, C.teal);
    t.rect(0, 5, 16, 1, C.tealLight);
    t.rect(0, 7, 16, 1, C.tealDark);
    for (let x = 1; x < 16; x += 3) t.rect(x, 8, 1, 8, C.teal);
    t.rect(0, 15, 16, 1, C.tealDark);
  }],
  ["railing_post", (t) => {
    t.rect(6, 3, 4, 13, C.sky);
    t.rect(6, 3, 1, 13, C.skyLight);
    t.rect(9, 3, 1, 13, C.skyShade);
    t.rect(5, 3, 6, 2, C.skyLight);
    t.rect(0, 7, 6, 1, C.teal);
    t.rect(10, 7, 6, 1, C.teal);
    for (const x of [1, 3]) t.rect(x, 8, 1, 8, C.teal);
    for (const x of [12, 14]) t.rect(x, 8, 1, 8, C.teal);
  }],
  ["floor_corridor", floorBg],
  ["floor_corridor_shadow", (t) => {
    floorBg(t);
    t.rect(0, 0, 16, 5, C.floorShade);
    t.rect(0, 5, 16, 2, C.floorDark);
  }],
  ["paving_brown", (t) => paverBg(t)],
  ["low_wall_cream", (t) => {
    t.rect(0, 0, 16, 16, C.cream);
    t.rect(0, 0, 16, 3, C.creamLight);
    t.rect(0, 3, 16, 1, C.creamDark);
    for (let y = 4; y < 16; y += 4) t.rect(0, y, 16, 1, C.creamShade);
    for (let x = 4; x < 16; x += 8) t.rect(x, 4, 1, 4, C.creamShade);
    for (let x = 0; x < 16; x += 8) t.rect(x, 8, 1, 4, C.creamShade);
  }],
  ["low_wall_diamond", (t) => {
    t.rect(0, 0, 16, 16, C.cream);
    t.rect(0, 0, 16, 2, C.creamLight);
    t.rect(0, 2, 16, 1, C.creamDark);
    // thoi xanh
    for (let i = 0; i < 5; i++) {
      t.rect(8 - i, 8 - i + 0, i * 2, 1, C.blue);
      t.rect(8 - i, 8 + i, i * 2, 1, C.blue);
    }
    t.rect(4, 8, 8, 1, C.blueLight);
    t.rect(0, 15, 16, 1, C.creamShade);
  }],
  ["grass", grassBg],
  ["grass_flower", (t) => {
    grassBg(t);
    t.px(3, 4, C.white);
    t.px(11, 9, C.yellow);
    t.px(6, 12, C.pinkDark);
    t.px(13, 3, C.white);
  }],
  ["bush", (t) => {
    grassBg(t);
    t.disc(8, 8, 7, C.leaf);
    t.disc(6, 6, 4, C.leafLight);
    t.disc(10, 10, 3, C.leafDark);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) if (t.opaque(x, y) && hash(x, y, 7) > 0.9) t.px(x, y, C.leafDark);
  }],
  ["road", roadBg],
  ["road_dash", (t) => {
    roadBg(t);
    t.rect(2, 7, 12, 2, C.white);
  }],
  ["crosswalk", (t) => {
    roadBg(t);
    for (let x = 1; x < 16; x += 5) t.rect(x, 0, 3, 16, C.white);
  }],
  ["road_curb", (t) => {
    roadBg(t);
    paverBg(t);
    t.rect(0, 9, 16, 1, C.floorDark);
    t.rect(0, 10, 16, 6, C.road);
    for (let y = 10; y < 16; y++)
      for (let x = 0; x < 16; x++) if (hash(x, y, 4) > 0.93) t.px(x, y, C.roadDark);
    t.rect(0, 9, 16, 1, C.floorShade);
  }],
  ["tree_canopy_tl", (t) => t.blit(CANOPY, 0, 0, 0, 0, 16, 16)],
  ["tree_canopy_tr", (t) => t.blit(CANOPY, 0, 0, 16, 0, 16, 16)],
  ["tree_canopy_bl", (t) => t.blit(CANOPY, 0, 0, 0, 16, 16, 16)],
  ["tree_canopy_br", (t) => t.blit(CANOPY, 0, 0, 16, 16, 16, 16)],
  ["tree_trunk", (t) => {
    t.rect(5, 0, 6, 13, C.trunk);
    t.rect(5, 0, 2, 13, C.woodLight);
    t.rect(9, 0, 2, 13, C.trunkDark);
    t.rect(3, 12, 10, 3, C.trunk);
    t.rect(3, 14, 10, 1, C.trunkDark);
    t.outline(C.trunkDark);
  }],
  ["bonsai", (t) => {
    t.disc(8, 6, 6, C.leaf);
    t.disc(6, 4, 3, C.leafLight);
    t.disc(10, 8, 3, C.leafDark);
    t.rect(4, 10, 8, 5, C.pot);
    t.rect(4, 13, 8, 2, C.potShade);
    t.rect(3, 10, 10, 1, C.potShade);
    t.outline(C.outline);
  }],
  ["gate_iron", (t) => {
    t.rect(0, 1, 16, 2, C.blueDark);
    t.rect(0, 13, 16, 2, C.blueDark);
    for (let x = 1; x < 16; x += 3) t.rect(x, 3, 1, 10, C.blue);
    t.rect(0, 7, 16, 1, C.blueDark);
  }],
  ["gate_pillar", (t) => {
    t.rect(2, 0, 12, 16, C.blue);
    t.rect(2, 0, 3, 16, C.blueLight);
    t.rect(11, 0, 3, 16, C.blueDark);
    for (let y = 3; y < 16; y += 4) t.rect(2, y, 12, 1, C.blueDark);
    t.rect(1, 0, 1, 16, C.outline);
    t.rect(14, 0, 1, 16, C.outline);
  }],
  ["gate_arch_l", (t) => {
    for (let x = 4; x < 16; x++) {
      const drop = x < 8 ? (8 - x) : 0;
      t.rect(x, 3 + drop, 1, 6, C.cream);
      t.px(x, 3 + drop, C.creamLight);
      t.px(x, 8 + drop, C.creamDark);
    }
    t.outline(C.outline);
  }],
  ["gate_arch_m", (t) => {
    t.rect(0, 3, 16, 6, C.cream);
    t.rect(0, 3, 16, 1, C.creamLight);
    t.rect(0, 8, 16, 1, C.creamDark);
    t.rect(0, 2, 16, 1, C.outline);
    t.rect(0, 9, 16, 1, C.outline);
  }],
  ["gate_arch_r", (t) => {
    for (let x = 0; x < 12; x++) {
      const drop = x > 7 ? x - 7 : 0;
      t.rect(x, 3 + drop, 1, 6, C.cream);
      t.px(x, 3 + drop, C.creamLight);
      t.px(x, 8 + drop, C.creamDark);
    }
    t.outline(C.outline);
  }],
  ["sign_blue", (t) => {
    t.rect(0, 3, 16, 10, C.blue);
    t.box(0, 3, 16, 10, C.blueDark);
    for (let x = 2; x < 14; x += 2) t.px(x, 8, C.yellow);
    for (let x = 3; x < 13; x += 3) t.px(x, 6, C.yellow);
    for (let x = 3; x < 13; x += 3) t.px(x, 10, C.yellow);
  }],
  ["flag_red", (t) => {
    t.rect(2, 1, 1, 15, C.grayDark);
    t.rect(3, 2, 11, 8, C.red);
    t.box(3, 2, 11, 8, C.redDark);
    // ngôi sao vàng
    const s = [[8, 3], [8, 4], [7, 5], [8, 5], [9, 5], [6, 5], [10, 5], [7, 6], [9, 6], [8, 7]];
    for (const [x, y] of s) t.px(x, y, C.yellow);
  }],
  ["door_teal", doorAt],
  ["window_teal", windowAt],
  ["wall_brick", (t) => {
    t.rect(0, 0, 16, 16, C.brick);
    for (let y = 0; y < 16; y += 4) t.rect(0, y, 16, 1, C.brickDark);
    for (let y = 0; y < 16; y += 8) for (let x = 3; x < 16; x += 8) t.rect(x, y + 1, 1, 3, C.brickDark);
    for (let y = 4; y < 16; y += 8) for (let x = 7; x < 16; x += 8) t.rect(x, y + 1, 1, 3, C.brickDark);
  }],
  ["roof_floor", (t) => {
    t.rect(0, 0, 16, 16, C.gray);
    t.box(0, 0, 16, 16, C.grayDark);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) if (hash(x, y, 8) > 0.92) t.px(x, y, C.grayDark);
  }],
  ["roof_fence", (t) => {
    t.rect(0, 4, 16, 1, C.tealDark);
    t.rect(0, 5, 16, 1, C.teal);
    for (let x = 1; x < 16; x += 4) t.rect(x, 6, 1, 10, C.teal);
    t.rect(0, 15, 16, 1, C.tealDark);
  }],
  ["stairs", (t) => {
    for (let i = 0; i < 4; i++) {
      t.rect(0, i * 4, 16, 3, C.floor);
      t.rect(0, i * 4 + 3, 16, 1, C.floorDark);
    }
  }],
  ["bench", (t) => {
    t.rect(1, 5, 14, 4, C.wood);
    t.rect(1, 5, 14, 1, C.woodLight);
    t.rect(1, 9, 14, 1, C.woodDark);
    t.rect(2, 10, 2, 5, C.woodDark);
    t.rect(12, 10, 2, 5, C.woodDark);
    t.rect(1, 3, 14, 1, C.woodDark);
    t.outline(C.outline);
  }],
  ["desk_pair", (t) => {
    t.rect(1, 3, 14, 6, C.wood);
    t.rect(1, 3, 14, 1, C.woodLight);
    t.rect(1, 9, 14, 1, C.woodDark);
    t.rect(2, 10, 1, 5, C.woodDark);
    t.rect(13, 10, 1, 5, C.woodDark);
    t.rect(2, 11, 12, 2, C.woodLight);
    t.rect(2, 13, 12, 1, C.woodDark);
    t.outline(C.outline);
  }],
  ["whiteboard", (t) => {
    wallBg(t);
    t.rect(1, 2, 14, 10, C.white);
    t.box(1, 2, 14, 10, C.gray);
    t.rect(2, 3, 12, 2, C.yellow);
    for (let x = 3; x < 13; x += 3) t.px(x, 8, C.blueLight);
  }],
  ["court_blue", (t) => {
    t.rect(0, 0, 16, 16, C.courtBlue);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) if (hash(x, y, 9) > 0.94) t.px(x, y, C.courtBlueDark);
  }],
  ["court_line_h", (t) => {
    t.rect(0, 0, 16, 16, C.courtBlue);
    t.rect(0, 7, 16, 2, C.white);
  }],
  ["court_line_v", (t) => {
    t.rect(0, 0, 16, 16, C.courtBlue);
    t.rect(7, 0, 2, 16, C.white);
  }],
  ["court_corner", (t) => {
    t.rect(0, 0, 16, 16, C.courtBlue);
    t.rect(7, 7, 9, 2, C.white);
    t.rect(7, 7, 2, 9, C.white);
  }],
  ["court_brown", (t) => {
    t.rect(0, 0, 16, 16, C.courtBrown);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) if (hash(x, y, 10) > 0.93) t.px(x, y, C.trunkDark);
  }],
  ["hoop", (t) => {
    t.rect(2, 2, 12, 8, C.white);
    t.box(2, 2, 12, 8, C.gray);
    t.box(5, 5, 6, 4, C.red);
    t.rect(4, 10, 8, 1, C.red);
    t.rect(4, 11, 8, 1, C.white);
  }],
  ["hoop_pole", (t) => {
    t.rect(7, 0, 2, 16, C.grayDark);
    t.rect(7, 0, 1, 16, C.gray);
    t.rect(4, 14, 8, 2, C.black);
  }],
  ["pipe_red", (t) => {
    t.rect(0, 5, 16, 3, C.red);
    t.rect(0, 5, 16, 1, "#f06a6a");
    t.rect(0, 7, 16, 1, C.redDark);
    t.rect(3, 4, 2, 5, C.grayDark);
    t.rect(11, 4, 2, 5, C.grayDark);
  }],
  ["chair", (t) => {
    t.rect(4, 6, 8, 6, C.wood);
    t.rect(4, 6, 8, 1, C.woodLight);
    t.rect(5, 12, 1, 3, C.woodDark);
    t.rect(10, 12, 1, 3, C.woodDark);
    t.rect(4, 3, 8, 3, C.woodDark);
    t.outline(C.outline);
  }],
  ["statue", (t) => {
    t.rect(3, 9, 10, 6, C.creamShade);
    t.rect(3, 9, 10, 1, C.creamLight);
    t.rect(3, 14, 10, 1, C.creamDark);
    t.rect(6, 3, 4, 6, C.gray);
    t.rect(6, 1, 4, 3, C.skinShade);
    t.rect(6, 5, 4, 1, C.grayDark);
    t.outline(C.outline);
  }],
  ["curtain_green", (t) => {
    wallBg(t);
    t.rect(1, 1, 5, 14, "#4d9a55");
    t.rect(10, 1, 5, 14, "#4d9a55");
    for (const x of [2, 4, 11, 13]) t.rect(x, 1, 1, 14, "#3a7a42");
    t.rect(6, 3, 4, 9, C.skyLight);
  }],
  ["wall_class_lower", (t) => {
    t.rect(0, 0, 16, 16, C.paver);
    t.rect(0, 0, 16, 16, "#e4cf9b");
    for (let y = 0; y < 16; y += 4) t.rect(0, y, 16, 1, C.creamDark);
    for (let y = 0; y < 16; y += 8) for (let x = 3; x < 16; x += 8) t.rect(x, y + 1, 1, 3, C.creamDark);
    for (let y = 4; y < 16; y += 8) for (let x = 7; x < 16; x += 8) t.rect(x, y + 1, 1, 3, C.creamDark);
  }],
  ["wall_class_upper", (t) => {
    t.rect(0, 0, 16, 16, "#f3f0e6");
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) if (hash(x, y, 11) > 0.96) t.px(x, y, "#e2dece");
  }],
];

const COLS = 16;
const tileRows = Math.ceil(TILE_DRAWERS.length / COLS);
const tileset = new Img(COLS * 16, tileRows * 16);
const tilesetIndex: Record<string, number> = {};
TILE_DRAWERS.forEach(([id, draw], i) => {
  const t = new Img(16, 16);
  draw(t);
  tileset.blit(t, (i % COLS) * 16, Math.floor(i / COLS) * 16);
  tilesetIndex[id] = i;
});

// ---------- Sprite ----------
type Dir = "down" | "up" | "left" | "right";
interface Look {
  hair: string;
  girl: boolean;
  top?: string; // màu áo (mặc định áo trắng học sinh)
  hat?: { kind: "cap" | "kepi" | "chef"; color: string };
  apron?: boolean; // tạp dề trắng (người bán)
}

/** Người 16×24. frame: 0 = đứng, 1..4 = đi. */
function person(dir: Dir, frame: number, look: Look): Img {
  if (dir === "right") return person("left", frame, look).flipX();
  const s = new Img(16, 24);
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const swing = frame === 1 ? 1 : frame === 3 ? -1 : 0; // tay/chân trái tiến (+) hay phải tiến (−)
  const oy = 2 + bob; // đỉnh đầu
  const side = dir === "left";
  const back = dir === "up";

  // chân
  const legTop = oy + 14;
  const bottom = look.girl ? C.skin : C.pants;
  if (side) {
    const f = swing; // tiến về trước (trái) / lùi
    s.rect(6 + f, legTop, 3, 5 - (f > 0 ? 1 : 0), bottom);
    s.rect(7 - f, legTop, 3, 5 - (f < 0 ? 1 : 0), bottom);
    s.rect(5 + f, legTop + 4, 4, 2, C.shoe);
    s.rect(7 - f, legTop + 4, 4, 2, C.shoe);
  } else {
    const l = swing > 0 ? 1 : 0;
    const r = swing < 0 ? 1 : 0;
    s.rect(5, legTop, 3, 5 - l, bottom);
    s.rect(8, legTop, 3, 5 - r, bottom);
    s.rect(5, legTop + 5 - l, 3, 2, C.shoe);
    s.rect(8, legTop + 5 - r, 3, 2, C.shoe);
  }
  // quần/váy
  if (look.girl) {
    s.rect(4, oy + 11, 8, 4, C.skirt);
    for (let x = 4; x < 12; x++) for (let y = oy + 11; y < oy + 15; y++) if ((x + y) % 2 === 0) s.px(x, y, C.skirtDark);
  } else {
    s.rect(5, oy + 11, 6, 4, C.pants);
    s.rect(5, oy + 14, 6, 1, C.pantsDark);
  }
  // thân áo (mặc định trắng học sinh; NPC người lớn dùng look.top)
  const top = look.top ?? C.shirt;
  s.rect(5, oy + 6, 6, 6, top);
  s.rect(5, oy + 11, 6, 1, C.shirtShade);
  if (!back) {
    s.px(8, oy + 7, look.girl ? C.red : C.shirtShade);
    s.px(8, oy + 8, look.girl ? C.red : C.shirtShade);
  }
  // tạp dề trắng (người bán): tấm trước ngực + dây
  if (look.apron && !back) {
    s.rect(6, oy + 7, 4, 5, C.white);
    s.rect(6, oy + 7, 4, 1, C.shirtShade);
    s.px(6, oy + 6, C.white);
    s.px(9, oy + 6, C.white);
  }
  // tay
  const armL = swing > 0 ? -1 : swing < 0 ? 1 : 0;
  if (side) {
    s.rect(7 + swing, oy + 7, 2, 5, C.shirt);
    s.px(7 + swing, oy + 12, C.skin);
    s.px(8 + swing, oy + 12, C.skin);
  } else {
    s.rect(3, oy + 7 + armL, 2, 4, C.shirt);
    s.rect(11, oy + 7 - armL, 2, 4, C.shirt);
    s.px(3, oy + 11 + armL, C.skin);
    s.px(4, oy + 11 + armL, C.skin);
    s.px(11, oy + 11 - armL, C.skin);
    s.px(12, oy + 11 - armL, C.skin);
  }
  // đầu
  s.rect(5, oy, 6, 6, C.skin);
  if (back) {
    s.rect(4, oy - 1, 8, 7, look.hair);
  } else if (side) {
    s.rect(4, oy - 1, 8, 3, look.hair);
    s.rect(7, oy + 2, 5, 4, look.hair);
    s.rect(4, oy + 2, 3, 4, C.skin);
    s.px(5, oy + 3, C.hair);
    if (look.girl) s.rect(10, oy + 5, 2, 4, look.hair);
  } else {
    s.rect(4, oy - 1, 8, 3, look.hair);
    s.px(4, oy + 2, look.hair);
    s.px(11, oy + 2, look.hair);
    s.px(6, oy + 3, C.hair);
    s.px(9, oy + 3, C.hair);
    s.px(7, oy + 5, C.skinShade);
    if (look.girl) {
      s.rect(4, oy + 2, 1, 5, look.hair);
      s.rect(11, oy + 2, 1, 5, look.hair);
    }
  }
  // mũ (NPC người lớn): vành trên trán, tùy loại
  if (look.hat) {
    const { kind, color } = look.hat;
    s.rect(4, oy - 2, 8, 3, color);
    s.rect(4, oy - 2, 8, 1, C.white);
    if (kind === "chef") {
      s.rect(4, oy - 4, 8, 3, C.white);
      s.rect(4, oy - 4, 8, 1, C.gray);
    }
    if ((kind === "kepi" || kind === "cap") && !back) s.rect(4, oy + 1, 9, 1, C.outline); // lưỡi trai
  }

  s.outline(C.outline);
  return s;
}

/** Ghép cây chổi vào tay phải (đạo cụ cho lao công). */
function withBroom(img: Img): Img {
  const o = new Img(img.w, img.h);
  o.blit(img, 0, 0);
  // cán chổi chéo từ vai phải xuống
  for (let i = 0; i < 12; i++) o.px(12 + Math.floor(i / 6), 10 + i, C.woodDark);
  // chùm chổi
  o.rect(12, 21, 4, 3, C.paverShade);
  o.rect(12, 23, 4, 1, C.woodDark);
  return o;
}

function busSprite(): Img {
  const b = new Img(80, 48);
  b.rect(6, 4, 22, 8, C.busRoof); // hộp mái
  b.rect(6, 4, 22, 1, C.white);
  b.rect(2, 12, 76, 26, C.bus);
  b.rect(2, 12, 76, 2, "#a5ea82");
  b.rect(2, 34, 76, 4, C.busDark);
  b.rect(2, 30, 76, 2, C.white);
  // cửa sổ
  b.rect(4, 20, 12, 10, C.busWin);
  b.rect(4, 20, 12, 2, C.busWinLight);
  for (let i = 0; i < 4; i++) {
    b.rect(20 + i * 12, 20, 11, 9, C.busWin);
    b.rect(20 + i * 12, 20, 11, 2, C.busWinLight);
  }
  // biển số tuyến 67 (đặt phía trên cửa kính, trên thân xe)
  b.rect(6, 13, 9, 6, C.red);
  drawText(b, "67", 7, 14, C.white);
  // đèn
  b.rect(75, 27, 3, 3, C.yellow);
  b.rect(2, 27, 2, 3, C.red);
  // bánh
  for (const cx of [17, 62]) {
    b.disc(cx, 39, 6, C.black);
    b.disc(cx, 39, 3, C.gray);
    b.disc(cx, 39, 1, C.grayDark);
  }
  b.outline(C.outline);
  return b;
}

// Phông chữ 3×5 tối giản cho biển hiệu.
const FONT: Record<string, string[]> = {
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  K: ["101", "101", "110", "101", "101"],
  E: ["111", "100", "110", "100", "111"],
  M: ["101", "111", "111", "101", "101"],
  C: ["111", "100", "100", "100", "111"],
  H: ["101", "101", "111", "101", "101"],
  A: ["010", "101", "111", "101", "101"],
  O: ["111", "101", "101", "101", "111"],
  L: ["100", "100", "100", "100", "111"],
  N: ["110", "101", "101", "101", "101"],
  G: ["111", "100", "101", "101", "111"],
  " ": ["000", "000", "000", "000", "000"],
};
function drawText(img: Img, text: string, x: number, y: number, color: string): void {
  let cx = x;
  for (const ch of text) {
    const g = FONT[ch];
    if (g) g.forEach((row, j) => [...row].forEach((v, i) => v === "1" && img.px(cx + i, y + j, color)));
    cx += 4;
  }
}

function cartSprite(w: number, sign: string, body: string, bodyDark: string, signBg: string, signFg: string, text: string): Img {
  const c = new Img(w, 32);
  c.rect(1, 1, w - 2, 9, signBg);
  c.box(1, 1, w - 2, 9, C.outline);
  drawText(c, text, Math.floor((w - (text.length * 4 - 1)) / 2), 3, signFg);
  c.rect(3, 10, 1, 8, C.grayDark);
  c.rect(w - 4, 10, 1, 8, C.grayDark);
  c.rect(2, 18, w - 4, 8, body);
  c.rect(2, 18, w - 4, 1, C.white);
  c.rect(2, 24, w - 4, 2, bodyDark);
  c.rect(5, 20, 6, 4, sign === "kem" ? C.white : C.creamLight);
  c.rect(w - 11, 20, 6, 4, sign === "kem" ? C.pinkDark : C.yellow);
  for (const cx of [7, w - 8]) {
    c.disc(cx, 28, 3, C.black);
    c.disc(cx, 28, 1, C.gray);
  }
  c.outline(C.outline);
  return c;
}

function bikeSprite(): Img {
  const b = new Img(24, 20);
  b.disc(5, 15, 4, C.black);
  b.disc(5, 15, 2, C.gray);
  b.disc(18, 15, 4, C.black);
  b.disc(18, 15, 2, C.gray);
  b.rect(6, 9, 12, 4, C.pink);
  b.rect(6, 9, 12, 1, "#f9c6dc");
  b.rect(16, 6, 2, 5, C.grayDark);
  b.rect(15, 5, 4, 1, C.grayDark);
  // người lái mũ vàng
  b.rect(9, 2, 5, 4, C.yellow);
  b.rect(9, 6, 5, 3, C.pinkDark);
  b.rect(10, 5, 3, 1, C.skin);
  b.outline(C.outline);
  return b;
}

const frames: Record<string, { x: number; y: number; w: number; h: number }> = {};
const atlas = new Img(320, 96);
function put(name: string, img: Img, x: number, y: number): void {
  atlas.blit(img, x, y);
  frames[name] = { x, y, w: img.w, h: img.h };
}

const PLAYER: Look = { hair: C.hair, girl: false };
(["down", "up", "left", "right"] as Dir[]).forEach((d, di) => {
  for (let f = 0; f < 5; f++) put(`player_${d}_${f}`, person(d, f, PLAYER), (di * 5 + f) * 16, 0);
});
put("student_boy", person("down", 0, { hair: "#3a2a22", girl: false }), 0, 24);
put("student_girl", person("down", 0, { hair: "#1c1c26", girl: true }), 16, 24);
// NPC chính (feature he-thong-npc-va-lich): phân biệt bằng tóc/giới (placeholder tự tạo,
// thay bản vẽ tay sau mà không đổi code miễn giữ tên khung).
put("npc_thu", person("down", 0, { hair: "#3a2a22", girl: true }), 32, 24); // Trịnh Minh Thư (lớp trưởng)
put("npc_kiet", person("down", 0, { hair: "#2f2418", girl: false }), 48, 24); // Nguyễn Trần Anh Kiệt (bạn thân)
put("npc_huy", person("down", 0, { hair: "#5a4a3a", girl: false }), 64, 24); // Lê Hoàng Huy (cá biệt)
put("npc_ngan_trinh", person("down", 0, { hair: "#6b4a8a", girl: true }), 80, 24); // Nguyễn Ngọc Ngân Trinh (văn nghệ)
put("npc_nguyen", person("down", 0, { hair: "#1c1c26", girl: true }), 96, 24); // Hồ Thị Phương Nguyên (biến mất)
// NPC người lớn/hàng quán: sprite riêng, khác trang phục/mũ + đạo cụ (FR8.2).
put("npc_bao_ve", person("down", 0, { hair: "#2a2a36", girl: false, top: "#6b7a52", hat: { kind: "kepi", color: "#4a5a34" } }), 112, 24); // bảo vệ/giám thị
put("npc_lao_cong", withBroom(person("down", 0, { hair: "#8a8a90", girl: false, top: "#5a7a4a" })), 128, 24); // lao công + chổi
put("npc_ban_kem", person("down", 0, { hair: "#3a2a22", girl: true, top: C.pink, apron: true, hat: { kind: "chef", color: C.white } }), 144, 24); // cô bán kem
put("npc_chao_long", person("down", 0, { hair: "#3a2a22", girl: false, top: "#a9713d", apron: true }), 160, 24); // chú cháo lòng
put("npc_tai_xe", person("down", 0, { hair: "#2a2a36", girl: false, top: C.blue, hat: { kind: "cap", color: C.blueDark } }), 176, 24); // bác tài xe buýt
put("npc_chu_nhiem", person("down", 0, { hair: "#2a2a36", girl: true, top: C.teal }), 192, 24); // cô chủ nhiệm
put("npc_the_duc", person("down", 0, { hair: "#2a2a36", girl: false, top: C.red, hat: { kind: "cap", color: C.redDark } }), 208, 24); // thầy thể dục
put("bus_67", busSprite(), 0, 48);
put("cart_kem", cartSprite(32, "kem", C.pink, C.pinkDark, C.pink, C.white, "KEM"), 80, 48);
put("cart_chao_long", cartSprite(40, "chao", C.gray, C.grayDark, C.yellow, C.redDark, "CHAO LONG"), 112, 48);
put("motorbike", bikeSprite(), 152, 48);

// ---------- Ghi file ----------
mkdirSync("public/assets", { recursive: true });
mkdirSync("docs/product", { recursive: true });
tileset.save("public/assets/tileset.png");
writeFileSync(
  "public/assets/tileset.json",
  JSON.stringify({ tileSize: 16, columns: COLS, image: "tileset.png", tiles: tilesetIndex }, null, 2) + "\n",
);
atlas.save("public/assets/sprites.png");
writeFileSync("public/assets/sprites.json", JSON.stringify({ image: "sprites.png", frames }, null, 2) + "\n");

// Ảnh xem nhanh: phóng 4×, nền caro, lưới theo ô.
const K = 4;
const tsBig = tileset.scaled(K);
const spBig = atlas.scaled(K);
const W = Math.max(tsBig.w, spBig.w);
const preview = new Img(W, tsBig.h + 16 + spBig.h);
for (let y = 0; y < preview.h; y++)
  for (let x = 0; x < W; x++) preview.px(x, y, ((x >> 4) + (y >> 4)) % 2 === 0 ? "#3a3d4d" : "#33364a");
preview.blit(tsBig, 0, 0);
preview.blit(spBig, 0, tsBig.h + 16);
for (let gx = 0; gx <= tsBig.w; gx += 16 * K) for (let y = 0; y < tsBig.h; y++) preview.px(gx, y, "#ffffff44".slice(0, 7));
for (let gy = 0; gy <= tsBig.h; gy += 16 * K) for (let x = 0; x < tsBig.w; x++) preview.px(x, gy, "#ffffff44".slice(0, 7));
preview.save("docs/product/asset-preview.png");

console.log(`tileset: ${TILE_DRAWERS.length} tile, sprites: ${Object.keys(frames).length} khung`);
