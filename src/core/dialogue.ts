// Máy chạy hội thoại nhánh (logic thuần, không phụ thuộc Phaser/DOM) — spec he-thong-hoi-thoai FR2/FR3/FR9.
// Dữ liệu đã được loader kiểm tra liên kết; ở đây chỉ chọn node, lọc lựa chọn theo flag,
// áp hiệu ứng setFlags và tính node kế. Hiệu ứng/điều kiện `relationship` được chừa chỗ nhưng
// CHƯA áp dụng (thuộc feature he-thong-quan-he).
import { DIALOGUE_END, type Condition, type Dialogue, type DialogueChoice, type DialogueNode, type Effects } from "../data/schema";

export type Flags = Record<string, boolean>;

/** Đánh giá điều kiện theo flag. Không có điều kiện → true. `relationship` chưa đánh giá → true. */
export function evalCondition(cond: Condition | undefined, flags: Flags): boolean {
  if (cond === undefined) return true;
  if ("flag" in cond) return flags[cond.flag] === true;
  if ("allOf" in cond) return cond.allOf.every((c) => evalCondition(c, flags));
  if ("anyOf" in cond) return cond.anyOf.some((c) => evalCondition(c, flags));
  if ("not" in cond) return !evalCondition(cond.not, flags);
  return true; // relationship: chừa sẵn
}

export function startNodeId(tree: Dialogue): string {
  return tree.start ?? tree.nodes[0].id;
}

export function findNode(tree: Dialogue, id: string): DialogueNode {
  const node = tree.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Cây thoại '${tree.id}' không có node '${id}'`);
  return node;
}

/** Các lựa chọn đang hiển thị ở node (đã lọc theo điều kiện). Node không có `choices` → []. */
export function visibleChoices(node: DialogueNode, flags: Flags): DialogueChoice[] {
  return (node.choices ?? []).filter((c) => evalCondition(c.condition, flags));
}

/** Trả về flags mới sau hiệu ứng (không sửa đối tượng cũ). Chỉ áp `setFlags`; `relationship` bị bỏ qua. */
export function applyEffects(flags: Flags, effects: Effects | undefined): Flags {
  return { ...flags, ...(effects?.setFlags ?? {}) };
}

/**
 * Node kế tiếp (id hoặc "end") từ node hiện tại.
 * - Node có `next`: đi theo `next`.
 * - Node có lựa chọn hiển thị: cần `choiceIndex` (chỉ số trong danh sách ĐÃ LỌC).
 * - Node có `choices` nhưng mọi lựa chọn đều ẩn: đi `fallbackGoto` hoặc kết thúc — không bao giờ kẹt (BR5).
 */
export function nextNodeId(node: DialogueNode, flags: Flags, choiceIndex?: number): string {
  if (node.next !== undefined) return node.next;
  const visible = visibleChoices(node, flags);
  if (visible.length === 0) return node.fallbackGoto ?? DIALOGUE_END;
  if (choiceIndex === undefined || !Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= visible.length) {
    throw new Error(`Node '${node.id}' cần chọn một lựa chọn hợp lệ (0..${visible.length - 1}), nhận: ${String(choiceIndex)}`);
  }
  return visible[choiceIndex].goto;
}

/**
 * Chạy một cây thoại từng bước. `flags` là đối tượng sống (vd `state.flags`): chọn một lựa chọn sẽ
 * ghi hiệu ứng thẳng vào đó. Giao diện chỉ cần: đọc `node`/`choices`, gọi `advance()` hoặc `choose(i)`.
 */
export class DialogueRunner {
  private nodeId: string = DIALOGUE_END;

  constructor(
    readonly tree: Dialogue,
    private readonly flags: Flags,
  ) {
    this.nodeId = startNodeId(tree);
  }

  /** Node hiện tại, hoặc null khi hội thoại đã kết thúc. */
  get node(): DialogueNode | null {
    return this.nodeId === DIALOGUE_END ? null : findNode(this.tree, this.nodeId);
  }

  get done(): boolean {
    return this.nodeId === DIALOGUE_END;
  }

  /** Lựa chọn đang hiển thị ở node hiện tại. Rỗng nghĩa là chỉ cần `advance()`. */
  get choices(): DialogueChoice[] {
    const n = this.node;
    return n ? visibleChoices(n, this.flags) : [];
  }

  /** Qua node kế khi không có gì để chọn (node `next`, hoặc node mà mọi lựa chọn đều ẩn). */
  advance(): void {
    const n = this.node;
    if (!n) return;
    if (this.choices.length > 0) throw new Error(`Node '${n.id}' đang có lựa chọn, phải dùng choose()`);
    this.nodeId = nextNodeId(n, this.flags);
  }

  /** Chọn lựa chọn thứ `index` trong `choices`: áp hiệu ứng vào flags rồi sang node đích. */
  choose(index: number): void {
    const n = this.node;
    if (!n) return;
    const visible = this.choices;
    if (visible.length === 0) throw new Error(`Node '${n.id}' không có lựa chọn để chọn, phải dùng advance()`);
    const next = nextNodeId(n, this.flags, index); // ném lỗi nếu index sai, trước khi đổi flags
    Object.assign(this.flags, applyEffects(this.flags, visible[index].effects));
    this.nodeId = next;
  }
}
