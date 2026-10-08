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
  DialogueSchema,
  type Dialogue,
  type NpcDef,
  DIALOGUE_END,
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
  /** Nếu có: ô (area,x,y) có nằm trên lối exit không (NPC không được đè, FR4.3/BR3). */
  onExit?: (areaId: string, x: number, y: number) => boolean;
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
    if (opts.onExit && opts.onExit(e.area, e.x, e.y)) errors.push(`${at}: ô (${e.x},${e.y}) trong '${e.area}' nằm trên lối exit, không đặt NPC được`);
  });

  // Chống trùng: cùng (npc, day, period) không được có cả mục "mọi thời tiết" lẫn mục theo thời tiết
  // (khi đó npcsInArea trả 2 vị trí cho 1 NPC, còn npcPosition chỉ lấy 1 → không nhất quán).
  const byNpcDayPeriod = new Map<string, Set<string>>();
  for (const e of data.schedules) {
    const gk = `${e.npc}|${e.day}|${e.period}`;
    if (!byNpcDayPeriod.has(gk)) byNpcDayPeriod.set(gk, new Set());
    byNpcDayPeriod.get(gk)!.add(e.weather ?? "*");
  }
  for (const [gk, ws] of byNpcDayPeriod) {
    if (ws.has("*") && ws.size > 1) errors.push(`${source}: (${gk}) có cả mục 'mọi thời tiết' lẫn mục theo thời tiết — gây trùng NPC`);
  }

  if (errors.length) fail(source, errors);
  return data;
}

// ---- Hội thoại nhánh (feature he-thong-hoi-thoai) ----

/** Một file cây thoại thô (source = tên file dùng trong thông báo lỗi). */
export interface DialogueEntry {
  source: string;
  raw: unknown;
}

export interface DialogueValidateOptions {
  /** Nếu có: kiểm tra `speaker` là NPC tồn tại (ngoài "narration"). */
  npcExists?: (npcId: string) => boolean;
  /** Cảnh báo không chặn (node mồ côi). Mặc định ghi console.warn. */
  onWarn?: (message: string) => void;
}

/** Cạnh đi ra của một node: next, goto của từng lựa chọn, fallbackGoto. */
function dialogueEdges(node: Dialogue["nodes"][number]): string[] {
  return [...(node.next !== undefined ? [node.next] : []), ...(node.choices ?? []).map((c) => c.goto), ...(node.fallbackGoto !== undefined ? [node.fallbackGoto] : [])];
}

/**
 * Nạp và kiểm tra các cây thoại: zod + liên kết (goto/next/fallbackGoto/start, speaker, id trùng),
 * không có vòng lặp không lối thoát (BR5). Node mồ côi chỉ cảnh báo. Lỗi nêu rõ file/node/trường.
 */
export function validateDialogues(entries: DialogueEntry[], opts: DialogueValidateOptions = {}): Dialogue[] {
  const warn = opts.onWarn ?? ((m: string) => console.warn(m));
  const errors: string[] = [];
  const trees: Dialogue[] = [];
  const treeIds = new Map<string, string>(); // id cây → file đầu tiên dùng

  for (const { source, raw } of entries) {
    const parsed = DialogueSchema.safeParse(raw);
    if (!parsed.success) {
      for (const i of parsed.error.issues) errors.push(`${source}: ${i.path.join(".") || "(gốc)"}: ${i.message}`);
      continue;
    }
    const tree = parsed.data;
    const before = errors.length;

    const firstSource = treeIds.get(tree.id);
    if (firstSource) errors.push(`${source}: id: cây thoại '${tree.id}' trùng với ${firstSource}`);
    else treeIds.set(tree.id, source);

    const nodeIds = new Set<string>();
    tree.nodes.forEach((n, i) => {
      if (n.id === DIALOGUE_END) errors.push(`${source}: nodes.${i}.id: '${DIALOGUE_END}' là từ khóa kết thúc, không dùng làm id node`);
      if (nodeIds.has(n.id)) errors.push(`${source}: nodes.${i}.id: id node trùng lặp '${n.id}'`);
      nodeIds.add(n.id);
    });
    const known = (id: string) => id === DIALOGUE_END || nodeIds.has(id);

    if (tree.start !== undefined && !nodeIds.has(tree.start)) errors.push(`${source}: start: node '${tree.start}' không tồn tại`);
    tree.nodes.forEach((n, i) => {
      const at = `${source}: nodes.${i}`;
      if (n.speaker !== "narration" && opts.npcExists && !opts.npcExists(n.speaker)) {
        errors.push(`${at}.speaker: NPC '${n.speaker}' không tồn tại trong data/npcs.json (hoặc dùng "narration")`);
      }
      if (n.next !== undefined && !known(n.next)) errors.push(`${at}.next: node '${n.next}' không tồn tại`);
      n.choices?.forEach((c, j) => {
        if (!known(c.goto)) errors.push(`${at}.choices.${j}.goto: node '${c.goto}' không tồn tại`);
      });
      if (n.fallbackGoto !== undefined) {
        if (n.choices === undefined) errors.push(`${at}.fallbackGoto: chỉ dùng được cùng 'choices'`);
        else if (!known(n.fallbackGoto)) errors.push(`${at}.fallbackGoto: node '${n.fallbackGoto}' không tồn tại`);
      }
    });

    // Phân tích đồ thị chỉ khi liên kết đã đúng, để khỏi báo lỗi dây chuyền.
    if (errors.length === before) {
      const byId = new Map(tree.nodes.map((n) => [n.id, n]));
      const start = tree.start ?? tree.nodes[0].id;
      const reach = new Set<string>([start]);
      const stack = [start];
      while (stack.length) {
        for (const t of dialogueEdges(byId.get(stack.pop()!)!)) {
          if (t !== DIALOGUE_END && !reach.has(t)) {
            reach.add(t);
            stack.push(t);
          }
        }
      }
      const canEnd = new Set<string>();
      for (let changed = true; changed; ) {
        changed = false;
        for (const n of tree.nodes) {
          if (!canEnd.has(n.id) && dialogueEdges(n).some((t) => t === DIALOGUE_END || canEnd.has(t))) {
            canEnd.add(n.id);
            changed = true;
          }
        }
      }
      for (const id of reach) {
        if (!canEnd.has(id)) errors.push(`${source}: node '${id}' nằm trong vòng lặp không có lối kết thúc (người chơi sẽ bị kẹt)`);
      }
      for (const n of tree.nodes) {
        if (!reach.has(n.id)) warn(`${source}: node '${n.id}' không có đường tới được từ node bắt đầu '${start}'`);
      }
    }
    trees.push(tree);
  }

  if (errors.length) fail("data/dialogues", errors);
  return trees;
}

/** Mỗi NPC có `dialogue` phải trỏ tới cây thoại tồn tại. */
export function checkNpcDialogueRefs(npcs: NpcDef[], dialogueIds: Set<string>, source = "data/npcs.json"): void {
  const errors: string[] = [];
  npcs.forEach((n, i) => {
    if (n.dialogue !== undefined && !dialogueIds.has(n.dialogue)) {
      errors.push(`${source}: npcs.${i}.dialogue: cây thoại '${n.dialogue}' không tồn tại trong data/dialogues`);
    }
  });
  if (errors.length) fail(source, errors);
}
