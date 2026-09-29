// Thư viện dựng bản đồ Tiled (.tmj) bằng code. Dùng cho tools/gen-maps.ts.
// Bản đồ sinh ra mở được trong Tiled; sau khi bạn chỉnh tay trong Tiled thì đừng chạy lại
// script cho bản đồ đó (script sẽ ghi đè).
import { readFileSync } from "node:fs";

const tileset = JSON.parse(readFileSync("public/assets/tileset.json", "utf8")) as {
  columns: number;
  tiles: Record<string, number>;
};
const sprites = JSON.parse(readFileSync("public/assets/sprites.json", "utf8")) as {
  frames: Record<string, { w: number; h: number }>;
};

export const TILE = 16;
const TILE_COUNT = tileset.columns * Math.ceil(Object.keys(tileset.tiles).length / tileset.columns);
/** Gắn cờ ô cản trong lớp collision (giá trị khác 0 là cản). */
const SOLID_GID = 1;

type Prop = { name: string; type: "string" | "int" | "bool"; value: string | number | boolean };
interface TmjObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0;
  visible: true;
  properties?: Prop[];
}

export type LayerName = "ground" | "walls" | "overlay";

export class MapBuilder {
  readonly w: number;
  readonly h: number;
  private layers: Record<LayerName | "collision", number[]>;
  private objects: TmjObject[] = [];
  private nextId = 1;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    const blank = () => new Array<number>(w * h).fill(0);
    this.layers = { ground: blank(), walls: blank(), collision: blank(), overlay: blank() };
  }

  private gid(id: string): number {
    const idx = tileset.tiles[id];
    if (idx === undefined) throw new Error(`Tile không tồn tại trong tileset.json: '${id}'`);
    return idx + 1;
  }

  set(layer: LayerName, x: number, y: number, id: string): this {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) throw new Error(`Ô (${x},${y}) ngoài bản đồ ${this.w}×${this.h}`);
    this.layers[layer][y * this.w + x] = this.gid(id);
    return this;
  }

  fill(layer: LayerName, x: number, y: number, w: number, h: number, id: string): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(layer, x + i, y + j, id);
    return this;
  }

  solid(x: number, y: number, w = 1, h = 1): this {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        if (x + i < 0 || y + j < 0 || x + i >= this.w || y + j >= this.h) throw new Error(`Ô cản (${x + i},${y + j}) ngoài bản đồ`);
        this.layers.collision[(y + j) * this.w + (x + i)] = SOLID_GID;
      }
    return this;
  }

  open(x: number, y: number, w = 1, h = 1): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.layers.collision[(y + j) * this.w + (x + i)] = 0;
    return this;
  }

  /** Sprite trang trí đặt theo pixel (góc trái-trên). */
  sprite(frame: string, px: number, py: number): this {
    if (!sprites.frames[frame]) throw new Error(`Sprite không tồn tại trong sprites.json: '${frame}'`);
    const f = sprites.frames[frame];
    this.addObject("", "sprite", px, py, f.w, f.h, [{ name: "frame", type: "string", value: frame }]);
    return this;
  }

  /** Vùng chuyển khu vực, tọa độ theo ô. name = id exit trong areas.json. */
  exit(id: string, tx: number, ty: number, tw = 1, th = 1): this {
    this.addObject(id, "exit", tx * TILE, ty * TILE, tw * TILE, th * TILE);
    return this;
  }

  /** Vùng tương tác, tọa độ theo ô. */
  interact(o: { name: string; tx: number; ty: number; tw: number; th: number; kind: "text" | "activity"; text: string; label?: string; cost?: number }): this {
    const props: Prop[] = [
      { name: "kind", type: "string", value: o.kind },
      { name: "text", type: "string", value: o.text },
    ];
    if (o.label) props.push({ name: "label", type: "string", value: o.label });
    if (o.kind === "activity") props.push({ name: "cost", type: "int", value: o.cost ?? 1 });
    this.addObject(o.name, "interact", o.tx * TILE, o.ty * TILE, o.tw * TILE, o.th * TILE, props);
    return this;
  }

  private addObject(name: string, type: string, x: number, y: number, width: number, height: number, properties?: Prop[]): void {
    const obj: TmjObject = { id: this.nextId++, name, type, x, y, width, height, rotation: 0, visible: true };
    if (properties) obj.properties = properties;
    this.objects.push(obj);
  }

  toTmj(): string {
    let layerId = 1;
    const tileLayer = (name: string, data: number[], visible = true) => ({
      id: layerId++,
      name,
      type: "tilelayer",
      x: 0,
      y: 0,
      width: this.w,
      height: this.h,
      opacity: 1,
      visible,
      data,
    });
    const map = {
      compressionlevel: -1,
      type: "map",
      version: "1.10",
      tiledversion: "1.10.2",
      orientation: "orthogonal",
      renderorder: "right-down",
      infinite: false,
      width: this.w,
      height: this.h,
      tilewidth: TILE,
      tileheight: TILE,
      nextlayerid: 6,
      nextobjectid: this.nextId,
      layers: [
        tileLayer("ground", this.layers.ground),
        tileLayer("walls", this.layers.walls),
        tileLayer("collision", this.layers.collision, false),
        tileLayer("overlay", this.layers.overlay),
        {
          id: layerId++,
          name: "objects",
          type: "objectgroup",
          x: 0,
          y: 0,
          opacity: 1,
          visible: true,
          draworder: "topdown",
          objects: this.objects,
        },
      ],
      tilesets: [
        {
          firstgid: 1,
          name: "tileset",
          image: "../../public/assets/tileset.png",
          imagewidth: tileset.columns * TILE,
          imageheight: (TILE_COUNT / tileset.columns) * TILE,
          columns: tileset.columns,
          tilecount: TILE_COUNT,
          tilewidth: TILE,
          tileheight: TILE,
          margin: 0,
          spacing: 0,
        },
      ],
    };
    return JSON.stringify(map, null, 1) + "\n";
  }
}
