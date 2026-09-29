// Lớp "hành động" đầu vào dùng chung cho bàn phím và cảm ứng (logic thuần, không phụ thuộc Phaser/DOM).

export type Action = "up" | "down" | "left" | "right" | "interact" | "menu";
export type Direction = "up" | "down" | "left" | "right";

const DIRECTIONS: readonly Direction[] = ["up", "down", "left", "right"];

export class ActionState {
  private sources = new Map<Action, Set<string>>();
  /** Thứ tự nhấn của các hướng đang giữ (cuối = mới nhất). */
  private dirOrder: Direction[] = [];
  private pressed = new Set<Action>();

  press(action: Action, sourceId: string): void {
    let set = this.sources.get(action);
    if (!set) this.sources.set(action, (set = new Set()));
    const wasDown = set.size > 0;
    set.add(sourceId);
    if (wasDown) return;
    this.pressed.add(action);
    if (isDirection(action)) {
      this.dirOrder = this.dirOrder.filter((d) => d !== action);
      this.dirOrder.push(action);
    }
  }

  release(action: Action, sourceId: string): void {
    const set = this.sources.get(action);
    if (!set) return;
    set.delete(sourceId);
    if (set.size === 0 && isDirection(action)) {
      this.dirOrder = this.dirOrder.filter((d) => d !== action);
    }
  }

  isDown(action: Action): boolean {
    return (this.sources.get(action)?.size ?? 0) > 0;
  }

  /** Hướng di chuyển 4 hướng (không đi chéo): hướng nhấn sau cùng còn đang giữ. */
  getMoveDirection(): Direction | null {
    return this.dirOrder.length > 0 ? this.dirOrder[this.dirOrder.length - 1] : null;
  }

  /** Edge-trigger: true đúng một lần cho mỗi lần nhấn mới. */
  consumePressed(action: Action): boolean {
    return this.pressed.delete(action);
  }

  reset(): void {
    this.sources.clear();
    this.dirOrder = [];
    this.pressed.clear();
  }
}

function isDirection(a: Action): a is Direction {
  return (DIRECTIONS as readonly string[]).includes(a);
}
