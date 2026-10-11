import { describe, expect, it } from "vitest";
import { loadContent } from "../src/data/content";
import { DialogueRunner, applyEffects, nextNodeId, visibleChoices, type Flags } from "../src/core/dialogue";
import { createInitialState, deserialize, serialize } from "../src/core/state";
import { DIALOGUE_END, type Dialogue } from "../src/data/schema";

const content = loadContent(); // nạp + kiểm tra TOÀN BỘ dữ liệu thật như khi khởi động game
const tree = (id: string): Dialogue => {
  const t = content.dialogues.get(id);
  if (!t) throw new Error(`thiếu cây thoại ${id}`);
  return t;
};

/** Chạy một cây thoại đến hết; mỗi lần gặp node có lựa chọn thì lấy nhãn kế tiếp trong `labels`. Trả về các node đã đi qua. */
function play(t: Dialogue, flags: Flags, labels: string[] = []): string[] {
  const r = new DialogueRunner(t, flags);
  const queue = [...labels];
  const visited: string[] = [];
  for (let guard = 0; !r.done; guard++) {
    if (guard > 100) throw new Error("vòng lặp vô hạn trong test");
    visited.push(r.node!.id);
    const choices = r.choices;
    if (choices.length === 0) {
      r.advance();
      continue;
    }
    const label = queue.shift();
    const i = choices.findIndex((c) => c.label === label);
    if (i < 0) throw new Error(`node '${r.node!.id}': không có lựa chọn '${String(label)}' (đang hiện: ${choices.map((c) => c.label).join(" | ")})`);
    r.choose(i);
  }
  return visited;
}

describe("dữ liệu hội thoại thật (T4/T5)", () => {
  it("loadContent nạp đủ 3 cây thoại mẫu và NPC trỏ đúng cây", () => {
    expect([...content.dialogues.keys()].sort()).toEqual(["bac-lao-cong-tro-chuyen", "huy-bi-nghi", "kiet-mo-dau"]);
    expect(content.npcs.get("kiet")?.dialogue).toBe("kiet-mo-dau");
    expect(content.npcs.get("huy")?.dialogue).toBe("huy-bi-nghi");
    expect(content.npcs.get("bac-lao-cong")?.dialogue).toBe("bac-lao-cong-tro-chuyen");
  });

  it("AC5: NPC không có `dialogue` giữ thoại tối thiểu (câu `line` vẫn còn)", () => {
    const thu = content.npcs.get("thu")!;
    expect(thu.dialogue).toBeUndefined();
    expect(thu.line).not.toBe("");
  });

  it("node 4 lựa chọn có lời dẫn ≤ 1 dòng (≤ 56 ký tự) để hộp không đè D-pad ở chế độ cảm ứng", () => {
    // Hộp rộng 304px, chữ 12px → ~58 ký tự/dòng. Đo thật: lời dẫn 52 ký tự của 'chon-hanh-dong' vừa 1 dòng, hộp cao 71px.
    const fourChoiceNodes = [...content.dialogues.values()].flatMap((t) => t.nodes.filter((n) => (n.choices?.length ?? 0) === 4).map((n) => ({ t, n })));
    expect(fourChoiceNodes.length, "phải có ít nhất một node 4 lựa chọn để canh (không pass rỗng)").toBeGreaterThan(0);
    for (const { t, n } of fourChoiceNodes) expect(n.lines.at(-1)!.length, `${t.id}/${n.id}`).toBeLessThanOrEqual(56);
  });

  it("mọi node tối đa 4 lựa chọn; lời thoại không có trang rỗng", () => {
    for (const t of content.dialogues.values()) {
      for (const n of t.nodes) {
        expect(n.choices?.length ?? 0, `${t.id}/${n.id}`).toBeLessThanOrEqual(4);
        for (const l of n.lines) expect(l.trim(), `${t.id}/${n.id}`).not.toBe("");
      }
    }
  });
});

describe("cảnh 'Huy bị nghi' — lựa chọn bằng hành động (FR7, AC2)", () => {
  const actions = [
    { label: "Đứng ra nhận thay Huy", flag: "ngay3.nhan-thay", last: "nhan-thay-3" },
    { label: "Đưa mảnh giấy cho cô", flag: "ngay3.dua-bang-chung", last: "bang-chung-3" },
    { label: "Im lặng, giữ bí mật", flag: "ngay3.im-lang", last: "im-lang" },
    { label: "Âm thầm đi điều tra", flag: "ngay3.dieu-tra", last: "dieu-tra-2" },
  ];

  it("có đúng 4 lựa chọn hành động ở node quyết định", () => {
    const node = tree("huy-bi-nghi").nodes.find((n) => n.id === "chon-hanh-dong")!;
    expect(node.choices).toHaveLength(4);
    expect(node.choices!.every((c) => c.isAction === true)).toBe(true);
  });

  it.each(actions)("chọn '$label' → đặt đúng MỘT flag riêng và đi tới nhánh riêng", ({ label, flag, last }) => {
    const flags: Flags = {};
    const visited = play(tree("huy-bi-nghi"), flags, ["Hỏi thẳng: cậu có làm không?", label]);
    expect(flags).toEqual({ [flag]: true });
    expect(visited.at(-1)).toBe(last);
  });

  it("bốn lựa chọn cho bốn kết quả (flag, nhánh) đều khác nhau — không lựa chọn nào trùng", () => {
    const outcomes = actions.map(({ label }) => {
      const flags: Flags = {};
      const visited = play(tree("huy-bi-nghi"), flags, ["Hỏi thẳng: cậu có làm không?", label]);
      return JSON.stringify([flags, visited.at(-1)]);
    });
    expect(new Set(outcomes).size).toBe(4);
  });
});

describe("điều kiện theo flag xuyên cảnh (AC3)", () => {
  const huyChoicesAtApproach = (flags: Flags): string[] => {
    const t = tree("huy-bi-nghi");
    return visibleChoices(t.nodes.find((n) => n.id === "tiep-can")!, flags).map((c) => c.label);
  };

  it("chưa nói chuyện với Kiệt → lựa chọn 'Nhắc chuyện Kiệt né tránh' bị ẩn", () => {
    expect(huyChoicesAtApproach({})).toEqual(["Hỏi thẳng: cậu có làm không?"]);
  });

  it("nhắc chuyện bế giảng với Kiệt (Ngày 1) → mở thêm lựa chọn ở cảnh Huy, và chọn nó đặt flag mới", () => {
    const state = createInitialState();
    play(tree("kiet-mo-dau"), state.flags, ["Nhắc chuyện ngày bế giảng"]);
    expect(state.flags["ngay1.nhac-be-giang"]).toBe(true);
    expect(huyChoicesAtApproach(state.flags)).toEqual(["Hỏi thẳng: cậu có làm không?", "Nhắc chuyện Kiệt né tránh"]);
    play(tree("huy-bi-nghi"), state.flags, ["Nhắc chuyện Kiệt né tránh", "Im lặng, giữ bí mật"]);
    expect(state.flags).toMatchObject({ "ngay1.nhac-be-giang": true, "ngay3.nghi-kiet-giau": true, "ngay3.im-lang": true });
  });

  it("cây bác lao công: lựa chọn 'mẩu thư' chỉ hiện sau khi đã hỏi bác nhặt được gì (menu lặp có lối ra)", () => {
    const flags: Flags = {};
    const visited = play(tree("bac-lao-cong-tro-chuyen"), flags, [
      "Giúp bác quét sân", // menu lần 1: chưa có 'mẩu thư'
      "Hỏi bác nhặt được những gì",
      "Hỏi về mẩu thư bác từng nhặt", // menu lần 3: đã hiện
      "Chào bác rồi đi",
    ]);
    expect(visited.filter((id) => id === "menu")).toHaveLength(4);
    expect(flags).toEqual({ "bac-lao-cong.quet-san-giup": true, "bac-lao-cong.ke-do-nhat": true, "bac-lao-cong.hoi-mau-thu": true });
    expect(() => play(tree("bac-lao-cong-tro-chuyen"), {}, ["Hỏi về mẩu thư bác từng nhặt"])).toThrow(/không có lựa chọn/);
  });
});

describe("không bao giờ kẹt trên dữ liệu thật (AC10, BR5)", () => {
  // Duyệt MỌI đường chọn có thể (kể cả mọi tổ hợp flag) và kiểm từ mọi trạng thái đều còn lối tới kết thúc.
  it.each([...content.dialogues.keys()])("cây '%s': từ mọi trạng thái đều tới được 'end'", (id) => {
    const t = tree(id);
    const key = (node: string, f: Flags) => node + "|" + JSON.stringify(Object.entries(f).sort());
    type S = { node: string; flags: Flags };
    const start: S = { node: t.start ?? t.nodes[0].id, flags: {} };
    const states = new Map<string, S>([[key(start.node, start.flags), start]]);
    const edges = new Map<string, string[]>();
    const queue = [start];
    while (queue.length) {
      const s = queue.shift()!;
      const k = key(s.node, s.flags);
      if (s.node === DIALOGUE_END) continue;
      const node = t.nodes.find((n) => n.id === s.node)!;
      const outs: S[] = [];
      const visible = visibleChoices(node, s.flags);
      if (node.next !== undefined || visible.length === 0) {
        outs.push({ node: nextNodeId(node, s.flags), flags: s.flags });
      } else {
        visible.forEach((c, i) => outs.push({ node: nextNodeId(node, s.flags, i), flags: applyEffects(s.flags, c.effects) }));
      }
      edges.set(k, outs.map((o) => key(o.node, o.flags)));
      for (const o of outs) {
        const ok = key(o.node, o.flags);
        if (!states.has(ok)) {
          states.set(ok, o);
          queue.push(o);
        }
      }
    }
    expect(states.size).toBeGreaterThan(t.nodes.length); // có duyệt thật (node + 'end' + biến thể flag), không pass rỗng
    expect(states.size).toBeLessThan(5000); // không bùng nổ trạng thái
    const canEnd = new Set([...states].filter(([, s]) => s.node === DIALOGUE_END).map(([k]) => k));
    for (let changed = true; changed; ) {
      changed = false;
      for (const [k, outs] of edges) {
        if (!canEnd.has(k) && outs.some((o) => canEnd.has(o))) {
          canEnd.add(k);
          changed = true;
        }
      }
    }
    const stuck = [...states.keys()].filter((k) => !canEnd.has(k));
    expect(stuck, `trạng thái không có đường tới 'end': ${stuck.slice(0, 3).join(" ; ")}`).toEqual([]);
  });
});

describe("flag nằm trong save v2 (T1 + engine)", () => {
  it("flag đặt qua hội thoại được ghi vào state và còn nguyên sau serialize/deserialize", () => {
    const state = createInitialState();
    play(tree("huy-bi-nghi"), state.flags, ["Hỏi thẳng: cậu có làm không?", "Đứng ra nhận thay Huy"]);
    const back = deserialize(serialize(state));
    expect(back.version).toBe(2);
    expect(back.flags).toEqual({ "ngay3.nhan-thay": true });
  });
});
