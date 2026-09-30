import type { WeatherFile, WeatherKind } from "../data/schema";

/** Thời tiết của một ngày học. Thiếu khóa trong bảng → mặc định "sunny" (FR3). Logic thuần, không phụ thuộc Phaser/DOM. */
export function weatherOfDay(table: WeatherFile["weather"], day: number): WeatherKind {
  return table[String(day)] ?? "sunny";
}
