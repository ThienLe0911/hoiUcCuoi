// Tra cứu lịch NPC (logic thuần, không phụ thuộc Phaser).
// Một NPC "vắng" ở (day, period) nếu không có mục lịch khớp (kể cả điều kiện thời tiết).
import type { ScheduleEntry, WeatherKind } from "../data/schema";

export interface NpcPlacement {
  npc: string;
  area: string;
  x: number;
  y: number;
  facing: ScheduleEntry["facing"];
}

function matches(e: ScheduleEntry, day: number, period: number, weather: WeatherKind): boolean {
  return e.day === day && e.period === period && (e.weather == null || e.weather === weather);
}

function toPlacement(e: ScheduleEntry): NpcPlacement {
  return { npc: e.npc, area: e.area, x: e.x, y: e.y, facing: e.facing };
}

/** Tập NPC nên có mặt ở một khu vực vào (day, period, weather). */
export function npcsInArea(schedules: ScheduleEntry[], area: string, day: number, period: number, weather: WeatherKind): NpcPlacement[] {
  return schedules.filter((e) => e.area === area && matches(e, day, period, weather)).map(toPlacement);
}

/** Vị trí của một NPC vào (day, period, weather), hoặc null nếu vắng. */
export function npcPosition(schedules: ScheduleEntry[], npc: string, day: number, period: number, weather: WeatherKind): NpcPlacement | null {
  const e = schedules.find((s) => s.npc === npc && matches(s, day, period, weather));
  return e ? toPlacement(e) : null;
}
