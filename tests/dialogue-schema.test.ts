import { describe, expect, it } from "vitest";
import { checkNpcDialogueRefs, validateDialogues } from "../src/data/loader";
import { DialogueSchema, type NpcDef } from "../src/data/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

const good = (): Raw => ({
  id: "mau",
  nodes: [
    {
      id: "mo-dau",
      speaker: "kiet",
      lines: ["Ê Thiện!"],
      choices: [
        { label: "Chào lại", goto: "ket-thuc" },
        { label: "Làm lơ", isAction: true, effects: { setFlags: { "ngay1.lam-lo": true } }, goto: "end" },
      ],
    },
    { id: "ket-thuc", speaker: "narration", lines: ["Hết."], next: "end" },
  ],
});

const npcs = new Set(["kiet", "huy"]);
const opts = { npcExists: (id: string) => npcs.has(id), onWarn: () => {} };
const entry = (raw: Raw, source = "data/dialogues/mau.json") => ({ source, raw });
const run = (raw: Raw) => validateDialogues([entry(raw)], opts);

describe("validateDialogues — cây hợp lệ", () => {
  it("nạp cây hợp lệ, trả về đúng cây", () => {
    const [t] = run(good());
    expect(t.id).toBe("mau");
    expect(t.nodes).toHaveLength(2);
  });

  it("speaker 'narration' luôn hợp lệ, kể cả không truyền npcExists", () => {
    const d = good();
    d.nodes[0].speaker = "narration";
    expect(() => validateDialogues([entry(d)], { onWarn: () => {} })).not.toThrow();
  });

  it("điều kiện lồng nhau (allOf/anyOf/not/flag) và `relationship` chừa sẵn đều được chấp nhận", () => {
    const d = good();
    d.nodes[0].choices[0].condition = { allOf: [{ flag: "a" }, { not: { flag: "b.c-d" } }, { anyOf: [{ flag: "x" }, { relationship: { npc: "huy", trust: 60 } }] }] };
    d.nodes[0].choices[1].effects.relationship = { npc: "huy", trust: -5 };
    expect(DialogueSchema.safeParse(d).success).toBe(true);
    expect(() => run(d)).not.toThrow();
  });
});

describe("validateDialogues — liên kết và quy tắc", () => {
  it("goto trỏ node không tồn tại → lỗi chỉ rõ file/node/lựa chọn", () => {
    const d = good();
    d.nodes[0].choices[0].goto = "khong-co";
    expect(() => run(d)).toThrow(/mau\.json: nodes\.0\.choices\.0\.goto.*khong-co/);
  });

  it("next trỏ node không tồn tại", () => {
    const d = good();
    d.nodes[1].next = "khong-co";
    expect(() => run(d)).toThrow(/nodes\.1\.next.*khong-co/);
  });

  it("speaker không phải NPC và không phải narration", () => {
    const d = good();
    d.nodes[0].speaker = "nguoi-la";
    expect(() => run(d)).toThrow(/nodes\.0\.speaker.*nguoi-la/);
  });

  it("quá 4 lựa chọn mỗi node bị chặn (FR5.3)", () => {
    const d = good();
    d.nodes[0].choices = Array.from({ length: 5 }, (_, i) => ({ label: `L${i}`, goto: "end" }));
    expect(() => run(d)).toThrow(/tối đa 4/);
  });

  it("đúng 4 lựa chọn thì được", () => {
    const d = good();
    d.nodes[0].choices = Array.from({ length: 4 }, (_, i) => ({ label: `L${i}`, goto: "end" }));
    expect(() => run(d)).not.toThrow();
  });

  it("node có cả next lẫn choices, hoặc không có cái nào → lỗi", () => {
    const both = good();
    both.nodes[0].next = "end";
    expect(() => run(both)).toThrow(/đúng một/);
    const neither = good();
    delete neither.nodes[1].next;
    expect(() => run(neither)).toThrow(/đúng một/);
  });

  it("id node 'end' bị cấm; id node trùng bị bắt", () => {
    const e = good();
    e.nodes[1].id = "end";
    expect(() => run(e)).toThrow(/từ khóa kết thúc/);
    const dup = good();
    dup.nodes[1].id = "mo-dau";
    expect(() => run(dup)).toThrow(/trùng lặp 'mo-dau'/);
  });

  it("start trỏ node không tồn tại", () => {
    const d = good();
    d.start = "khong-co";
    expect(() => run(d)).toThrow(/start.*khong-co/);
  });

  it("fallbackGoto chỉ dùng với choices và phải trỏ node có thật", () => {
    const noChoices = good();
    noChoices.nodes[1].fallbackGoto = "end";
    expect(() => run(noChoices)).toThrow(/fallbackGoto.*choices/);
    const bad = good();
    bad.nodes[0].fallbackGoto = "khong-co";
    expect(() => run(bad)).toThrow(/fallbackGoto.*khong-co/);
    const ok = good();
    ok.nodes[0].fallbackGoto = "ket-thuc";
    expect(() => run(ok)).not.toThrow();
  });

  it("id cây trùng giữa hai file bị bắt, nêu file đầu tiên", () => {
    expect(() => validateDialogues([entry(good(), "data/dialogues/a.json"), entry(good(), "data/dialogues/b.json")], opts)).toThrow(/b\.json.*trùng với data\/dialogues\/a\.json/);
  });

  it("khóa lạ hoặc tên flag sai bị bắt (strict)", () => {
    const extra = good();
    extra.nodes[0].choices[0].colour = "red";
    expect(() => run(extra)).toThrow(/choices\.0/);
    const flag = good();
    flag.nodes[0].choices[1].effects.setFlags = { "Ngay1 Sai": true };
    expect(() => run(flag)).toThrow(/setFlags/);
  });
});

describe("validateDialogues — không kẹt (BR5)", () => {
  it("vòng lặp không có lối kết thúc bị bắt", () => {
    const d = {
      id: "ket",
      nodes: [
        { id: "a", speaker: "narration", lines: ["a"], next: "b" },
        { id: "b", speaker: "narration", lines: ["b"], next: "a" },
      ],
    };
    expect(() => run(d)).toThrow(/vòng lặp không có lối kết thúc/);
  });

  it("vòng lặp CÓ lối thoát (menu hỏi thêm) thì được", () => {
    const d = {
      id: "hoi-them",
      nodes: [
        {
          id: "menu",
          speaker: "huy",
          lines: ["Cậu muốn hỏi gì?"],
          choices: [
            { label: "Hỏi tiếp", goto: "tra-loi" },
            { label: "Thôi", goto: "end" },
          ],
        },
        { id: "tra-loi", speaker: "huy", lines: ["Ừ."], next: "menu" },
      ],
    };
    expect(() => run(d)).not.toThrow();
  });

  it("node mồ côi chỉ cảnh báo, không ném lỗi", () => {
    const d = good();
    d.nodes.push({ id: "mo-coi", speaker: "narration", lines: ["Không ai tới đây."], next: "end" });
    const warns: string[] = [];
    expect(() => validateDialogues([entry(d)], { ...opts, onWarn: (m) => warns.push(m) })).not.toThrow();
    expect(warns.join("\n")).toMatch(/mo-coi.*không có đường tới được/);
  });
});

describe("checkNpcDialogueRefs", () => {
  const npc = (over: Partial<NpcDef>): NpcDef => ({ id: "kiet", name: "Kiệt", kind: "main", frame: "npc_kiet", interactable: true, line: "Chào", ...over });

  it("NPC trỏ cây thoại có thật thì qua; không có dialogue thì bỏ qua", () => {
    expect(() => checkNpcDialogueRefs([npc({ dialogue: "mau" }), npc({ id: "thu" })], new Set(["mau"]))).not.toThrow();
  });

  it("NPC trỏ cây thoại không tồn tại → lỗi chỉ rõ NPC", () => {
    expect(() => checkNpcDialogueRefs([npc({ dialogue: "khong-co" })], new Set(["mau"]))).toThrow(/npcs\.0\.dialogue.*khong-co/);
  });
});
