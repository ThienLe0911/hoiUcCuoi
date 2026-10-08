// Sinh bộ pixel art (tự tạo) cho "Hồi Trống Cuối".
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
//
// Phong cách (bản tinh chỉnh):
//  - Viền "sel-out": viền lấy màu tối của chính mảng kề bên (không dùng một màu viền
//    chung), cạnh dưới đậm hơn → khối tròn, mượt và sắc hơn.
//  - Đổ bóng theo nguồn sáng trên-trái, mỗi vật liệu 3–4 sắc độ.
//  - Nhân vật vẽ bằng mẫu pixel (template) chibi: đầu to, đồng phục cấp 3
//    (áo sơ mi trắng, quần xanh đen, cà vạt xanh dương nhạt, phù hiệu trường).
import { mkdirSync, writeFileSync } from "node:fs";
import pngjs from "pngjs";

const { PNG } = pngjs;

// ---------- Bảng màu ----------
const C = {
  outline: "#2b2f45", ink: "#1b1d33",
  cream: "#efe2b4", creamShade: "#e2d29f", creamLight: "#f8efcf", creamDark: "#cdbd8e", creamDeep: "#b2a172",
  sky: "#7fb5e6", skyShade: "#5e96cc", skyLight: "#aed3f3", skyDeep: "#4778b0", skyPale: "#d6eafa",
  teal: "#33a99e", tealDark: "#237f77", tealLight: "#6cd0c4", tealDeep: "#185c57",
  blue: "#2f6fc2", blueDark: "#22529a", blueLight: "#5b94e0", blueDeep: "#183c72",
  floor: "#dcd5c3", floorShade: "#c9c1ac", floorDark: "#b3ab95", floorLight: "#e9e4d6",
  paver: "#d8b27a", paverShade: "#bf955d", paverLight: "#ebcb96", paverDeep: "#a57c48",
  grass: "#55b257", grassDark: "#40944a", grassLight: "#82cf6c", grassDeep: "#2f7537",
  leaf: "#3a8d3e", leafDark: "#28692f", leafLight: "#5aad52", leafPale: "#8fd170", leafDeep: "#1a4d25",
  trunk: "#7a4a2a", trunkDark: "#563220", trunkLight: "#9c6742",
  red: "#d93a3a", redDark: "#a82828", redLight: "#f06a6a", yellow: "#f6d743", yellowDark: "#d6b02a",
  road: "#8a8d93", roadDark: "#787b82", roadLight: "#9ea1a7", white: "#f7f7f7",
  wood: "#a9713d", woodDark: "#7f5129", woodLight: "#c88f57", woodDeep: "#5f3b1e",
  courtBlue: "#2f63b8", courtBlueDark: "#284f96", courtBlueLight: "#3a70c4", courtBrown: "#8b5e3c", courtBrownDark: "#6d4529",
  brick: "#b5573c", brickDark: "#8f4230", brickLight: "#c96c50",
  pink: "#f4a6c8", pinkDark: "#d87aa6", pinkLight: "#fbd2e4",
  pot: "#f2f2f4", potShade: "#cfd2dc", potDeep: "#a9adbb",
  gray: "#9a9ca6", grayDark: "#6f717d", grayLight: "#c4c6ce", black: "#1e1e26",
  bus: "#7ed957", busDark: "#52b041", busDeep: "#357f2c", busLight: "#aaec88", busRoof: "#f2ecc8",
  busWin: "#24364f", busWinLight: "#4f74a3", busShine: "#8fb3dc",
  // nhân vật
  skin: "#f7d1ac", skinShade: "#e3a982", blush: "#f4a593", eye: "#2b2238", mouth: "#d98a78",
  shirt: "#f9fafd", shirtShade: "#d7ddec", shirtDeep: "#b3bdd6", collar: "#ffffff",
  tie: "#9dd3f7", tieDark: "#67ade2", badge: "#2f6fc2",
  navy: "#2b3664", belt: "#1b1b25", buckle: "#d3d7e0",
  shoe: "#25252f", shoeLight: "#555870",
  straw: "#ead39b", strawShade: "#c6a764", strawLight: "#f8ecc6", strawDeep: "#a3854a",
  apron: "#fbfbf5", apronShade: "#dcdccc",
  shadow: "#1b1d3350",
} as const;

type RGBA = [number, number, number, number];
const cache = new Map<string, RGBA>();
function rgba(hex: string): RGBA {
  let v = cache.get(hex);
  if (!v) {
    const n = parseInt(hex.slice(1, 7), 16);
    const a = hex.length >= 9 ? parseInt(hex.slice(7, 9), 16) : 255;
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
    cache.set(hex, v);
  }
  return v;
}
function toHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return "#" + h(r) + h(g) + h(b);
}
/** Trộn hai màu (t = 0 → a, t = 1 → b). */
function mix(a: string, b: string, t: number): string {
  const A = rgba(a);
  const B = rgba(b);
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
/** Tối đi theo hướng xanh tím (bóng "lạnh"), sáng lên theo hướng kem (sáng "ấm"). */
const darker = (c: string, t: number): string => mix(c, C.ink, t);
const lighter = (c: string, t: number): string => mix(c, "#fbf8ff", t);

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
    x = Math.round(x);
    y = Math.round(y);
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
    this.d[i + 3] = c[3];
  }
  get(x: number, y: number): RGBA {
    const i = (y * this.w + x) * 4;
    return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]];
  }
  hexAt(x: number, y: number): string {
    const c = this.get(x, y);
    return toHex(c[0], c[1], c[2]);
  }
  opaque(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    return this.d[(y * this.w + x) * 4 + 3] > 0;
  }
  solid(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    return this.d[(y * this.w + x) * 4 + 3] === 255;
  }
  rect(x: number, y: number, w: number, h: number, hex: string | null): void {
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
  /** Khung vát: cạnh trên-trái sáng, dưới-phải tối. */
  bevel(x: number, y: number, w: number, h: number, light: string, dark: string): void {
    this.rect(x, y, w, 1, light);
    this.rect(x, y, 1, h, light);
    this.rect(x, y + h - 1, w, 1, dark);
    this.rect(x + w - 1, y, 1, h, dark);
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
        const a = c[3] / 255;
        if (c[3] === 255 || this.d[k + 3] === 0) {
          this.d[k] = c[0];
          this.d[k + 1] = c[1];
          this.d[k + 2] = c[2];
          this.d[k + 3] = c[3];
        } else {
          for (let n = 0; n < 3; n++) this.d[k + n] = Math.round(c[n] * a + this.d[k + n] * (1 - a));
          this.d[k + 3] = Math.max(this.d[k + 3], c[3]);
        }
      }
  }
  flipX(): Img {
    const o = new Img(this.w, this.h);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const s = (y * this.w + x) * 4;
        const k = (y * this.w + (this.w - 1 - x)) * 4;
        for (let n = 0; n < 4; n++) o.d[k + n] = this.d[s + n];
      }
    return o;
  }
  /**
   * Viền "sel-out" 1px quanh phần đã vẽ: mỗi ô viền lấy màu của mảng kề bên rồi
   * trộn về `dark` (k = độ đậm). Viền phía dưới vật đậm hơn để tạo khối.
   */
  outline(dark: string = C.ink, k = 0.68): void {
    const add: [number, number, string][] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.opaque(x, y)) continue;
        let n: [number, number] | null = null;
        let below = false;
        if (this.solid(x, y - 1)) {
          n = [x, y - 1];
          below = true;
        } else if (this.solid(x - 1, y)) n = [x - 1, y];
        else if (this.solid(x + 1, y)) n = [x + 1, y];
        else if (this.solid(x, y + 1)) n = [x, y + 1];
        if (!n) continue;
        add.push([x, y, mix(this.hexAt(n[0], n[1]), dark, below ? Math.min(1, k + 0.14) : k)]);
      }
    for (const [x, y, c] of add) this.px(x, y, c);
  }
  /** Bóng elip bán trong suốt dưới chân (chỉ phủ ô còn trống). */
  shadow(cx: number, cy: number, rx: number, ry: number, hex: string = C.shadow): void {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.opaque(x, y)) continue;
        if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) this.px(x, y, hex);
      }
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
/** Rắc điểm màu theo nhiễu (p = tỉ lệ phủ). */
function speck(t: Img, seed: number, p: number, hex: string, x0 = 0, y0 = 0, w = 16, h = 16): void {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (hash(x, y, seed) > 1 - p) t.px(x, y, hex);
}

// ---------- Mẫu pixel ----------
type Pal = Record<string, string | null>;
/** Đóng dấu mẫu chuỗi lên ảnh; "." là trong suốt (giữ nguyên ô bên dưới). */
function stamp(img: Img, rows: readonly string[], x: number, y: number, pal: Pal): void {
  const w = rows[0].length;
  rows.forEach((row, j) => {
    if (row.length !== w) throw new Error(`Mẫu pixel lệch độ dài ở dòng ${j}: "${row}"`);
    [...row].forEach((ch, i) => {
      if (ch === ".") return;
      const c = pal[ch];
      if (c === undefined) throw new Error(`Mẫu pixel dùng khóa màu lạ '${ch}'`);
      img.px(x + i, y + j, c);
    });
  });
}

// ---------- Tile 16×16 ----------
type Draw = (t: Img) => void;

function wallBg(t: Img): void {
  t.rect(0, 0, 16, 16, C.cream);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const h = hash(x, y, 1);
      if (h > 0.972) {
        t.px(x, y, C.creamShade);
        t.px((x + 1) % 16, y, C.creamShade);
      } else if (h < 0.02) t.px(x, y, C.creamLight);
    }
}
function floorBg(t: Img): void {
  t.rect(0, 0, 16, 16, C.floor);
  t.rect(0, 0, 15, 1, C.floorLight);
  t.rect(0, 0, 1, 15, C.floorLight);
  t.rect(0, 15, 16, 1, C.floorShade);
  t.rect(15, 0, 1, 16, C.floorShade);
  speck(t, 2, 0.035, C.floorShade, 2, 2, 12, 12);
  speck(t, 22, 0.03, C.floorLight, 2, 2, 12, 12);
}
function grassBg(t: Img): void {
  t.rect(0, 0, 16, 16, C.grass);
  speck(t, 3, 0.07, C.grassDark);
  speck(t, 13, 0.03, C.grassLight);
  // khóm cỏ nhỏ hình "ʌ"
  for (const [x, y] of [[2, 4], [10, 2], [6, 9], [12, 11], [1, 13], [8, 14]] as const) {
    if (hash(x, y, 12) < 0.25) continue;
    t.px(x, y, C.grassLight);
    t.px(x + 1, y - 1, C.grassLight);
    t.px(x + 2, y, C.grassLight);
    t.px(x, y + 1, C.grassDark);
    t.px(x + 2, y + 1, C.grassDark);
  }
}
function roadBg(t: Img): void {
  t.rect(0, 0, 16, 16, C.road);
  speck(t, 4, 0.08, C.roadDark);
  speck(t, 14, 0.04, C.roadLight);
}
function paverBg(t: Img, seed = 5): void {
  t.rect(0, 0, 16, 16, C.paver);
  for (let by = 0; by < 2; by++)
    for (let bx = 0; bx < 2; bx++) {
      const ox = bx * 8;
      const oy = by * 8;
      t.bevel(ox, oy, 8, 8, C.paverLight, C.paverShade);
      t.px(ox + 7, oy, C.paver);
      t.px(ox, oy + 7, C.paver);
      speck(t, seed + bx * 7 + by * 3, 0.06, C.paverShade, ox + 2, oy + 2, 4, 4);
      if (hash(bx, by, seed) > 0.6) t.px(ox + 5, oy + 3, C.paverDeep);
    }
}
function pillarAt(t: Img, top: boolean): void {
  wallBg(t);
  const body = [C.skyPale, C.skyLight, C.skyLight, C.sky, C.sky, C.sky, C.skyShade, C.skyDeep];
  body.forEach((c, i) => t.rect(4 + i, 0, 1, 16, c));
  t.rect(3, 0, 1, 16, C.outline);
  t.rect(12, 0, 1, 16, C.outline);
  t.rect(13, 0, 1, 16, C.creamShade); // bóng cột hắt lên tường
  if (top) {
    const cap = [C.skyPale, C.skyPale, C.skyLight, C.skyLight, C.skyLight, C.sky, C.sky, C.sky, C.skyShade, C.skyShade];
    cap.forEach((c, i) => t.rect(3 + i, 0, 1, 3, c));
    t.rect(3, 0, 10, 1, C.skyPale);
    t.rect(3, 2, 10, 1, C.skyShade);
    t.rect(2, 0, 1, 4, C.outline);
    t.rect(13, 0, 1, 4, C.outline);
    t.rect(2, 3, 12, 1, C.outline);
    t.rect(4, 4, 8, 1, C.skyDeep); // bóng dưới đầu cột
  }
}
function doorAt(t: Img): void {
  wallBg(t);
  t.rect(2, 1, 12, 15, C.creamDark); // khung cửa
  t.rect(3, 2, 10, 14, C.teal);
  t.bevel(3, 2, 10, 14, C.tealLight, C.tealDark);
  t.rect(5, 4, 6, 5, C.skyLight);
  t.rect(5, 4, 6, 1, C.tealDeep);
  t.rect(5, 4, 1, 5, C.tealDeep);
  t.px(9, 5, C.skyPale);
  t.px(8, 6, C.skyPale);
  t.px(7, 7, C.skyPale);
  t.bevel(5, 11, 6, 3, C.tealDark, C.tealLight); // ô ván dưới
  t.px(11, 10, C.yellow);
  t.px(11, 11, C.yellowDark);
}
function windowAt(t: Img): void {
  wallBg(t);
  t.rect(2, 3, 12, 9, C.tealDark);
  t.rect(2, 3, 12, 1, C.teal);
  t.rect(3, 4, 10, 7, C.skyLight);
  t.rect(3, 4, 10, 2, C.sky);
  t.rect(3, 9, 10, 2, C.skyPale);
  // vệt phản chiếu chéo
  for (let i = 0; i < 3; i++) {
    t.px(4 + i, 9 - i, C.white);
    t.px(10 + i, 9 - i, C.skyPale);
  }
  t.rect(7, 4, 2, 7, C.teal);
  t.rect(8, 4, 1, 7, C.tealDark);
  t.rect(3, 7, 10, 1, C.teal);
  t.rect(1, 12, 14, 1, C.creamLight); // bậu cửa
  t.rect(1, 13, 14, 1, C.creamDark);
}
/** Vẽ tán lá từ các cụm tròn (sau → trước), mỗi cụm 3 sắc độ, rồi rắc lá. */
function foliage(img: Img, blobs: [number, number, number][], seed: number): void {
  for (const [x, y, r] of blobs) {
    img.disc(x, y + 0.8, r, C.leafDark);
    img.disc(x - 0.4, y - 0.3, r - 0.9, C.leaf);
    img.disc(x - r * 0.32, y - r * 0.38, r * 0.48, C.leafLight);
    img.disc(x - r * 0.42, y - r * 0.5, r * 0.18, C.leafPale);
  }
  const leaf = rgba(C.leaf);
  const light = rgba(C.leafLight);
  for (let y = 0; y < img.h; y++)
    for (let x = 0; x < img.w; x++) {
      if (!img.opaque(x, y)) continue;
      const c = img.get(x, y);
      const h = hash(x, y, seed);
      if (c[0] === leaf[0] && c[1] === leaf[1] && h > 0.9) img.px(x, y, C.leafDark);
      else if (c[0] === light[0] && c[1] === light[1] && h > 0.88) img.px(x, y, C.leaf);
      else if (c[0] === leaf[0] && c[1] === leaf[1] && h < 0.05) img.px(x, y, C.leafLight);
    }
}
/** Tán cây 32×32 (ghép từ 4 ô). */
function canopy(): Img {
  const c = new Img(32, 32);
  foliage(c, [[16, 8, 7], [9, 12, 6.5], [23, 12, 6.5], [16, 15, 8], [9, 20, 6.5], [23, 20, 6.5], [16, 22, 7]], 6);
  c.outline(C.leafDeep, 0.55);
  return c;
}
const CANOPY = canopy();

function bushImg(): Img {
  const b = new Img(16, 16);
  foliage(b, [[8, 5, 4.5], [4.5, 8, 4], [11.5, 8, 4], [8, 10, 5]], 7);
  b.outline(C.leafDeep, 0.55);
  return b;
}
const BUSH = bushImg();

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
  R: ["110", "101", "110", "101", "101"],
  U: ["101", "101", "101", "101", "111"],
  D: ["110", "101", "101", "101", "110"],
  T: ["111", "010", "010", "010", "010"],
  I: ["111", "010", "010", "010", "111"],
  Y: ["101", "101", "010", "010", "010"],
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

const TILE_DRAWERS: [string, Draw][] = [
  ["empty", () => {}],
  ["wall_cream", wallBg],
  ["wall_cream_base", (t) => {
    wallBg(t);
    t.rect(0, 10, 16, 1, C.creamLight);
    t.rect(0, 11, 16, 5, C.creamDark);
    t.rect(0, 11, 16, 1, C.creamShade);
    t.rect(0, 15, 16, 1, C.creamDeep);
    speck(t, 15, 0.05, C.creamDeep, 0, 12, 16, 3);
  }],
  ["pillar_blue", (t) => pillarAt(t, false)],
  ["pillar_blue_top", (t) => pillarAt(t, true)],
  ["railing_teal", (t) => {
    t.rect(0, 4, 16, 1, C.tealLight);
    t.rect(0, 5, 16, 1, C.teal);
    t.rect(0, 6, 16, 1, C.tealDark);
    t.rect(0, 7, 16, 1, C.tealDeep);
    for (let x = 1; x < 16; x += 4) {
      t.rect(x, 8, 1, 7, C.teal);
      t.rect(x + 1, 8, 1, 7, C.tealDark);
    }
    t.rect(0, 14, 16, 1, C.teal);
    t.rect(0, 15, 16, 1, C.tealDeep);
  }],
  ["railing_post", (t) => {
    t.rect(0, 6, 6, 1, C.teal);
    t.rect(0, 7, 6, 1, C.tealDeep);
    t.rect(10, 6, 6, 1, C.teal);
    t.rect(10, 7, 6, 1, C.tealDeep);
    for (const x of [1, 13]) {
      t.rect(x, 8, 1, 7, C.teal);
      t.rect(x + 1, 8, 1, 7, C.tealDark);
    }
    t.rect(0, 14, 6, 1, C.teal);
    t.rect(10, 14, 6, 1, C.teal);
    t.rect(0, 15, 16, 1, C.tealDeep);
    [C.skyPale, C.skyLight, C.sky, C.skyShade].forEach((c, i) => t.rect(6 + i, 3, 1, 13, c));
    t.rect(5, 2, 6, 1, C.skyPale);
    t.rect(5, 3, 6, 1, C.skyLight);
    t.rect(5, 4, 6, 1, C.skyDeep);
    t.rect(5, 2, 1, 3, C.outline);
    t.rect(10, 2, 1, 3, C.outline);
  }],
  ["floor_corridor", floorBg],
  ["floor_corridor_shadow", (t) => {
    floorBg(t);
    const deep = mix(C.floorShade, C.floorDark, 0.6);
    t.rect(0, 0, 16, 4, deep);
    t.rect(0, 4, 16, 2, C.floorShade);
    for (let x = 0; x < 16; x += 2) t.px(x, 6, C.floorShade);
    t.rect(15, 0, 1, 16, C.floorShade);
  }],
  ["paving_brown", (t) => paverBg(t)],
  ["low_wall_cream", (t) => {
    t.rect(0, 0, 16, 16, C.cream);
    t.rect(0, 0, 16, 1, C.creamLight);
    t.rect(0, 1, 16, 2, C.creamLight);
    t.rect(0, 3, 16, 1, C.creamDeep);
    // gạch xây so le, có vát
    for (let row = 0; row < 3; row++) {
      const y = 4 + row * 4;
      const off = row % 2 === 0 ? 0 : 4;
      for (let x = -8 + off; x < 16; x += 8) {
        t.rect(x, y, 8, 1, C.creamLight);
        t.rect(x + 7, y, 1, 4, C.creamShade);
      }
      t.rect(0, y + 3, 16, 1, C.creamShade);
    }
    t.rect(0, 15, 16, 1, C.creamDark);
  }],
  ["low_wall_diamond", (t) => {
    t.rect(0, 0, 16, 16, C.cream);
    t.rect(0, 0, 16, 2, C.creamLight);
    t.rect(0, 2, 16, 1, C.creamDeep);
    // ô thoi xanh, có vát sáng/tối
    for (let i = 0; i < 5; i++) {
      t.rect(8 - i, 4 + i, i * 2, 1, C.blue);
      t.rect(8 - i, 12 - i, i * 2, 1, C.blueDark);
    }
    for (let i = 1; i < 5; i++) {
      t.px(8 - i, 4 + i, C.blueLight);
      t.px(7 + i, 12 - i, C.blueDeep);
    }
    t.rect(4, 8, 8, 1, C.blue);
    t.px(7, 7, C.blueLight);
    t.rect(0, 14, 16, 1, C.creamShade);
    t.rect(0, 15, 16, 1, C.creamDark);
  }],
  ["grass", grassBg],
  ["grass_flower", (t) => {
    grassBg(t);
    const flower = (x: number, y: number, petal: string, core: string) => {
      t.px(x, y - 1, petal);
      t.px(x - 1, y, petal);
      t.px(x + 1, y, petal);
      t.px(x, y + 1, petal);
      t.px(x, y, core);
    };
    flower(4, 4, C.white, C.yellow);
    flower(11, 10, C.pinkLight, C.yellowDark);
    t.px(7, 13, C.yellow);
    t.px(13, 3, C.white);
  }],
  ["bush", (t) => {
    grassBg(t);
    t.shadow(8.5, 13, 7, 2.5, "#2f7537");
    t.blit(BUSH, 0, 0);
  }],
  ["road", roadBg],
  ["road_dash", (t) => {
    roadBg(t);
    t.rect(2, 7, 12, 2, C.white);
    t.rect(2, 8, 12, 1, "#dcdcdc");
  }],
  ["crosswalk", (t) => {
    roadBg(t);
    for (let x = 1; x < 16; x += 5) {
      t.rect(x, 0, 3, 16, C.white);
      t.rect(x + 2, 0, 1, 16, "#dedede");
    }
  }],
  ["road_curb", (t) => {
    paverBg(t);
    t.rect(0, 8, 16, 1, C.floorLight); // mép bó vỉa
    t.rect(0, 9, 16, 1, C.floorDark);
    t.rect(0, 10, 16, 6, C.road);
    t.rect(0, 10, 16, 1, C.roadDark);
    speck(t, 4, 0.08, C.roadDark, 0, 11, 16, 5);
    speck(t, 14, 0.04, C.roadLight, 0, 11, 16, 5);
  }],
  ["tree_canopy_tl", (t) => t.blit(CANOPY, 0, 0, 0, 0, 16, 16)],
  ["tree_canopy_tr", (t) => t.blit(CANOPY, 0, 0, 16, 0, 16, 16)],
  ["tree_canopy_bl", (t) => t.blit(CANOPY, 0, 0, 0, 16, 16, 16)],
  ["tree_canopy_br", (t) => t.blit(CANOPY, 0, 0, 16, 16, 16, 16)],
  ["tree_trunk", (t) => {
    t.shadow(8, 14, 7, 2, C.shadow);
    t.rect(5, 0, 6, 13, C.trunk);
    t.rect(5, 0, 1, 13, C.trunkLight);
    t.rect(6, 0, 1, 13, mix(C.trunk, C.trunkLight, 0.5));
    t.rect(9, 0, 2, 13, C.trunkDark);
    t.rect(5, 0, 6, 2, C.trunkDark); // bóng tán đổ xuống
    for (const [x, y] of [[7, 4], [8, 5], [7, 8], [8, 10], [6, 11]] as const) t.px(x, y, C.trunkDark);
    t.rect(4, 11, 8, 2, C.trunk);
    t.rect(3, 12, 10, 2, C.trunk);
    t.px(4, 11, C.trunkLight);
    t.px(3, 12, C.trunkLight);
    t.rect(9, 11, 3, 3, C.trunkDark);
    t.rect(3, 13, 10, 1, C.trunkDark);
    t.outline(C.ink, 0.6);
  }],
  ["bonsai", (t) => {
    const b = new Img(16, 16);
    foliage(b, [[8, 4, 3.5], [5, 6, 3], [11, 6, 3]], 9);
    b.rect(4, 10, 8, 5, C.pot);
    b.rect(4, 10, 1, 5, C.white);
    b.rect(10, 10, 2, 5, C.potShade);
    b.rect(4, 14, 8, 1, C.potDeep);
    b.rect(3, 9, 10, 1, C.pot);
    b.rect(3, 9, 10, 1, C.white);
    b.rect(4, 10, 8, 1, C.potShade);
    b.rect(7, 8, 2, 1, C.trunk);
    b.outline(C.ink, 0.6);
    t.blit(b, 0, 0);
  }],
  ["gate_iron", (t) => {
    t.rect(0, 1, 16, 1, C.blueLight);
    t.rect(0, 2, 16, 1, C.blueDark);
    t.rect(0, 13, 16, 1, C.blueLight);
    t.rect(0, 14, 16, 1, C.blueDark);
    for (let x = 1; x < 16; x += 4) {
      t.rect(x, 3, 1, 10, C.blueLight);
      t.rect(x + 1, 3, 1, 10, C.blueDark);
      t.px(x, 2, C.blueLight); // đầu song nhọn
    }
    t.rect(0, 7, 16, 1, C.blue);
    t.rect(0, 8, 16, 1, C.blueDeep);
  }],
  ["gate_pillar", (t) => {
    t.rect(2, 0, 12, 16, C.blue);
    t.rect(2, 0, 2, 16, C.blueLight);
    t.rect(4, 0, 1, 16, mix(C.blue, C.blueLight, 0.5));
    t.rect(11, 0, 3, 16, C.blueDark);
    t.rect(13, 0, 1, 16, C.blueDeep);
    for (let y = 3; y < 16; y += 4) {
      t.rect(2, y, 12, 1, C.blueDark);
      t.rect(2, y + 1, 12, 1, C.blueLight);
      t.px(13, y + 1, C.blueDark);
    }
    t.rect(1, 0, 1, 16, C.outline);
    t.rect(14, 0, 1, 16, C.outline);
  }],
  ["gate_arch_l", (t) => {
    for (let x = 4; x < 16; x++) {
      const drop = x < 8 ? 8 - x : 0;
      t.rect(x, 3 + drop, 1, 6, C.cream);
      t.px(x, 3 + drop, C.creamLight);
      t.px(x, 4 + drop, C.creamLight);
      t.px(x, 7 + drop, C.creamShade);
      t.px(x, 8 + drop, C.creamDark);
    }
    t.outline(C.ink, 0.6);
  }],
  ["gate_arch_m", (t) => {
    t.rect(0, 3, 16, 6, C.cream);
    t.rect(0, 3, 16, 2, C.creamLight);
    t.rect(0, 7, 16, 1, C.creamShade);
    t.rect(0, 8, 16, 1, C.creamDark);
    t.rect(0, 2, 16, 1, mix(C.creamLight, C.ink, 0.6));
    t.rect(0, 9, 16, 1, mix(C.creamDark, C.ink, 0.75));
  }],
  ["gate_arch_r", (t) => {
    for (let x = 0; x < 12; x++) {
      const drop = x > 7 ? x - 7 : 0;
      t.rect(x, 3 + drop, 1, 6, C.cream);
      t.px(x, 3 + drop, C.creamLight);
      t.px(x, 4 + drop, C.creamLight);
      t.px(x, 7 + drop, C.creamShade);
      t.px(x, 8 + drop, C.creamDark);
    }
    t.outline(C.ink, 0.6);
  }],
  ["sign_blue", (t) => {
    t.rect(0, 3, 16, 10, C.blue);
    t.rect(0, 3, 16, 1, C.blueLight);
    t.rect(0, 4, 16, 1, C.yellowDark); // dải viền vàng trên
    t.rect(0, 11, 16, 1, C.yellowDark); // dải viền vàng dưới
    t.rect(0, 12, 16, 1, C.blueDeep);
    // Dòng chữ mô phỏng chữ nổi mạ vàng trên nền biển xanh
    for (let x = 1; x < 15; x += 3) {
      t.rect(x, 6, 2, 4, C.yellow);
      t.px(x, 6, "#fff4b8");
      t.px(x + 1, 9, C.yellowDark);
    }
  }],
  ["flag_red", (t) => {
    t.rect(2, 1, 1, 15, C.grayDark);
    t.rect(1, 1, 1, 15, C.grayLight);
    t.px(1, 0, C.yellow);
    t.px(2, 0, C.yellowDark);
    // lá cờ gợn sóng
    for (let x = 0; x < 11; x++) {
      const wave = Math.round(Math.sin(x * 0.7) * 0.8);
      for (let y = 0; y < 8; y++) {
        const shade = Math.sin(x * 0.7 + 0.9) > 0.3 ? C.redLight : Math.sin(x * 0.7 + 0.9) < -0.4 ? C.redDark : C.red;
        t.px(3 + x, 2 + y + wave, shade);
      }
    }
    // ngôi sao vàng
    const s = [[8, 4], [8, 5], [7, 6], [8, 6], [9, 6], [6, 6], [10, 6], [7, 7], [8, 7], [9, 7], [7, 8], [9, 8]];
    for (const [x, y] of s) t.px(x, y + Math.round(Math.sin((x - 3) * 0.7) * 0.8), C.yellow);
  }],
  ["door_teal", doorAt],
  ["window_teal", windowAt],
  ["wall_brick", (t) => {
    t.rect(0, 0, 16, 16, C.brick);
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      const off = row % 2 === 0 ? 3 : 7;
      t.rect(0, y, 16, 1, C.brickDark);
      t.rect(0, y + 1, 16, 1, C.brickLight);
      for (let x = off; x < 16; x += 8) t.rect(x, y + 1, 1, 3, C.brickDark);
    }
    speck(t, 18, 0.04, C.brickDark);
  }],
  ["roof_floor", (t) => {
    t.rect(0, 0, 16, 16, C.gray);
    t.bevel(0, 0, 16, 16, C.grayLight, C.grayDark);
    speck(t, 8, 0.07, C.grayDark, 1, 1, 14, 14);
    speck(t, 19, 0.04, C.grayLight, 1, 1, 14, 14);
  }],
  ["roof_fence", (t) => {
    t.rect(0, 3, 16, 1, C.tealLight);
    t.rect(0, 4, 16, 1, C.teal);
    t.rect(0, 5, 16, 1, C.tealDeep);
    for (let x = 1; x < 16; x += 4) {
      t.rect(x, 6, 1, 9, C.teal);
      t.rect(x + 1, 6, 1, 9, C.tealDark);
    }
    t.rect(0, 15, 16, 1, C.tealDeep);
  }],
  ["stairs", (t) => {
    for (let i = 0; i < 4; i++) {
      t.rect(0, i * 4, 16, 1, C.floorLight);
      t.rect(0, i * 4 + 1, 16, 2, C.floor);
      t.rect(0, i * 4 + 3, 16, 1, C.floorDark);
    }
    t.rect(0, 0, 1, 16, C.floorShade);
    t.rect(15, 0, 1, 16, C.floorShade);
  }],
  ["bench", (t) => {
    const b = new Img(16, 16);
    b.rect(1, 2, 14, 2, C.woodDark); // tựa lưng
    b.rect(1, 2, 14, 1, C.wood);
    b.rect(1, 5, 14, 4, C.wood);
    b.rect(1, 5, 14, 1, C.woodLight);
    b.rect(1, 7, 14, 1, C.woodDark); // khe giữa hai thanh
    b.rect(1, 8, 14, 1, C.woodLight);
    b.rect(1, 9, 14, 1, C.woodDeep);
    for (const x of [4, 9, 12]) b.px(x, 6, C.woodDark);
    b.rect(2, 10, 2, 4, C.woodDark);
    b.rect(12, 10, 2, 4, C.woodDark);
    b.rect(2, 10, 1, 4, C.wood);
    b.rect(12, 10, 1, 4, C.wood);
    b.outline(C.ink, 0.62);
    t.shadow(8, 14, 7, 1.6);
    t.blit(b, 0, 0);
  }],
  ["desk_pair", (t) => {
    const b = new Img(16, 16);
    b.rect(1, 3, 14, 6, C.wood);
    b.rect(1, 3, 14, 1, C.woodLight);
    b.rect(1, 4, 14, 1, mix(C.wood, C.woodLight, 0.5));
    for (const [x, y] of [[4, 6], [5, 6], [10, 5], [11, 5], [12, 7]] as const) b.px(x, y, C.woodDark); // vân gỗ
    b.rect(1, 8, 14, 1, C.woodDark);
    b.rect(8, 3, 1, 5, C.woodDark); // ghép đôi
    b.rect(1, 9, 14, 1, C.woodDeep);
    b.rect(2, 10, 1, 5, C.woodDark);
    b.rect(13, 10, 1, 5, C.woodDark);
    b.rect(2, 11, 12, 2, C.woodLight); // ghế băng
    b.rect(2, 13, 12, 1, C.woodDark);
    b.outline(C.ink, 0.62);
    t.blit(b, 0, 0);
  }],
  ["whiteboard", (t) => {
    wallBg(t);
    t.rect(1, 2, 14, 10, C.white);
    t.bevel(1, 2, 14, 10, C.grayLight, C.grayDark);
    t.rect(2, 3, 12, 1, "#ffffff");
    // chữ viết bảng
    t.rect(3, 5, 6, 1, C.blueLight);
    t.rect(3, 7, 9, 1, C.blueLight);
    t.rect(3, 9, 4, 1, C.red);
    t.px(11, 4, "#e5ecf6");
    t.px(12, 5, "#e5ecf6");
    t.rect(2, 12, 12, 1, C.grayDark); // khay phấn
    t.px(5, 11, C.red);
    t.px(6, 11, C.blue);
  }],
  ["court_blue", (t) => {
    t.rect(0, 0, 16, 16, C.courtBlue);
    speck(t, 9, 0.05, C.courtBlueDark);
    speck(t, 20, 0.03, C.courtBlueLight);
  }],
  ["court_line_h", (t) => {
    t.rect(0, 0, 16, 16, C.courtBlue);
    speck(t, 9, 0.05, C.courtBlueDark);
    t.rect(0, 7, 16, 2, C.white);
    t.rect(0, 8, 16, 1, "#dfe6f2");
  }],
  ["court_line_v", (t) => {
    t.rect(0, 0, 16, 16, C.courtBlue);
    speck(t, 9, 0.05, C.courtBlueDark);
    t.rect(7, 0, 2, 16, C.white);
    t.rect(8, 0, 1, 16, "#dfe6f2");
  }],
  ["court_corner", (t) => {
    t.rect(0, 0, 16, 16, C.courtBlue);
    speck(t, 9, 0.05, C.courtBlueDark);
    t.rect(7, 7, 9, 2, C.white);
    t.rect(7, 7, 2, 9, C.white);
    t.rect(8, 8, 8, 1, "#dfe6f2");
    t.rect(8, 8, 1, 8, "#dfe6f2");
  }],
  ["court_brown", (t) => {
    t.rect(0, 0, 16, 16, C.courtBrown);
    speck(t, 10, 0.07, C.courtBrownDark);
    speck(t, 21, 0.03, C.woodLight);
  }],
  ["hoop", (t) => {
    const b = new Img(16, 16);
    b.rect(2, 1, 12, 8, C.white);
    b.bevel(2, 1, 12, 8, "#ffffff", C.grayLight);
    b.box(5, 4, 6, 4, C.red);
    b.rect(3, 9, 10, 1, "#f08a2a"); // vành rổ cam
    b.rect(3, 10, 10, 1, "#c4641a");
    for (let y = 11; y < 15; y++) // lưới
      for (let x = 4 + (y - 11) / 2; x < 12 - (y - 11) / 2; x++) if ((x + y) % 2 === 0) b.px(x, y, C.white);
    b.outline(C.ink, 0.6);
    t.blit(b, 0, 0);
  }],
  ["hoop_pole", (t) => {
    t.shadow(8, 15, 5, 1.2);
    t.rect(7, 0, 2, 15, C.grayDark);
    t.rect(7, 0, 1, 15, C.grayLight);
    t.rect(5, 14, 6, 2, C.black);
    t.rect(5, 14, 6, 1, C.grayDark);
  }],
  ["pipe_red", (t) => {
    t.rect(0, 5, 16, 3, C.red);
    t.rect(0, 5, 16, 1, C.redLight);
    t.rect(0, 7, 16, 1, C.redDark);
    t.rect(0, 8, 16, 1, mix(C.redDark, C.ink, 0.5));
    for (const x of [3, 11]) {
      t.rect(x, 4, 2, 5, C.grayDark);
      t.rect(x, 4, 1, 5, C.grayLight);
    }
  }],
  ["chair", (t) => {
    const b = new Img(16, 16);
    b.rect(4, 3, 8, 3, C.woodDark);
    b.rect(4, 3, 8, 1, C.wood);
    b.rect(4, 6, 8, 6, C.wood);
    b.rect(4, 6, 8, 1, C.woodLight);
    b.rect(11, 6, 1, 6, C.woodDark);
    b.rect(4, 11, 8, 1, C.woodDeep);
    b.rect(5, 12, 1, 3, C.woodDark);
    b.rect(10, 12, 1, 3, C.woodDark);
    b.outline(C.ink, 0.62);
    t.blit(b, 0, 0);
  }],
  ["statue", (t) => {
    const b = new Img(16, 16);
    b.rect(3, 10, 10, 5, C.creamShade); // bệ
    b.rect(3, 10, 10, 1, C.creamLight);
    b.rect(3, 10, 1, 5, C.creamLight);
    b.rect(11, 11, 2, 4, C.creamDark);
    b.rect(3, 14, 10, 1, C.creamDeep);
    b.rect(5, 6, 6, 4, C.grayLight); // vai tượng bán thân
    b.rect(5, 6, 6, 1, "#dfe1e6");
    b.rect(9, 7, 2, 3, C.gray);
    b.disc(8, 3.5, 2.6, C.grayLight); // đầu
    b.px(7, 2, "#e8eaee");
    b.px(9, 4, C.gray);
    b.px(9, 5, C.gray);
    b.outline(C.ink, 0.6);
    t.blit(b, 0, 0);
  }],
  ["curtain_green", (t) => {
    wallBg(t);
    t.rect(6, 2, 4, 10, C.skyLight); // khe kính
    t.rect(6, 2, 4, 2, C.sky);
    const folds = ["#5aa862", "#4d9a55", "#3f8a48", "#4d9a55", "#3a7a42"];
    for (let i = 0; i < 5; i++) {
      t.rect(1 + i, 1, 1, 14, folds[i]);
      t.rect(10 + i, 1, 1, 14, folds[i]);
    }
    t.rect(1, 0, 14, 1, C.woodDark); // thanh treo
    t.rect(1, 15, 5, 1, "#2f6a38");
    t.rect(10, 15, 5, 1, "#2f6a38");
  }],
  ["wall_class_lower", (t) => {
    t.rect(0, 0, 16, 16, "#e4cf9b");
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      const off = row % 2 === 0 ? 3 : 7;
      t.rect(0, y, 16, 1, C.creamDark);
      t.rect(0, y + 1, 16, 1, "#efdcaa");
      for (let x = off; x < 16; x += 8) t.rect(x, y + 1, 1, 3, C.creamDark);
    }
  }],
  ["wall_class_upper", (t) => {
    t.rect(0, 0, 16, 16, "#f3f0e6");
    speck(t, 11, 0.035, "#e2dece");
    speck(t, 23, 0.02, "#fbf9f2");
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

// ---------- Nhân vật 16×24 ----------
// Bố cục (khi đứng): tóc từ dòng 1–2, mặt 2–10, áo 11–16, thắt lưng 17,
// quần 18–20, giày 21–22, bóng 22–23. Khung 1 và 3 nhún lên 1px.
type Dir = "down" | "up" | "left" | "right";
type View = "front" | "side" | "back";
type HairStyle = "short" | "spiky" | "messy" | "ponytail" | "bob" | "long" | "bun";
type Outfit = "uniform" | "untucked" | "plain" | "aodai";
interface Look {
  hair: string;
  style: HairStyle;
  girl?: boolean;
  outfit?: Outfit; // mặc định: đồng phục học sinh
  top?: string; // màu áo khi không mặc đồng phục
  pants?: string; // màu quần (mặc định xanh đen)
  hat?: { kind: "cap" | "kepi" | "non-la"; color: string };
  apron?: boolean; // tạp dề trắng (người bán)
  whistle?: boolean; // còi (thầy thể dục)
}

// Khóa màu: s da, S da tối, b má hồng, e mắt, m miệng, h/H/j tóc (giữa/tối/bóng),
// w/W/V áo (sáng/bóng/bóng sâu), c cổ áo, t/T cà vạt, a phù hiệu, l thắt lưng, L khóa,
// p/P quần, f/F giày, r nơ (xanh như cà vạt), k kẹp tóc hồng, A/B tạp dề.
const FACE: Record<View, string[]> = {
  front: [
    "....ssssssss....",
    "...ssssssssss...",
    "...ssssssssss...",
    "...ssssssssss...",
    "...ssssssssss...",
    "...sssessesss...",
    "...sssessesss...",
    "...SbssmmssbS...",
    "....SSssssSS....",
  ],
  side: [
    "....ssssssss....",
    "...ssssssssss...",
    "...ssssssssss...",
    "...ssssssssss...",
    "...ssssssssss...",
    "...sessssssss...",
    "..ssessssssss...",
    "...sbssssssss...",
    "....sssssSSS....",
  ],
  back: [
    "....ssssssss....",
    "...ssssssssss...",
    "...ssssssssss...",
    "...ssssssssss...",
    "...ssssssssss...",
    "...ssssssssss...",
    "...ssssssssss...",
    "...ssssssssss...",
    "....SSssssSS....",
  ],
};

// Tóc: mẫu tính từ dòng 0 của khung (đã cộng nhún).
const HAIR: Record<HairStyle, Partial<Record<View, string[]>>> = {
  short: {
    front: [
      "................",
      "................",
      "....hhhhhhhh....",
      "...hhjjhhhhhh...",
      "...hjjhhhhhhH...",
      "...hhhhhhhhhH...",
      "...hh..h...hH...",
      "...h........H...",
    ],
    side: [
      "................",
      "................",
      "....hhhhhhhh....",
      "...hhjjjhhhhh...",
      "...hjjhhhhhhhH..",
      "...hhhhhhhhhhH..",
      "...h.hhhhhhhhH..",
      "......hShhhhH...",
      "......hShhhhH...",
      ".......hhhhH....",
    ],
    back: [
      "................",
      "................",
      "....hhhhhhhh....",
      "...hhjjhhhhhh...",
      "...hjjhhhhhhH...",
      "...hhhhhhhhhH...",
      "...hhhhhhhhhH...",
      "...hhhhhhhhhH...",
      "...HhhhhhhhhH...",
      "...sHhhhhhhHS...",
    ],
  },
  spiky: {
    front: [
      "................",
      "....h.hh.hh.h...",
      "...hhhhhhhhhh...",
      "..hhjjhhhhhhHh..",
      "...hjjhhhhhhH...",
      "...hhhhhhhhhH...",
      "...h.hh.hh.hH...",
      "...h........H...",
    ],
  },
  messy: {
    front: [
      "................",
      "................",
      "....hhhhhhhh....",
      "...hhhjjhhhhh...",
      "..hhhjjhhhhhHh..",
      "..hhhhhhhhhhHh..",
      "..hh...hhhhhHh..",
      "..hh......hhHh..",
      "..h.........Hh..",
      "..h..........h..",
    ],
  },
  ponytail: {
    front: [
      "................",
      "................",
      "....hhhhhhhh....",
      "...hhjjhhhhhhrr.",
      "...hjjhhhhhhHrh.",
      "...hhhhhhhhhH.h.",
      "...hhh....hhH.h.",
      "...h........H.H.",
      "...h........H.H.",
      "..............H.",
    ],
  },
  bob: {
    front: [
      "................",
      "................",
      "....hhhhhhhh....",
      "...hhjjhhhhhh...",
      "..hhjjhhhhhhHh..",
      "..hhhhhhhhhhHh..",
      "..hhhh...hhhHh..",
      "..hh........Hh..",
      "..hh........Hh..",
      "..hh........Hh..",
      "..hHh......hHh..",
    ],
  },
  long: {
    front: [
      "................",
      "................",
      "....hhhhhhhh....",
      "...hhjjhhhhhh...",
      "..hhjjhhhhhhHh..",
      "..hhhhhhhhhhHh..",
      "..hhhhhhhhhhHh..",
      "..hh........Hh..",
      "..hh........Hh..",
      "..hh........Hh..",
      "..hh........Hh..",
      "..hh........Hh..",
      "..hh........Hh..",
      "..Hh........hH..",
    ],
  },
  bun: {
    front: [
      "................",
      "......hjhh......",
      "....hhhhhhhhk...",
      "...hhjjhhhhhhkk.",
      "...hjjhhhhhhH...",
      "...hhhhhhhhhH...",
      "...hh.h..h.hH...",
      "...hh......hH...",
      "...h........H...",
      "...h........H...",
    ],
  },
};

// Thân áo (x = 4..11 khi nhìn trước/sau, x = 5..10 khi nhìn ngang), từ dòng 11.
const TORSO: Record<Outfit | "side" | "back", string[]> = {
  uniform: [
    "wccTTccW",
    "wwctTcWW",
    "wwwtTwaW",
    "wwwtTwWW",
    "wwwtTwWV",
    "WwwTTwWV",
    "lllLLlll",
  ],
  untucked: [
    "wccsSccW",
    "wwctTcWW",
    "wwwtTwaW",
    "wwwwtTWW",
    "wwwwtTWV",
    "WwwwwwWV",
    "WWwwwWWV",
  ],
  plain: [
    "wccSSccW",
    "wwwwWwWW",
    "wwwwWVWW",
    "wwwwWwWW",
    "wwwwWwWV",
    "WwwwWwWV",
    "lllLLlll",
  ],
  aodai: [
    "wwccccwW",
    "wwwwWwwW",
    "wwwwwWwW",
    "wwwwwwWW",
    "wwwwwwWV",
    "WwwwwwWV",
    "WwwwwwWV",
    ".wwwwwW.",
    ".wwwwwW.",
    ".wwwwWW.",
  ],
  side: [
    "TccwwW",
    "twwwwW",
    "twwwwW",
    "twwwWW",
    "TwwwWW",
    "wwwwWV",
    "Llllll",
  ],
  back: [
    "wwccccWW",
    "wwwwwwWW",
    "wwwwwwWW",
    "wwwwwwWW",
    "wwwwwWWV",
    "WwwwwWWV",
    "llllllll",
  ],
};

const APRON = [
  ".A....A.",
  ".A....A.",
  ".AAAAAA.",
  ".AAAAAB.",
  ".AAAAAB.",
  ".AAAAAB.",
  ".BBBBBB.",
  ".AAAAAB.",
  ".AAAAAB.",
];

// Chân nhìn ngang khi bước (n = chân gần, q = chân xa), từ dòng 18 (đã nhún).
const SIDE_STRIDE = [
  ".....nnnnqq.....",
  "....nnnn.qqq....",
  "...nnn....qqq...",
  "..Ffff....ffff..",
  ".fffff....fff...",
];
const SIDE_STAND = [
  "......pppP......",
  "......pppP......",
  ".....Ffff.......",
  "....fffff.......",
];

const HATS: Record<"cap" | "kepi" | "non-la", string[]> = {
  cap: [
    "................",
    "................",
    "....gggggggg....",
    "...ggjjgggggG...",
    "...gggggggggG...",
    "..KKKKKKKKKKKK..",
  ],
  kepi: [
    "................",
    "....gggggggg....",
    "...gggggggggG...",
    "...ggggyygggG...",
    "...GGGGGGGGGG...",
    "..KKKKKKKKKKKK..",
  ],
  "non-la": [
    ".......jj.......",
    "......jjgg......",
    ".....jjggggG....",
    "....jjgggggG....",
    "...jjggggggGG...",
    ".jjjgggggggGGGG.",
  ],
};

function palette(look: Look): Pal {
  const outfit = look.outfit ?? "uniform";
  const uniform = outfit === "uniform" || outfit === "untucked";
  const top = uniform ? C.shirt : look.top ?? C.shirt;
  const pants = look.pants ?? C.navy;
  return {
    s: C.skin, S: C.skinShade, b: look.girl ? C.blush : C.skin, e: C.eye, m: C.mouth,
    h: look.hair, H: darker(look.hair, 0.35), j: lighter(look.hair, 0.3),
    w: top, W: uniform ? C.shirtShade : darker(top, 0.2), V: uniform ? C.shirtDeep : darker(top, 0.38),
    c: uniform ? C.collar : lighter(top, 0.35),
    t: C.tie, T: C.tieDark, a: C.badge,
    l: C.belt, L: C.buckle,
    p: pants, P: darker(pants, 0.28),
    f: C.shoe, F: C.shoeLight,
    r: C.tie, k: C.pink,
    A: C.apron, B: C.apronShade,
  };
}

function legsFront(s: Img, pal: Pal, bob: number, swing: number): void {
  const hip = 18 + bob;
  s.rect(4, hip, 7, 1, pal.p);
  s.px(11, hip, pal.P);
  const legs = [
    { x0: 4, up: swing < 0 ? 1 : 0, shoe: 4 },
    { x0: 8, up: swing > 0 ? 1 : 0, shoe: 9 },
  ];
  for (const L of legs) {
    const shoeTop = 21 - L.up;
    for (let y = hip + 1; y < shoeTop; y++) {
      s.rect(L.x0, y, 4, 1, pal.p);
      s.px(L.x0 + 3, y, pal.P);
    }
    s.rect(L.shoe, shoeTop, 3, 2, pal.f);
    s.px(L.shoe, shoeTop, pal.F);
    s.px(L.shoe + 1, shoeTop, pal.F);
  }
}

function legsSide(s: Img, pal: Pal, bob: number, swing: number): void {
  const hip = 18 + bob;
  s.rect(5, hip, 6, 1, pal.p);
  s.px(10, hip, pal.P);
  if (swing === 0) stamp(s, SIDE_STAND, 0, hip + 1, pal);
  else stamp(s, SIDE_STRIDE, 0, hip + 1, { ...pal, n: swing > 0 ? pal.p : pal.P, q: swing > 0 ? pal.P : pal.p });
}

/** Người 16×24. frame: 0 = đứng, 1..4 = đi. */
function person(dir: Dir, frame: number, look: Look): Img {
  if (dir === "right") return person("left", frame, look).flipX();
  const s = new Img(16, 24);
  const pal = palette(look);
  const outfit = look.outfit ?? "uniform";
  const view: View = dir === "left" ? "side" : dir === "up" ? "back" : "front";
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const swing = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const top = 11 + bob;

  // chân, giày
  if (view === "side") legsSide(s, pal, bob, swing);
  else legsFront(s, pal, bob, swing);

  // thân áo
  if (view === "side") stamp(s, TORSO.side, 5, top, pal);
  else if (view === "back") stamp(s, TORSO.back, 4, top, pal);
  else stamp(s, TORSO[outfit], 4, top, pal);
  if (look.apron && view === "front") stamp(s, APRON, 4, top, pal);
  if (look.whistle && view === "front") {
    s.px(6, top + 1, pal.c);
    s.px(7, top + 2, pal.L);
    s.px(8, top + 2, C.gray);
  }

  // tay: tay áo ngắn + cẳng tay
  const sleeveL = [pal.w, pal.w, pal.W];
  const sleeveR = [pal.W, pal.W, pal.V];
  const skinCol = [pal.s, pal.s, pal.S];
  if (view === "side") {
    const dx = -swing; // tay gần đánh ngược chân gần
    const ax = 7 + dx;
    for (let i = 1; i < 3; i++) s.px(ax - 1, top + i, pal.V); // nếp tách tay khỏi thân
    for (let i = 0; i < 3; i++) {
      s.px(ax, top + i, sleeveL[i]);
      s.px(ax + 1, top + i, sleeveR[i]);
      s.px(ax, top + 3 + i, skinCol[i]);
      s.px(ax + 1, top + 3 + i, pal.S);
    }
  } else {
    const dyL = view === "back" ? -swing : swing;
    for (let i = 0; i < 3; i++) {
      s.px(3, top + dyL + i, sleeveL[i]);
      s.px(3, top + dyL + 3 + i, skinCol[i]);
      s.px(12, top - dyL + i, sleeveR[i]);
      s.px(12, top - dyL + 3 + i, i === 0 ? pal.s : pal.S);
    }
  }

  // đầu: mặt + tóc + mũ
  stamp(s, FACE[view], 0, 2 + bob, pal);
  if (look.girl && view === "front") {
    s.px(5, 7 + bob, pal.e); // lông mi
    s.px(10, 7 + bob, pal.e);
  }
  const hair = HAIR[look.style][view] ?? HAIR.short[view]!;
  stamp(s, hair, 0, bob, pal);
  if (look.hat) {
    const { kind, color } = look.hat;
    const hp: Pal =
      kind === "non-la"
        ? { g: C.straw, G: C.strawShade, j: C.strawLight, K: C.strawDeep }
        : { g: color, G: darker(color, 0.3), j: lighter(color, 0.3), K: darker(color, 0.45), y: C.yellow };
    if (kind === "non-la") s.rect(0, bob, 16, 5, null);
    stamp(s, HATS[kind], 0, bob, hp);
  }

  s.outline(C.ink, 0.66);
  s.shadow(8, 22.6, 5.6, 1.6);
  return s;
}

/** Ghép cây chổi vào tay phải (đạo cụ cho lao công). Vẽ trước khi viền. */
function withBroom(look: Look): Img {
  const base = person("down", 0, look);
  const o = new Img(16, 24);
  // cán chổi chéo từ tay phải xuống
  for (let i = 0; i < 10; i++) {
    o.px(13 + Math.floor(i / 5), 11 + i, C.woodLight);
  }
  // chùm chổi rơm
  o.rect(12, 20, 3, 3, C.straw);
  o.px(12, 22, C.strawShade);
  o.px(14, 22, C.strawShade);
  o.rect(12, 20, 3, 1, C.woodDark);
  o.outline(C.ink, 0.6);
  o.blit(base, 0, 0);
  return o;
}

// ---------- Xe cộ ----------
function busSprite(): Img {
  const b = new Img(80, 48);
  // hộp máy lạnh trên mái
  b.rect(8, 5, 22, 6, C.busRoof);
  b.rect(8, 5, 22, 1, C.white);
  b.rect(8, 10, 22, 1, C.creamDark);
  for (let x = 11; x < 28; x += 3) b.px(x, 8, C.creamDark);
  // thân xe, bo góc
  b.rect(2, 11, 76, 27, C.bus);
  b.rect(2, 11, 76, 2, C.busLight);
  b.rect(2, 13, 76, 1, mix(C.bus, C.busLight, 0.5));
  b.rect(2, 30, 76, 1, C.white);
  b.rect(2, 31, 76, 1, C.shirtShade);
  b.rect(2, 32, 76, 4, C.busDark);
  b.rect(2, 36, 76, 2, C.busDeep);
  b.rect(77, 13, 1, 17, C.busDark);
  for (const [x, y] of [[2, 11], [3, 11], [2, 12], [77, 11], [76, 11], [77, 12]] as const) b.px(x, y, null);
  // cửa sổ: lái + 4 ô khách
  const win = (x: number, y: number, w: number, h: number) => {
    b.rect(x, y, w, h, C.busWin);
    b.rect(x, y, w, 2, C.busWinLight);
    for (let i = 0; i < Math.min(h - 2, 5); i++) {
      b.px(x + w - 3 - i, y + 2 + i, C.busShine);
      b.px(x + w - 2 - i, y + 2 + i, C.busShine);
    }
    b.rect(x, y + h, w, 1, C.busDark); // gờ dưới kính
  };
  win(4, 20, 12, 9);
  for (let i = 0; i < 4; i++) win(20 + i * 12, 20, 11, 9);
  // biển số tuyến 67
  b.rect(6, 13, 9, 6, C.red);
  b.rect(6, 13, 9, 1, C.redLight);
  drawText(b, "67", 7, 14, C.white);
  // đèn
  b.rect(75, 26, 3, 3, C.yellow);
  b.px(75, 26, "#fff6c2");
  b.rect(2, 26, 2, 3, C.red);
  // vòm + bánh xe
  for (const cx of [17, 62]) {
    b.disc(cx, 38, 7.5, C.busDeep);
    b.disc(cx, 39, 6, C.black);
    b.disc(cx, 39, 3.5, C.grayDark);
    b.disc(cx - 0.5, 38.5, 2.6, C.grayLight);
    b.disc(cx, 39, 1.2, C.grayDark);
  }
  b.outline(C.ink, 0.62);
  b.shadow(40, 45.6, 38, 2.4);
  return b;
}

function cartSprite(w: number, sign: string, body: string, bodyDark: string, signBg: string, signFg: string, text: string): Img {
  const c = new Img(w, 32);
  // biển hiệu có vát
  c.rect(1, 1, w - 2, 9, signBg);
  c.bevel(1, 1, w - 2, 9, lighter(signBg, 0.4), darker(signBg, 0.25));
  drawText(c, text, Math.floor((w - (text.length * 4 - 1)) / 2) + 1, 4, darker(signBg, 0.35));
  drawText(c, text, Math.floor((w - (text.length * 4 - 1)) / 2), 3, signFg);
  // cột chống
  for (const x of [3, w - 4]) {
    c.rect(x, 10, 1, 8, C.grayLight);
    c.px(x, 17, C.grayDark);
  }
  // thùng xe
  c.rect(2, 18, w - 4, 8, body);
  c.rect(2, 18, w - 4, 1, lighter(body, 0.5));
  c.rect(2, 19, w - 4, 1, lighter(body, 0.2));
  c.rect(2, 24, w - 4, 2, bodyDark);
  c.rect(w - 3, 19, 1, 5, bodyDark);
  // khay hàng / kính
  const goods = sign === "kem" ? [C.white, C.pinkLight, C.yellow] : [C.creamLight, C.yellow, C.redLight];
  c.rect(5, 20, 6, 4, goods[0]);
  c.rect(5, 20, 6, 1, "#ffffff");
  c.rect(w - 11, 20, 6, 4, goods[1]);
  c.px(w - 9, 21, goods[2]);
  c.px(w - 7, 22, goods[2]);
  for (const cx of [7, w - 8]) {
    c.disc(cx, 28, 3, C.black);
    c.disc(cx - 0.3, 27.7, 1.6, C.grayLight);
    c.px(cx, 28, C.grayDark);
  }
  c.outline(C.ink, 0.62);
  return c;
}

function bikeSprite(): Img {
  const b = new Img(24, 20);
  for (const cx of [5, 18]) {
    b.disc(cx, 15, 4, C.black);
    b.disc(cx, 15, 2.2, C.grayDark);
    b.disc(cx - 0.4, 14.6, 1.3, C.grayLight);
  }
  // thân xe hồng
  b.rect(6, 9, 12, 4, C.pink);
  b.rect(6, 9, 12, 1, C.pinkLight);
  b.rect(6, 12, 12, 1, C.pinkDark);
  b.rect(3, 11, 4, 2, C.pinkDark); // chắn bùn sau
  b.rect(16, 6, 2, 5, C.grayDark);
  b.px(16, 6, C.grayLight);
  b.rect(15, 5, 4, 1, C.grayDark);
  b.px(19, 9, C.yellow); // đèn
  // người lái mũ bảo hiểm vàng
  b.rect(9, 6, 5, 3, C.pinkDark);
  b.rect(9, 6, 5, 1, C.pink);
  b.rect(10, 5, 3, 1, C.skin);
  b.rect(9, 2, 5, 3, C.yellow);
  b.rect(9, 2, 5, 1, "#fff0a0");
  b.px(13, 4, C.yellowDark);
  b.outline(C.ink, 0.62);
  b.shadow(12, 19.3, 10, 1);
  return b;
}

// ---------- Atlas ----------
const frames: Record<string, { x: number; y: number; w: number; h: number }> = {};
const atlas = new Img(320, 96);
function put(name: string, img: Img, x: number, y: number): void {
  atlas.blit(img, x, y);
  frames[name] = { x, y, w: img.w, h: img.h };
}

const PLAYER: Look = { hair: "#24232f", style: "short" };
(["down", "up", "left", "right"] as Dir[]).forEach((d, di) => {
  for (let f = 0; f < 5; f++) put(`player_${d}_${f}`, person(d, f, PLAYER), (di * 5 + f) * 16, 0);
});
put("student_boy", person("down", 0, { hair: "#3a2a22", style: "short" }), 0, 24);
put("student_girl", person("down", 0, { hair: "#1f1d2a", style: "bob", girl: true }), 16, 24);
// NPC chính (feature he-thong-npc-va-lich): phân biệt bằng kiểu tóc/màu tóc/cách mặc
// (tự tạo, thay bản vẽ tay sau mà không đổi code miễn giữ tên khung).
put("npc_thu", person("down", 0, { hair: "#3a2a22", style: "ponytail", girl: true }), 32, 24); // Trịnh Minh Thư (lớp trưởng)
put("npc_kiet", person("down", 0, { hair: "#2f2418", style: "spiky" }), 48, 24); // Nguyễn Trần Anh Kiệt (bạn thân)
put("npc_huy", person("down", 0, { hair: "#6a4a32", style: "messy", outfit: "untucked" }), 64, 24); // Lê Hoàng Huy (cá biệt)
put("npc_ngan_trinh", person("down", 0, { hair: "#4e3660", style: "bun", girl: true }), 80, 24); // Nguyễn Ngọc Ngân Trinh (văn nghệ)
put("npc_nguyen", person("down", 0, { hair: "#1c1b26", style: "long", girl: true }), 96, 24); // Hồ Thị Phương Nguyên (biến mất)
// NPC người lớn/hàng quán: sprite riêng, khác trang phục/mũ + đạo cụ (FR8.2).
put("npc_bao_ve", person("down", 0, { hair: "#2a2a36", style: "short", outfit: "plain", top: "#7d8a5c", pants: "#55603e", hat: { kind: "kepi", color: "#566339" } }), 112, 24); // bảo vệ/giám thị
put("npc_lao_cong", withBroom({ hair: "#8a8a90", style: "short", outfit: "plain", top: "#5f8a55", pants: "#3d4a3a", hat: { kind: "non-la", color: C.straw } }), 128, 24); // lao công + chổi
put("npc_ban_kem", person("down", 0, { hair: "#3a2a22", style: "bob", girl: true, outfit: "plain", top: C.pink, pants: "#5a4a6a", apron: true, hat: { kind: "non-la", color: C.straw } }), 144, 24); // cô bán kem
put("npc_chao_long", person("down", 0, { hair: "#3a2a22", style: "short", outfit: "plain", top: "#b07a45", pants: "#4a3a2e", apron: true }), 160, 24); // chú cháo lòng
put("npc_tai_xe", person("down", 0, { hair: "#2a2a36", style: "short", outfit: "plain", top: "#3f78c8", pants: "#2a3a5a", hat: { kind: "cap", color: "#264f8f" } }), 176, 24); // bác tài xe buýt
put("npc_chu_nhiem", person("down", 0, { hair: "#2a2a36", style: "bob", girl: true, outfit: "aodai", top: "#2fa59a", pants: "#f2f2f2" }), 192, 24); // cô chủ nhiệm (áo dài)
put("npc_the_duc", person("down", 0, { hair: "#2a2a36", style: "short", outfit: "plain", top: "#d94040", pants: "#2a2f45", whistle: true, hat: { kind: "cap", color: "#a82828" } }), 208, 24); // thầy thể dục
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
for (let gx = 0; gx <= tsBig.w; gx += 16 * K) for (let y = 0; y < tsBig.h; y++) preview.px(gx, y, "#ffffff");
for (let gy = 0; gy <= tsBig.h; gy += 16 * K) for (let x = 0; x < tsBig.w; x++) preview.px(x, gy, "#ffffff");
preview.save("docs/product/asset-preview.png");

console.log(`tileset: ${TILE_DRAWERS.length} tile, sprites: ${Object.keys(frames).length} khung`);
