// Phiên chơi: gom trạng thái, đồng hồ, hành động đầu vào và nội dung. Lưu trong registry của Phaser.
import type { Content } from "../data/content";
import { TOTAL_DAYS } from "../config";
import { ActionState } from "./actions";
import { createInitialState, type GameState } from "./state";
import { GameTime } from "./time";

export interface Session {
  state: GameState;
  time: GameTime;
  actions: ActionState;
  content: Content;
}

export function createSession(content: Content): Session {
  const state = createInitialState();
  return { state, time: new GameTime(TOTAL_DAYS, { day: state.day, period: state.period }), actions: new ActionState(), content };
}
