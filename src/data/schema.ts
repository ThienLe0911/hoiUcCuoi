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
