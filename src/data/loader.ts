// Nạp và kiểm tra dữ liệu khu vực. Lỗi nêu rõ chỗ sai (đường dẫn trường + lý do).
import { AreasFileSchema, type AreasFile } from "./schema";

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
