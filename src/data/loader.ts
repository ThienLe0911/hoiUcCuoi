// Nạp và kiểm tra dữ liệu khu vực. Lỗi nêu rõ chỗ sai (đường dẫn trường + lý do).
import {
  AreasFileSchema,
  type AreasFile,
  NpcsFileSchema,
  type NpcsFile,
  WeatherFileSchema,
  type WeatherFile,
  SchedulesFileSchema,
  type SchedulesFile,
} from "./schema";

export interface ValidateOptions {
  /** Tên tệp dùng trong thông báo lỗi. */
  source?: string;
  /** Nếu có: kiểm tra mapFile tồn tại (inject để test không phụ thuộc hệ tệp). */
  fileExists?: (mapFile: string) => boolean;
}

export function validateAreas(raw: unknown, opts: ValidateOptions = {}): AreasFile {
  const source = opts.source ?? "data/areas.json";
  const parsed = AreasFileSchema.safeParse(raw);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${source}: ${i.path.join(".") || "(gốc)"}: ${i.message}`);
    throw new Error(`Dữ liệu khu vực không hợp lệ:\n${lines.join("\n")}`);
  }
  const data = parsed.data;
  const errors: string[] = [];
  const byId = new Map<string, (typeof data.areas)[number]>();

  data.areas.forEach((area, i) => {
    if (byId.has(area.id)) errors.push(`${source}: areas.${i}.id: id trùng lặp '${area.id}'`);
    byId.set(area.id, area);
  });

  data.areas.forEach((area, i) => {
    area.exits.forEach((exit, j) => {
      const at = `${source}: areas.${i}.exits.${j}`;
      const target = byId.get(exit.toArea);
      if (!target) {
        errors.push(`${at}.toArea: khu vực '${exit.toArea}' không tồn tại`);
      } else if (!(exit.toSpawn in target.spawns)) {
        errors.push(`${at}.toSpawn: spawn '${exit.toSpawn}' không tồn tại trong khu vực '${exit.toArea}'`);
      }
    });
    if (opts.fileExists && !opts.fileExists(area.mapFile)) {
      errors.push(`${source}: areas.${i}.mapFile: file '${area.mapFile}' không tồn tại`);
    }
  });

  if (errors.length > 0) throw new Error(`Dữ liệu khu vực không hợp lệ:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  return data;
}

/** Nạp trong trình duyệt. */
export async function loadAreas(url: string): Promise<AreasFile> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Không tải được ${url} (HTTP ${res.status})`);
  return validateAreas(await res.json(), { source: url });
}

// ---- NPC / lịch / thời tiết (feature he-thong-npc-va-lich) ----

function fail(source: string, errors: string[]): never {
  throw new Error(`Dữ liệu không hợp lệ (${source}):\n${errors.map((e) => `  - ${e}`).join("\n")}`);
}

export function validateNpcs(raw: unknown, opts: { source?: string } = {}): NpcsFile {
  const source = opts.source ?? "data/npcs.json";
  const parsed = NpcsFileSchema.safeParse(raw);
  if (!parsed.success) fail(source, parsed.error.issues.map((i) => `${source}: ${i.path.join(".") || "(gốc)"}: ${i.message}`));
  const data = parsed.data;
  const errors: string[] = [];
  const seen = new Set<string>();
  data.npcs.forEach((npc, i) => {
    if (seen.has(npc.id)) errors.push(`${source}: npcs.${i}.id: id trùng lặp '${npc.id}'`);
    seen.add(npc.id);
    if (npc.interactable && npc.line.trim() === "") {
      errors.push(`${source}: npcs.${i}.line: NPC tương tác được phải có câu thoại`);
    }
  });
  if (errors.length) fail(source, errors);
  return data;
}

export function validateWeather(raw: unknown, opts: { source?: string; maxDay?: number } = {}): WeatherFile {
  const source = opts.source ?? "data/weather.json";
  const parsed = WeatherFileSchema.safeParse(raw);
  if (!parsed.success) fail(source, parsed.error.issues.map((i) => `${source}: ${i.path.join(".") || "(gốc)"}: ${i.message}`));
  const data = parsed.data;
  if (opts.maxDay != null) {
    const errors: string[] = [];
    for (const key of Object.keys(data.weather)) {
      const d = Number(key);
      if (d < 1 || d > opts.maxDay) errors.push(`${source}: weather.${key}: ngày ngoài khoảng 1..${opts.maxDay}`);
    }
    if (errors.length) fail(source, errors);
  }
  return data;
}

export interface ScheduleValidateOptions {
  source?: string;
  maxDay?: number;
  /** Nếu có: kiểm tra npc tồn tại (id NPC hợp lệ). */
  npcExists?: (npcId: string) => boolean;
  /** Nếu có: kiểm tra area tồn tại. */
  areaExists?: (areaId: string) => boolean;
  /** Nếu có: ô (area,x,y) có bị cản không (dùng cho T5). */
  cellBlocked?: (areaId: string, x: number, y: number) => boolean;
}

export function validateSchedules(raw: unknown, opts: ScheduleValidateOptions = {}): SchedulesFile {
  const source = opts.source ?? "data/schedules.json";
  const parsed = SchedulesFileSchema.safeParse(raw);
  if (!parsed.success) fail(source, parsed.error.issues.map((i) => `${source}: ${i.path.join(".") || "(gốc)"}: ${i.message}`));
  const data = parsed.data;
  const errors: string[] = [];
  const key = (e: { npc: string; day: number; period: number; weather?: string }) => `${e.npc}|${e.day}|${e.period}|${e.weather ?? "*"}`;
  const seen = new Set<string>();
  data.schedules.forEach((e, i) => {
    const at = `${source}: schedules.${i}`;
    const k = key(e);
    if (seen.has(k)) errors.push(`${at}: trùng mục lịch (npc=${e.npc}, day=${e.day}, period=${e.period}, weather=${e.weather ?? "*"})`);
    seen.add(k);
    if (opts.maxDay != null && e.day > opts.maxDay) errors.push(`${at}.day: ngày ${e.day} vượt quá ${opts.maxDay}`);
    if (opts.npcExists && !opts.npcExists(e.npc)) errors.push(`${at}.npc: NPC '${e.npc}' không tồn tại trong data/npcs.json`);
    if (opts.areaExists && !opts.areaExists(e.area)) errors.push(`${at}.area: khu vực '${e.area}' không tồn tại`);
    if (opts.cellBlocked && opts.cellBlocked(e.area, e.x, e.y)) errors.push(`${at}: ô (${e.x},${e.y}) trong '${e.area}' bị cản, không đặt NPC được`);
  });
  if (errors.length) fail(source, errors);
  return data;
}
