import { describe, expect, it } from "vitest";
import schedulesJson from "../data/schedules.json";
import npcsJson from "../data/npcs.json";
import areasJson from "../data/areas.json";
import { validateSchedules, validateNpcs, validateAreas } from "../src/data/loader";
import { npcsInArea, npcPosition } from "../src/core/schedule";
import { collisionGrid } from "../src/core/mapgrid";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const real = (): any => structuredClone(schedulesJson);

const npcs = validateNpcs(structuredClone(npcsJson));
const areas = validateAreas(structuredClone(areasJson), { fileExists: () => true });
const npcIds = new Set(npcs.npcs.map((n) => n.id));
const areaIds = new Set(areas.areas.map((a) => a.id));

// bản đồ thật (nạp .tmj qua vite glob như src/data/content.ts).
const rawMaps = import.meta.glob("../data/maps/*.tmj", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parsedMaps = new Map<string, any>();
const grids = new Map<string, (x: number, y: number) => boolean>();
for (const [path, text] of Object.entries(rawMaps)) {
  const key = "maps/" + path.split("/").pop();
  const map = JSON.parse(text);
  parsedMaps.set(key, map);
  grids.set(key, collisionGrid(map));
}
const mapFileFor = (areaId: string): string | undefined => areas.areas.find((ar) => ar.id === areaId)?.mapFile;
const cellBlocked = (area: string, x: number, y: number): boolean => {
  const f = mapFileFor(area);
  const g = f ? grids.get(f) : undefined;
  return g ? g(x, y) : true;
};
const onExit = (area: string, x: number, y: number): boolean => {
  const f = mapFileFor(area);
  const map = f && parsedMaps.get(f);
  const objs = map?.layers?.find((l: { name: string }) => l.name === "objects")?.objects ?? [];
  for (const o of objs) {
    if (o.type !== "exit") continue;
    if (x >= o.x / 16 && x < (o.x + o.width) / 16 && y >= o.y / 16 && y < (o.y + o.height) / 16) return true;
  }
  return false;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function firstExitCell(areaId: string): [number, number] {
  const map = parsedMaps.get(mapFileFor(areaId)!);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = map.layers.find((l: { name: string }) => l.name === "objects").objects.find((x: any) => x.type === "exit");
  return [o.x / 16, o.y / 16];
}

const opts = {
  maxDay: 6,
  npcExists: (id: string) => npcIds.has(id),
  areaExists: (id: string) => areaIds.has(id),
  cellBlocked,
  onExit,
};

describe("schedules.json — tra cứu (T4)", () => {
  it("dữ liệu thật hợp lệ", () => {
    expect(() => validateSchedules(real(), opts)).not.toThrow();
  });

  it("Thư ở hành lang lớp 12 vào Trong giờ học (day1, period1)", () => {
    const list = npcsInArea(real().schedules, "hanh-lang-lop-12", 1, 1, "sunny");
    expect(list.map((p) => p.npc)).toContain("thu");
  });

  it("Nguyên chỉ thoáng đầu tuần (day1 period0), vắng ngày sau", () => {
    expect(npcPosition(real().schedules, "nguyen", 1, 0, "sunny")).not.toBeNull();
    expect(npcPosition(real().schedules, "nguyen", 2, 0, "sunny")).toBeNull();
  });

  it("em lớp 10 chỉ hiện khi trời mưa (Ngày 5)", () => {
    const rainy = npcsInArea(real().schedules, "hanh-lang-lop-10", 5, 0, "rainy");
    const sunny = npcsInArea(real().schedules, "hanh-lang-lop-10", 5, 0, "sunny");
    expect(rainy.map((p) => p.npc)).toContain("em-lop-10");
    expect(sunny.map((p) => p.npc)).not.toContain("em-lop-10");
  });
});

describe("schedules.json — kiểm tra hợp lệ (T5)", () => {
  it("npcId không tồn tại bị bắt", () => {
    const d = real();
    d.schedules[0].npc = "khong-co";
    expect(() => validateSchedules(d, opts)).toThrow(/không tồn tại/);
  });

  it("area không tồn tại bị bắt", () => {
    const d = real();
    d.schedules[0].area = "khong-co";
    expect(() => validateSchedules(d, opts)).toThrow(/khu vực 'khong-co'/);
  });

  it("đặt NPC vào ô bị cản bị bắt", () => {
    const d = real();
    // ô (0,0) ở cong-truong là góc tường — bị cản.
    d.schedules[0] = { npc: "thu", day: 1, period: 0, area: "cong-truong", x: 0, y: 0, facing: "down" };
    expect(() => validateSchedules(d, opts)).toThrow(/bị cản/);
  });

  it("trùng mục lịch (cùng npc/day/period/weather) bị bắt", () => {
    const d = real();
    d.schedules.push({ ...d.schedules[0] });
    expect(() => validateSchedules(d, opts)).toThrow(/trùng mục lịch/);
  });

  it("đặt NPC lên ô lối exit bị bắt (FR4.3/BR3)", () => {
    const d = real();
    const [ex, ey] = firstExitCell("cong-truong");
    d.schedules[0] = { npc: "thu", day: 1, period: 0, area: "cong-truong", x: ex, y: ey, facing: "down" };
    expect(() => validateSchedules(d, opts)).toThrow(/lối exit/);
  });

  it("mục 'mọi thời tiết' trùng mục theo thời tiết cùng (npc,day,period) bị bắt (M2)", () => {
    const d = real();
    d.schedules.push({ npc: "em-lop-10", day: 5, period: 0, area: "hanh-lang-lop-10", x: 11, y: 5, facing: "down" });
    expect(() => validateSchedules(d, opts)).toThrow(/mọi thời tiết/);
  });
});
