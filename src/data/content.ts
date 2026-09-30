// Nạp nội dung game (khu vực + bản đồ + NPC/lịch/thời tiết) từ thư mục data/ và
// kiểm tra khi khởi động (ADR 002, ADR 004).
import areasJson from "../../data/areas.json";
import npcsJson from "../../data/npcs.json";
import weatherJson from "../../data/weather.json";
import schedulesJson from "../../data/schedules.json";
import { validateAreas, validateNpcs, validateWeather, validateSchedules } from "./loader";
import type { AreaDef, NpcDef, ScheduleEntry, WeatherFile } from "./schema";
import { collisionGrid } from "../core/mapgrid";
import { PERIODS_PER_DAY } from "../core/time";
import { TOTAL_DAYS } from "../config";

const rawMaps = import.meta.glob("../../data/maps/*.tmj", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export interface Content {
  areas: Map<string, AreaDef>;
  /** Khóa theo `mapFile` trong areas.json (ví dụ "maps/cong-truong.tmj"). */
  maps: Map<string, unknown>;
  npcs: Map<string, NpcDef>;
  weather: WeatherFile["weather"];
  schedules: ScheduleEntry[];
}

/** Ném lỗi tiếng Việt chỉ rõ chỗ sai nếu dữ liệu không hợp lệ. */
export function loadContent(): Content {
  const maps = new Map<string, unknown>();
  for (const [path, text] of Object.entries(rawMaps)) {
    const key = "maps/" + path.split("/").pop();
    try {
      maps.set(key, JSON.parse(text));
    } catch {
      throw new Error(`Bản đồ ${key} không phải JSON hợp lệ`);
    }
  }
  const data = validateAreas(areasJson, { fileExists: (f) => maps.has(f) });
  const areas = new Map(data.areas.map((a) => [a.id, a]));

  const npcsData = validateNpcs(npcsJson);
  const npcs = new Map(npcsData.npcs.map((n) => [n.id, n]));
  const weatherData = validateWeather(weatherJson, { maxDay: TOTAL_DAYS });

  // cellBlocked dựng từ lớp collision của bản đồ mỗi khu vực (để kiểm tra vị trí lịch).
  const gridCache = new Map<string, (x: number, y: number) => boolean>();
  const cellBlocked = (areaId: string, x: number, y: number): boolean => {
    let grid = gridCache.get(areaId);
    if (!grid) {
      const area = areas.get(areaId);
      const map = area && maps.get(area.mapFile);
      grid = map ? collisionGrid(map) : () => true;
      gridCache.set(areaId, grid);
    }
    return grid(x, y);
  };

  // onExit: ô có nằm trên vùng lối exit của khu vực không (NPC không được đè, FR4.3/BR3).
  const onExit = (areaId: string, x: number, y: number): boolean => {
    const area = areas.get(areaId);
    const map = area && (maps.get(area.mapFile) as { layers?: { name: string; objects?: { type: string; x: number; y: number; width: number; height: number }[] }[] });
    const objs = map?.layers?.find((l) => l.name === "objects")?.objects ?? [];
    for (const o of objs) {
      if (o.type !== "exit") continue;
      if (x >= o.x / 16 && x < (o.x + o.width) / 16 && y >= o.y / 16 && y < (o.y + o.height) / 16) return true;
    }
    return false;
  };

  const schedulesData = validateSchedules(schedulesJson, {
    maxDay: TOTAL_DAYS,
    npcExists: (id) => npcs.has(id),
    areaExists: (id) => areas.has(id),
    cellBlocked,
    onExit,
  });

  // period trong lịch phải nằm trong 0..PERIODS_PER_DAY-1 (an toàn kép cùng schema).
  const badPeriod = schedulesData.schedules.find((e) => e.period >= PERIODS_PER_DAY);
  if (badPeriod) throw new Error(`Lịch NPC: period ${badPeriod.period} vượt số khoảng/ngày (${PERIODS_PER_DAY})`);

  return { areas, maps, npcs, weather: weatherData.weather, schedules: schedulesData.schedules };
}
