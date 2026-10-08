// Trạng thái game tuần tự hóa được thành JSON (chuẩn bị cho ADR 003).
import { GameTime, PERIODS_PER_DAY } from "./time";

/** v2: thêm `flags` (cờ cốt truyện, spec he-thong-hoi-thoai FR4). v1 vẫn nạp được (nâng cấp, không mất dữ liệu). */
export const STATE_VERSION = 2;
export const START_AREA = "cong-truong";

export interface GameState {
  version: number;
  day: number;
  period: number;
  areaId: string;
  position: { x: number; y: number };
  areaLocks: Record<string, boolean>;
  /** Cờ cốt truyện: tên flag → đã bật hay chưa. Hội thoại đặt, điều kiện đọc. */
  flags: Record<string, boolean>;
}

export function createInitialState(): GameState {
  return {
    version: STATE_VERSION,
    day: 1,
    period: 0,
    areaId: START_AREA,
    position: { x: 0, y: 0 },
    areaLocks: {
      "cong-truong": false,
      "san-chinh": false,
      "hanh-lang-lop-12": false,
      "hanh-lang-lop-10": false,
      "san-the-chat": false,
      "san-thuong": true,
    },
    flags: {},
  };
}

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

export function deserialize(json: string): GameState {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error("Dữ liệu lưu không phải JSON hợp lệ");
  }
  if (typeof raw !== "object" || raw === null) throw new Error("Dữ liệu lưu không hợp lệ: không phải đối tượng");
  const o = raw as Record<string, unknown>;
  // v1 (chưa có flags) được nâng cấp lên v2; mọi phiên bản khác (cũ hơn 1, mới hơn 2, thiếu) bị từ chối.
  if (o.version !== 1 && o.version !== STATE_VERSION) {
    throw new Error(`Phiên bản dữ liệu lưu không được hỗ trợ: ${String(o.version)} (hỗ trợ 1–${STATE_VERSION})`);
  }
  const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);
  if (!isInt(o.day) || o.day < 1) throw new Error("Dữ liệu lưu: 'day' không hợp lệ");
  if (!isInt(o.period) || o.period < 0 || o.period >= PERIODS_PER_DAY) throw new Error("Dữ liệu lưu: 'period' không hợp lệ");
  if (typeof o.areaId !== "string" || o.areaId === "") throw new Error("Dữ liệu lưu: 'areaId' không hợp lệ");
  const p = o.position as { x?: unknown; y?: unknown } | null;
  if (!p || typeof p.x !== "number" || typeof p.y !== "number") throw new Error("Dữ liệu lưu: 'position' không hợp lệ");
  const locks = o.areaLocks as Record<string, unknown> | null;
  if (!locks || typeof locks !== "object" || Object.values(locks).some((v) => typeof v !== "boolean")) {
    throw new Error("Dữ liệu lưu: 'areaLocks' không hợp lệ");
  }
  // flags: v1 không có → {}; v2 bắt buộc là đối tượng chứa toàn boolean.
  let flags: Record<string, boolean> = {};
  if (o.version === STATE_VERSION) {
    const f = o.flags as Record<string, unknown> | null | undefined;
    if (!f || typeof f !== "object" || Array.isArray(f) || Object.values(f).some((v) => typeof v !== "boolean")) {
      throw new Error("Dữ liệu lưu: 'flags' không hợp lệ");
    }
    flags = { ...(f as Record<string, boolean>) };
  }
  return {
    version: STATE_VERSION,
    day: o.day,
    period: o.period,
    areaId: o.areaId,
    position: { x: p.x, y: p.y },
    areaLocks: { ...(locks as Record<string, boolean>) },
    flags,
  };
}

/** Lấy ngày/khoảng từ đồng hồ vào state. */
export function applyTime(state: GameState, time: GameTime): GameState {
  return { ...state, day: time.day, period: time.period };
}

/** Tạo đồng hồ từ state đã lưu. */
export function timeFromState(state: GameState, totalDays: number): GameTime {
  return new GameTime(totalDays, { day: state.day, period: state.period });
}
