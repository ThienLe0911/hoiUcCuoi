// Nạp nội dung game (khu vực + bản đồ) từ thư mục data/ và kiểm tra khi khởi động (ADR 002).
import areasJson from "../../data/areas.json";
import { validateAreas } from "./loader";
import type { AreaDef } from "./schema";

const rawMaps = import.meta.glob("../../data/maps/*.tmj", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export interface Content {
  areas: Map<string, AreaDef>;
  /** Khóa theo `mapFile` trong areas.json (ví dụ "maps/cong-truong.tmj"). */
  maps: Map<string, unknown>;
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
  return { areas: new Map(data.areas.map((a) => [a.id, a])), maps };
}
