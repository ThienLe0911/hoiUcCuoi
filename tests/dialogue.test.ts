import { describe, expect, it } from "vitest";
import { DialogueRunner, applyEffects, evalCondition, findNode, nextNodeId, startNodeId, visibleChoices, type Flags } from "../src/core/dialogue";
import { DialogueSchema, type Dialogue } from "../src/data/schema";

// Cây thoại nhỏ dùng chung: một node có 3 lựa chọn (một cái chỉ hiện khi đã bật flag "tin-huy").
const tree = (): Dialogue =>
  DialogueSchema.parse({
    id: "thu-nghiem",
    nodes: [
      {
        id: "goc",
        speaker: "huy",
        lines: ["Cậu nghĩ sao?"],
        choices: [
          { label: "Nhận thay", isAction: true, effects: { setFlags: { "da-nhan-thay": true } }, goto: "nhan" },
          { label: "Im lặng", effects: { setFlags: { "da-im-lang": true } }, goto: "end" },
          { label: "Nhắc chuyện cũ", condition: { flag: "tin-huy" }, goto: "chuyen-cu" },
        ],
      },
      { id: "nhan", speaker: "narration", lines: ["Cậu đứng ra nhận."], next: "end" },
      { id: "chuyen-cu", speaker: "huy", lines: ["Cậu còn nhớ à..."], next: "end" },
    ],
  });

describe("evalCondition", () => {
  const flags: Flags = { a: true, b: false };

  it("không có điều kiện → true; flag bật → true; tắt hoặc thiếu → false", () => {
    expect(evalCondition(undefined, flags)).toBe(true);
    expect(evalCondition({ flag: "a" }, flags)).toBe(true);
    expect(evalCondition({ flag: "b" }, flags)).toBe(false);
    expect(evalCondition({ flag: "khong-co" }, flags)).toBe(false);
  });

  it("allOf / anyOf / not và lồng nhau", () => {
    expect(evalCondition({ allOf: [{ flag: "a" }, { not: { flag: "b" } }] }, flags)).toBe(true);
    expect(evalCondition({ allOf: [{ flag: "a" }, { flag: "b" }] }, flags)).toBe(false);
    expect(evalCondition({ anyOf: [{ flag: "b" }, { flag: "a" }] }, flags)).toBe(true);
    expect(evalCondition({ anyOf: [{ flag: "b" }, { flag: "khong-co" }] }, flags)).toBe(false);
    expect(evalCondition({ not: { anyOf: [{ flag: "b" }] } }, flags)).toBe(true);
  });

  it("điều kiện quan hệ chưa được đánh giá (chừa sẵn) → coi như thỏa", () => {
    expect(evalCondition({ relationship: { npc: "huy", trust: 60 } }, flags)).toBe(true);
  });
});

describe("visibleChoices", () => {
  it("ẩn lựa chọn chưa thỏa điều kiện, hiện khi flag bật", () => {
    const n = findNode(tree(), "goc");
    expect(visibleChoices(n, {}).map((c) => c.label)).toEqual(["Nhận thay", "Im lặng"]);
    expect(visibleChoices(n, { "tin-huy": true }).map((c) => c.label)).toEqual(["Nhận thay", "Im lặng", "Nhắc chuyện cũ"]);
  });

  it("node không có choices → rỗng", () => {
    expect(visibleChoices(findNode(tree(), "nhan"), {})).toEqual([]);
  });
});

describe("applyEffects", () => {
  it("bật/tắt flag và trả đối tượng MỚI, không sửa đối tượng cũ", () => {
    const before: Flags = { x: true, y: true };
    const after = applyEffects(before, { setFlags: { y: false, z: true } });
    expect(after).toEqual({ x: true, y: false, z: true });
    expect(before).toEqual({ x: true, y: true });
    expect(after).not.toBe(before);
  });

  it("không có hiệu ứng, hoặc chỉ có relationship (chưa áp dụng) → flags giữ nguyên", () => {
    expect(applyEffects({ x: true }, undefined)).toEqual({ x: true });
    expect(applyEffects({ x: true }, { relationship: { npc: "huy", trust: 5 } })).toEqual({ x: true });
  });
});

describe("nextNodeId", () => {
  const t = tree();

  it("node `next` đi theo next", () => {
    expect(nextNodeId(findNode(t, "nhan"), {})).toBe("end");
  });

  it("chọn theo chỉ số trong danh sách ĐÃ LỌC (lựa chọn ẩn không chiếm chỉ số)", () => {
    const n = findNode(t, "goc");
    expect(nextNodeId(n, {}, 0)).toBe("nhan");
    expect(nextNodeId(n, {}, 1)).toBe("end");
    expect(nextNodeId(n, { "tin-huy": true }, 2)).toBe("chuyen-cu");
  });

  it("chỉ số sai hoặc thiếu khi có lựa chọn → ném lỗi rõ", () => {
    const n = findNode(t, "goc");
    expect(() => nextNodeId(n, {})).toThrow(/cần chọn/);
    expect(() => nextNodeId(n, {}, 2)).toThrow(/cần chọn/); // lựa chọn thứ 3 đang ẩn
    expect(() => nextNodeId(n, {}, -1)).toThrow(/cần chọn/);
  });
});

describe("không bao giờ kẹt khi mọi lựa chọn bị ẩn (AC10)", () => {
  const hidden = (fallback?: string): Dialogue =>
    DialogueSchema.parse({
      id: "an-het",
      nodes: [
        {
          id: "goc",
          speaker: "narration",
          lines: ["Không còn gì để nói."],
          choices: [{ label: "Bí mật", condition: { flag: "chua-bat" }, goto: "end" }],
          ...(fallback ? { fallbackGoto: fallback } : {}),
        },
        { id: "du-phong", speaker: "narration", lines: ["Dự phòng."], next: "end" },
      ],
    });

  it("không có fallbackGoto → kết thúc", () => {
    expect(nextNodeId(findNode(hidden(), "goc"), {})).toBe("end");
  });

  it("có fallbackGoto → đi tới node đó", () => {
    expect(nextNodeId(findNode(hidden("du-phong"), "goc"), {})).toBe("du-phong");
  });

  it("runner: node mọi lựa chọn ẩn chỉ cần advance()", () => {
    const r = new DialogueRunner(hidden("du-phong"), {});
    expect(r.choices).toEqual([]);
    r.advance();
    expect(r.node?.id).toBe("du-phong");
    r.advance();
    expect(r.done).toBe(true);
  });
});

describe("DialogueRunner", () => {
  it("bắt đầu ở node đầu (hoặc `start`)", () => {
    expect(startNodeId(tree())).toBe("goc");
    const t = DialogueSchema.parse({ ...tree(), start: "nhan" });
    expect(startNodeId(t)).toBe("nhan");
    expect(new DialogueRunner(t, {}).node?.id).toBe("nhan");
  });

  it("đi hết một nhánh: chọn 'Nhận thay' → ghi flag vào đối tượng flags sống → node nhan → kết thúc", () => {
    const flags: Flags = {};
    const r = new DialogueRunner(tree(), flags);
    expect(r.node?.id).toBe("goc");
    expect(r.choices.map((c) => c.label)).toEqual(["Nhận thay", "Im lặng"]);
    r.choose(0);
    expect(flags).toEqual({ "da-nhan-thay": true }); // ghi thẳng vào đối tượng truyền vào (vd state.flags)
    expect(r.node?.id).toBe("nhan");
    r.advance();
    expect(r.done).toBe(true);
    expect(r.node).toBeNull();
  });

  it("hai lựa chọn khác nhau → nhánh khác nhau và flag khác nhau (AC2)", () => {
    const a: Flags = {};
    const b: Flags = {};
    const ra = new DialogueRunner(tree(), a);
    const rb = new DialogueRunner(tree(), b);
    ra.choose(0);
    rb.choose(1);
    expect(a).toEqual({ "da-nhan-thay": true });
    expect(b).toEqual({ "da-im-lang": true });
    expect(ra.node?.id).toBe("nhan");
    expect(rb.done).toBe(true);
  });

  it("lựa chọn có điều kiện chỉ chọn được khi flag đã bật (AC3)", () => {
    const flags: Flags = { "tin-huy": true };
    const r = new DialogueRunner(tree(), flags);
    expect(r.choices).toHaveLength(3);
    r.choose(2);
    expect(r.node?.id).toBe("chuyen-cu");
  });

  it("chọn sai chỉ số thì ném lỗi và KHÔNG đổi flag", () => {
    const flags: Flags = {};
    const r = new DialogueRunner(tree(), flags);
    expect(() => r.choose(5)).toThrow(/cần chọn/);
    expect(flags).toEqual({});
    expect(r.node?.id).toBe("goc");
  });

  it("advance() khi còn lựa chọn, hoặc choose() khi không có lựa chọn → ném lỗi", () => {
    const r = new DialogueRunner(tree(), {});
    expect(() => r.advance()).toThrow(/choose/);
    r.choose(0); // sang node 'nhan' (chỉ có next)
    expect(() => r.choose(0)).toThrow(/advance/);
  });

  it("sau khi kết thúc, advance()/choose() không làm gì", () => {
    const r = new DialogueRunner(tree(), {});
    r.choose(1);
    expect(r.done).toBe(true);
    expect(() => r.advance()).not.toThrow();
    expect(() => r.choose(0)).not.toThrow();
    expect(r.done).toBe(true);
  });
});
