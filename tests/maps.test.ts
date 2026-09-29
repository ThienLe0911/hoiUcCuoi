import { describe, expect, it } from "vitest";
import areasJson from "../data/areas.json";
import sprites from "../public/assets/sprites.json";
import { validateAreas } from "../src/data/loader";

const raw = import.meta.glob("../data/maps/*.tmj", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const maps = new Map<string, any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
for (const [path, text] of Object.entries(raw)) maps.set(path.replace("../data/", ""), JSON.parse(text));

const areas = validateAreas(structuredClone(areasJson), { fileExists: () => true }).areas;
const existing = areas.filter((a) => maps.has(a.mapFile));

describe("bản đồ .tmj", () => {
  it("có đủ bản đồ cho mọi khu vực trong areas.json", () => {
    expect(existing.map((a) => a.id)).toEqual(areas.map((a) => a.id));
  });

  for (const area of existing) {
    describe(area.id, () => {
      const map = maps.get(area.mapFile);
      const layer = (n: string) => map.layers.find((l: { name: string }) => l.name === n);

      it("tile 16×16, đủ các lớp bắt buộc, dữ liệu đúng kích thước", () => {
        expect(map.tilewidth).toBe(16);
        expect(map.tileheight).toBe(16);
        for (const n of ["ground", "walls", "collision", "overlay"]) {
          expect(layer(n), `thiếu lớp ${n}`).toBeTruthy();
          expect(layer(n).data.length).toBe(map.width * map.height);
        }
        expect(layer("objects")?.type).toBe("objectgroup");
      });

      it("mọi gid nằm trong tileset", () => {
        const count = map.tilesets[0].tilecount;
        for (const n of ["ground", "walls", "overlay"]) {
          for (const gid of layer(n).data as number[]) expect(gid).toBeLessThanOrEqual(count);
        }
      });

      it("exit khớp đúng với areas.json và nằm trên ô không cản", () => {
        const exits = layer("objects").objects.filter((o: { type: string }) => o.type === "exit");
        expect(exits.map((o: { name: string }) => o.name).sort()).toEqual(area.exits.map((e) => e.id).sort());
        for (const o of exits) {
          for (let x = o.x / 16; x < (o.x + o.width) / 16; x++)
            for (let y = o.y / 16; y < (o.y + o.height) / 16; y++)
              expect(layer("collision").data[y * map.width + x], `exit ${o.name} bị cản tại (${x},${y})`).toBe(0);
        }
      });

      it("spawn trong bản đồ và không nằm trên ô cản", () => {
        for (const [name, s] of Object.entries(area.spawns)) {
          expect(s.x).toBeLessThan(map.width);
          expect(s.y).toBeLessThan(map.height);
          expect(layer("collision").data[s.y * map.width + s.x], `spawn ${name} bị cản`).toBe(0);
        }
      });

      it("interact có kind, text (và cost nguyên ≥ 0 nếu là activity); sprite dùng khung có thật", () => {
        for (const o of layer("objects").objects) {
          const props = Object.fromEntries((o.properties ?? []).map((p: { name: string; value: unknown }) => [p.name, p.value]));
          if (o.type === "interact") {
            expect(["text", "activity"]).toContain(props.kind);
            expect(typeof props.text).toBe("string");
            if (props.kind === "activity") {
              expect(Number.isInteger(props.cost)).toBe(true);
              expect(props.cost).toBeGreaterThanOrEqual(0);
              expect(typeof props.label).toBe("string");
            }
          }
          if (o.type === "sprite") expect(Object.keys(sprites.frames)).toContain(props.frame);
        }
      });
    });
  }
});
