// Schema zod cho data/areas.json (ADR 002).
import { z } from "zod";

const kebab = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "phải là kebab-case (chữ thường, số, dấu gạch ngang)");

export const SpawnSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});

export const ExitSchema = z.object({
  id: kebab,
  toArea: kebab,
  toSpawn: z.string().min(1),
});

export const AreaSchema = z.object({
  id: kebab,
  name: z.string().min(1),
  mapFile: z.string().regex(/\.tmj$/, "phải là đường dẫn tới file .tmj"),
  locked: z.boolean(),
  spawns: z.record(z.string(), SpawnSchema).refine((s) => "default" in s, "phải có spawn 'default'"),
  exits: z.array(ExitSchema),
});

export const AreasFileSchema = z.object({
  areas: z.array(AreaSchema).min(1),
});

export type Spawn = z.infer<typeof SpawnSchema>;
export type AreaExit = z.infer<typeof ExitSchema>;
export type AreaDef = z.infer<typeof AreaSchema>;
export type AreasFile = z.infer<typeof AreasFileSchema>;

// ---- NPC / lịch / thời tiết (feature he-thong-npc-va-lich, ADR 004) ----
// Quy ước: id NPC dùng kebab-case (như area/exit); giá trị enum tiếng Anh khớp code
// (hướng down/up/left/right theo tên khung sprite; thời tiết sunny/rainy).

export const FacingSchema = z.enum(["up", "down", "left", "right"]);
export const WeatherKindSchema = z.enum(["sunny", "rainy"]);

export const NpcSchema = z.object({
  id: kebab,
  name: z.string().min(1),
  kind: z.enum(["main", "extra"]),
  frame: z.string().min(1),
  interactable: z.boolean(),
  /** Câu thoại trung tính tối thiểu (Phụ lục A). Bắt buộc không rỗng nếu interactable — kiểm ở loader. */
  line: z.string().default(""),
});
export const NpcsFileSchema = z.object({ npcs: z.array(NpcSchema).min(1) });

export const WeatherFileSchema = z.object({
  /** Khóa = số ngày ("1".."6"), giá trị = sunny|rainy. */
  weather: z.record(z.string().regex(/^[1-9][0-9]*$/, "khóa phải là số ngày ≥ 1"), WeatherKindSchema),
});

export const ScheduleEntrySchema = z.object({
  npc: kebab,
  day: z.number().int().min(1),
  period: z.number().int().min(0).max(3),
  area: kebab,
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  facing: FacingSchema,
  /** Nếu có: mục lịch chỉ áp dụng khi thời tiết khớp (vd em lớp 10 "trú mưa" = rainy). */
  weather: WeatherKindSchema.optional(),
});
export const SchedulesFileSchema = z.object({ schedules: z.array(ScheduleEntrySchema) });

export type Facing = z.infer<typeof FacingSchema>;
export type WeatherKind = z.infer<typeof WeatherKindSchema>;
export type NpcDef = z.infer<typeof NpcSchema>;
export type NpcsFile = z.infer<typeof NpcsFileSchema>;
export type WeatherFile = z.infer<typeof WeatherFileSchema>;
export type ScheduleEntry = z.infer<typeof ScheduleEntrySchema>;
export type SchedulesFile = z.infer<typeof SchedulesFileSchema>;
