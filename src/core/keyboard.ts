// Bộ nghe bàn phím: ánh xạ phím → hành động.
import type { Action, ActionState } from "./actions";

export const KEY_MAP: Record<string, Action> = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  KeyE: "interact",
  Space: "interact",
  Escape: "menu",
};

const PREVENT_DEFAULT = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

/** Gắn bộ nghe vào target (mặc định window). Trả về hàm dispose(). */
export function attachKeyboard(state: ActionState, target: EventTarget = window): () => void {
  const onDown = (e: Event) => {
    const ke = e as KeyboardEvent;
    const action = KEY_MAP[ke.code];
    if (!action) return;
    if (PREVENT_DEFAULT.has(ke.code)) ke.preventDefault();
    if (ke.repeat) return;
    state.press(action, ke.code);
  };
  const onUp = (e: Event) => {
    const ke = e as KeyboardEvent;
    const action = KEY_MAP[ke.code];
    if (action) state.release(action, ke.code);
  };
  const onBlur = () => state.reset();

  target.addEventListener("keydown", onDown);
  target.addEventListener("keyup", onUp);
  target.addEventListener("blur", onBlur);
  return () => {
    target.removeEventListener("keydown", onDown);
    target.removeEventListener("keyup", onUp);
    target.removeEventListener("blur", onBlur);
  };
}
