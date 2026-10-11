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
  /** Id cây thoại (data/dialogues). Có thì tương tác mở cây thoại thay vì `line` (he-thong-hoi-thoai FR6). */
  dialogue: kebab.optional(),
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

// ---- Hội thoại nhánh (feature he-thong-hoi-thoai, ADR 004) ----
// Mỗi file data/dialogues/<id>.json là MỘT cây thoại. Khóa tiếng Anh như các schema khác.
// Các liên kết (goto/next/fallbackGoto → node, speaker → NPC) được kiểm ở loader.

/** Node đích đặc biệt: kết thúc hội thoại. Không được dùng làm id node. */
export const DIALOGUE_END = "end";
/** Số lựa chọn tối đa mỗi node (hợp màn 320×180). */
export const MAX_DIALOGUE_CHOICES = 4;

/** Tên flag, ví dụ "ngay3.nhan-thay": các đoạn chữ thường/số nối bằng "." hoặc "-". */
const flagName = z.string().regex(/^[a-z0-9]+([.-][a-z0-9]+)*$/, "tên flag chỉ gồm chữ thường, số, nối bằng '.' hoặc '-'");

/** Điều kiện hiển thị theo flag. `relationship` được chừa chỗ cho feature quan hệ: chấp nhận nhưng chưa đánh giá. */
export type Condition =
  | { flag: string }
  | { allOf: Condition[] }
  | { anyOf: Condition[] }
  | { not: Condition }
  | { relationship: Record<string, unknown> };

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.strictObject({ flag: flagName }),
    z.strictObject({ allOf: z.array(ConditionSchema).min(1) }),
    z.strictObject({ anyOf: z.array(ConditionSchema).min(1) }),
    z.strictObject({ not: ConditionSchema }),
    z.strictObject({ relationship: z.record(z.string(), z.unknown()) }),
  ]),
);

/** Hiệu ứng khi chọn. `relationship` chừa sẵn cho he-thong-quan-he: đọc được nhưng KHÔNG áp dụng ở feature này. */
export const EffectsSchema = z.strictObject({
  setFlags: z.record(flagName, z.boolean()).optional(),
  relationship: z
    .strictObject({
      npc: kebab,
      closeness: z.number().int().optional(), // Thân thiết
      trust: z.number().int().optional(), // Tin tưởng
      pressure: z.number().int().optional(), // Áp lực
    })
    .optional(),
});

export const DialogueChoiceSchema = z.strictObject({
  label: z.string().min(1),
  /** Đánh dấu "lựa chọn bằng hành động" (hiển thị khác biệt). */
  isAction: z.boolean().optional(),
  condition: ConditionSchema.optional(),
  effects: EffectsSchema.optional(),
  goto: z.string().min(1),
});

export const DialogueNodeSchema = z
  .strictObject({
    id: kebab,
    /** Id NPC đang nói, hoặc "narration". Tồn tại NPC kiểm ở loader. */
    speaker: z.string().min(1),
    lines: z.array(z.string().min(1)).min(1),
    next: z.string().min(1).optional(),
    choices: z.array(DialogueChoiceSchema).min(1).max(MAX_DIALOGUE_CHOICES, `tối đa ${MAX_DIALOGUE_CHOICES} lựa chọn mỗi node`).optional(),
    /** Chỉ dùng cùng `choices`: node đi tới khi mọi lựa chọn đều bị ẩn. Không có thì kết thúc hội thoại. */
    fallbackGoto: z.string().min(1).optional(),
  })
  .refine((n) => (n.next === undefined) !== (n.choices === undefined), "node phải có đúng một trong 'next' hoặc 'choices'");

export const DialogueSchema = z.strictObject({
  id: kebab,
  /** Node bắt đầu; mặc định là node đầu tiên. */
  start: z.string().min(1).optional(),
  nodes: z.array(DialogueNodeSchema).min(1),
});

export type Effects = z.infer<typeof EffectsSchema>;
export type DialogueChoice = z.infer<typeof DialogueChoiceSchema>;
export type DialogueNode = z.infer<typeof DialogueNodeSchema>;
export type Dialogue = z.infer<typeof DialogueSchema>;
