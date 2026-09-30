// Khu vực ngoài trời — nơi hiệu ứng mưa được phủ (T9). Logic thuần, dùng chung
// giữa AreaScene và kiểm thử để một nguồn sự thật.
export const OUTDOOR_AREAS = new Set(["cong-truong", "san-chinh", "san-the-chat"]);

/** Có phủ mưa ở khu vực này với thời tiết cho trước không. */
export function rainShown(areaId: string, weather: "sunny" | "rainy"): boolean {
  return weather === "rainy" && OUTDOOR_AREAS.has(areaId);
}
