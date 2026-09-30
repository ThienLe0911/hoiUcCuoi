import { describe, expect, it } from "vitest";
import schedulesJson from "../data/schedules.json";
import weatherJson from "../data/weather.json";
import npcsJson from "../data/npcs.json";
import areasJson from "../data/areas.json";
import { validateSchedules, validateWeather, validateNpcs, validateAreas } from "../src/data/loader";
import { npcsInArea } from "../src/core/schedule";
import { weatherOfDay } from "../src/core/weather";
import { rainShown } from "../src/core/outdoor";

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
});
