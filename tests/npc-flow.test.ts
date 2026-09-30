import { describe, expect, it } from "vitest";
import schedulesJson from "../data/schedules.json";
import weatherJson from "../data/weather.json";
import npcsJson from "../data/npcs.json";
import areasJson from "../data/areas.json";
import { validateSchedules, validateWeather, validateNpcs, validateAreas } from "../src/data/loader";
import { npcsInArea } from "../src/core/schedule";
import { weatherOfDay } from "../src/core/weather";
import { rainShown } from "../src/core/outdoor";
import { collisionGrid } from "../src/core/mapgrid";

const schedules = validateSchedules(structuredClone(schedulesJson)).schedules;
const weather = validateWeather(structuredClone(weatherJson)).weather;
const npcs = validateNpcs(structuredClone(npcsJson)).npcs;
const areas = validateAreas(structuredClone(areasJson), { fileExists: () => true }).areas;

describe("luồng NPC (T11)", () => {
  it("AC1: tập NPC ở một khu vực đổi theo khoảng", () => {
    const p0 = npcsInArea(schedules, "hanh-lang-lop-12", 1, 0, "sunny").map((p) => p.npc);
    const p1 = npcsInArea(schedules, "hanh-lang-lop-12", 1, 1, "sunny").map((p) => p.npc);
    // Trong giờ học (p1) có mặt nhiều NPC hơn Trước giờ học (p0), và khác tập.
    expect(p1.length).toBeGreaterThan(p0.length);
    expect(p1).not.toEqual(p0);
  });

  it("AC4: Ngày 5 mưa → hiệu ứng mưa ở khu ngoài trời, không ở hành lang; em lớp 10 xuất hiện", () => {
    const w5 = weatherOfDay(weather, 5);
    expect(w5).toBe("rainy");
    expect(rainShown("cong-truong", w5)).toBe(true); // ngoài trời
    expect(rainShown("hanh-lang-lop-10", w5)).toBe(false); // trong nhà
    const witness = npcsInArea(schedules, "hanh-lang-lop-10", 5, 0, "rainy").map((p) => p.npc);
    expect(witness).toContain("em-lop-10");
  });

  it("AC4: ngày nắng không có mưa và không có nhân chứng ẩn", () => {
    const w1 = weatherOfDay(weather, 1);
    expect(w1).toBe("sunny");
    expect(rainShown("cong-truong", w1)).toBe(false);
    expect(npcsInArea(schedules, "hanh-lang-lop-10", 1, 0, "sunny").map((p) => p.npc)).not.toContain("em-lop-10");
  });

  it("AC9: mọi NPC trong lịch đều là NPC đã khai báo và ở khu vực có thật", () => {
    const npcIds = new Set(npcs.map((n) => n.id));
    const areaIds = new Set(areas.map((a) => a.id));
    for (const e of schedules) {
      expect(npcIds.has(e.npc), `NPC ${e.npc}`).toBe(true);
      expect(areaIds.has(e.area), `khu vực ${e.area}`).toBe(true);
    }
  });

  it("AC3: có ít nhất một NPC nền không tương tác được (để minh chứng nhánh không mở thoại)", () => {
    expect(npcs.some((n) => !n.interactable)).toBe(true);
  });
});

// ---- AC6/AC9: NPC không chặn exit / không làm kẹt (mức ô lưới, xấp xỉ vật cản cứng theo ô) ----
const rawMaps = import.meta.glob("../data/maps/*.tmj", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const tmj = new Map<string, any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
for (const [path, text] of Object.entries(rawMaps)) tmj.set("maps/" + path.split("/").pop(), JSON.parse(text));

function exitCells(map: any): { name: string; cells: [number, number][] }[] { // eslint-disable-line @typescript-eslint/no-explicit-any
  const objs = map.layers.find((l: { name: string }) => l.name === "objects").objects.filter((o: { type: string }) => o.type === "exit");
  return objs.map((o: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const cells: [number, number][] = [];
    for (let x = o.x / 16; x < (o.x + o.width) / 16; x++) for (let y = o.y / 16; y < (o.y + o.height) / 16; y++) cells.push([x, y]);
    return { name: o.name, cells };
  });
}

function reachable(blocked: (x: number, y: number) => boolean, from: [number, number]): Set<string> {
  const seen = new Set<string>([from.join(",")]);
  const q: [number, number][] = [from];
  while (q.length) {
    const [cx, cy] = q.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy, k = nx + "," + ny;
      if (seen.has(k) || blocked(nx, ny)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return seen;
}

describe("AC6/AC9: NPC không chặn exit, không làm kẹt (mọi ngày/khoảng/thời tiết)", () => {
  for (const area of areas) {
    it(`khu vực ${area.id}: từ mọi spawn vẫn tới được mọi exit khi có NPC`, () => {
      const map = tmj.get(area.mapFile);
      const base = collisionGrid(map);
      const exits = exitCells(map);
      expect(exits.length, `${area.id} không có exit`).toBeGreaterThan(0);
      for (let day = 1; day <= 6; day++) {
        for (let period = 0; period <= 3; period++) {
          for (const w of ["sunny", "rainy"] as const) {
            const npcCells = new Set(npcsInArea(schedules, area.id, day, period, w).map((p) => p.x + "," + p.y));
            const blocked = (x: number, y: number) => base(x, y) || npcCells.has(x + "," + y);
            const ctx = `${area.id} ngày ${day} khoảng ${period} ${w}`;
            for (const e of exits) for (const [x, y] of e.cells) expect(npcCells.has(x + "," + y), `NPC đè exit ${e.name} — ${ctx}`).toBe(false);
            for (const [sname, sp] of Object.entries(area.spawns)) {
              expect(npcCells.has(sp.x + "," + sp.y), `NPC đè spawn ${sname} — ${ctx}`).toBe(false);
              const seen = reachable(blocked, [sp.x, sp.y]);
              for (const e of exits) {
                expect(e.cells.some(([x, y]) => seen.has(x + "," + y)), `spawn ${sname} không tới được exit ${e.name} — ${ctx}`).toBe(true);
              }
            }
          }
        }
      }
    });
  }
});

describe("biên hàm tra cứu", () => {
  it("npcsInArea trả rỗng với khu vực không có lịch / ngày ngoài 1..6", () => {
    expect(npcsInArea(schedules, "khu-khong-co", 1, 0, "sunny")).toEqual([]);
    expect(npcsInArea(schedules, "cong-truong", 99, 0, "sunny")).toEqual([]);
  });

  it("weatherOfDay: ngày 0/âm mặc định nắng, chỉ Ngày 5 mưa trong 1..6", () => {
    expect(weatherOfDay(weather, 0)).toBe("sunny");
    expect(weatherOfDay(weather, -1)).toBe("sunny");
    expect([1, 2, 3, 4, 5, 6].filter((d) => weatherOfDay(weather, d) === "rainy")).toEqual([5]);
  });

  it("rainShown: chỉ mưa + ngoài trời; ngày nắng luôn false ở mọi khu vực", () => {
    for (const a of areas) expect(rainShown(a.id, "sunny")).toBe(false);
    expect(areas.filter((a) => rainShown(a.id, "rainy")).map((a) => a.id).sort()).toEqual(["cong-truong", "san-chinh", "san-the-chat"]);
  });
});
