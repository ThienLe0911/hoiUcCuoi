// Test bổ sung của QA độc lập cho feature he-thong-hoi-thoai (lấp lỗ hổng sau /validate):
// deserialize với dữ liệu xấu, validateDialogues ca biên, engine (lồng sâu, không làm bẩn, flags dùng chung),
// và giới hạn độ dài chữ trên dữ liệu thật (hộp thoại ~304px, font 12px).
import { describe, expect, it, vi } from "vitest";
import { DialogueRunner, applyEffects, evalCondition, nextNodeId, startNodeId, visibleChoices, type Flags } from "../src/core/dialogue";
import { createInitialState, deserialize, serialize } from "../src/core/state";
import { loadContent } from "../src/data/content";
import { validateDialogues, type DialogueValidateOptions } from "../src/data/loader";
import { DialogueSchema, type Condition, type Dialogue } from "../src/data/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

// ---------------------------------------------------------------------------------------------
// deserialize: dữ liệu xấu / khóa lạ
// ---------------------------------------------------------------------------------------------
describe("deserialize — flags có khóa lạ và dữ liệu xấu (QA)", () => {
  const withFlagsJson = (flagsJson: string): string => serialize(createInitialState()).replace('"flags":{}', `"flags":${flagsJson}`);

  it("khóa '__proto__' trong flags (JSON thô) KHÔNG làm ô nhiễm prototype và không phá state", () => {
    const json = withFlagsJson('{"__proto__":true,"a.b":true}');
    expect(json).toContain('"__proto__":true'); // đảm bảo test thật sự đưa khóa độc vào
    const s = deserialize(json);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(s.flags)).toBe(Object.prototype); // prototype không bị thay
    expect(Object.prototype.hasOwnProperty.call(s.flags, "a.b")).toBe(true);
    expect(s.flags["a.b"]).toBe(true);
    // các trường còn lại nguyên vẹn
    expect(s.version).toBe(2);
    expect(s.day).toBe(1);
    expect(s.areaId).toBe("cong-truong");
  });

  it("'__proto__' mang giá trị là đối tượng (cố gài thuộc tính) bị từ chối vì không phải boolean", () => {
    expect(() => deserialize(withFlagsJson('{"__proto__":{"polluted":true}}'))).toThrow(/flags/);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("khóa chuỗi rỗng trong flags không làm hỏng deserialize/serialize round-trip", () => {
    const s = deserialize(withFlagsJson('{"":true}'));
    expect(s.flags[""]).toBe(true);
    expect(deserialize(serialize(s)).flags).toEqual({ "": true });
  });

  it("flags: null (v2) bị từ chối với thông báo nhắc 'flags'", () => {
    expect(() => deserialize(withFlagsJson("null"))).toThrow(/flags/);
  });

  it("flags có giá trị lồng/null/số bị từ chối", () => {
    expect(() => deserialize(withFlagsJson('{"a":null}'))).toThrow(/flags/);
    expect(() => deserialize(withFlagsJson('{"a":1}'))).toThrow(/flags/);
    expect(() => deserialize(withFlagsJson('{"a":{"b":true}}'))).toThrow(/flags/);
  });

  it("flags đọc ra là bản sao: sửa kết quả không ảnh hưởng đối tượng đã parse trước đó", () => {
    const a = deserialize(withFlagsJson('{"x":true}'));
    const b = deserialize(withFlagsJson('{"x":true}'));
    a.flags.y = true;
    expect(b.flags).toEqual({ x: true });
  });

  it("v1 có thêm trường lạ: nạp được, trường lạ bị bỏ, flags = {}", () => {
    const { flags: _f, ...rest } = createInitialState();
    const v1 = { ...rest, version: 1, hack: "x", __extra: { a: 1 } };
    const up = deserialize(JSON.stringify(v1));
    expect(up.version).toBe(2);
    expect(up.flags).toEqual({});
    expect(up).not.toHaveProperty("hack");
    expect(up).not.toHaveProperty("__extra");
  });

  it("v2 có thêm trường lạ: nạp được, trường lạ bị bỏ", () => {
    const s = { ...createInitialState(), hack: 1 };
    const up = deserialize(JSON.stringify(s));
    expect(up).not.toHaveProperty("hack");
    expect(Object.keys(up).sort()).toEqual(["areaId", "areaLocks", "day", "flags", "period", "position", "version"]);
  });

  it("version dạng chuỗi hoặc số thực khác 1/2 bị từ chối", () => {
    const s = createInitialState();
    expect(() => deserialize(JSON.stringify({ ...s, version: "2" }))).toThrow(/Phiên bản/);
    expect(() => deserialize(JSON.stringify({ ...s, version: 1.5 }))).toThrow(/Phiên bản/);
    expect(() => deserialize(JSON.stringify({ ...s, version: null }))).toThrow(/Phiên bản/);
  });

  it("JSON hợp lệ nhưng không phải đối tượng (null, mảng số, chuỗi) bị từ chối", () => {
    expect(() => deserialize("null")).toThrow(/không phải đối tượng/);
    expect(() => deserialize('"abc"')).toThrow(/không phải đối tượng/);
    expect(() => deserialize("42")).toThrow(/không phải đối tượng/);
  });

  it("v1 → v2 giữ nguyên toàn bộ dữ liệu cũ và chạy tiếp được serialize → deserialize v2", () => {
    const { flags: _f, ...rest } = createInitialState();
    const v1 = { ...rest, version: 1, day: 5, period: 3, areaId: "san-the-chat", position: { x: 1.5, y: 2 } };
    const up = deserialize(JSON.stringify(v1));
    expect(deserialize(serialize(up))).toEqual(up);
    expect(up.position).toEqual({ x: 1.5, y: 2 });
    expect(up.day).toBe(5);
  });
});

// ---------------------------------------------------------------------------------------------
// validateDialogues: ca biên
// ---------------------------------------------------------------------------------------------
const goodTree = (over: Raw = {}): Raw => ({
  id: "mau",
  nodes: [
    {
      id: "mo-dau",
      speaker: "kiet",
      lines: ["Ê Thiện!"],
      choices: [
        { label: "Chào lại", goto: "ket-thuc" },
        { label: "Làm lơ", goto: "end" },
      ],
    },
    { id: "ket-thuc", speaker: "narration", lines: ["Hết."], next: "end" },
  ],
  ...over,
});
const npcs = new Set(["kiet", "huy"]);
const opts: DialogueValidateOptions = { npcExists: (id: string) => npcs.has(id), onWarn: () => {} };
const entry = (raw: Raw, source = "data/dialogues/mau.json") => ({ source, raw });
const run = (raw: Raw, o: DialogueValidateOptions = opts) => validateDialogues([entry(raw)], o);

describe("validateDialogues — ca biên (QA)", () => {
  it("nhiều file cùng lúc: báo GỘP mọi lỗi của mọi file trong một lần ném", () => {
    const a = goodTree({ id: "a" });
    a.nodes[0].choices[0].goto = "khong-co"; // lỗi liên kết
    const b = goodTree({ id: "b" });
    b.nodes[0].speaker = "nguoi-la"; // lỗi speaker
    const c = goodTree({ id: "c" });
    c.nodes[0].lines = [""]; // lỗi zod
    const d = goodTree({ id: "d" }); // file hợp lệ giữa chừng không che lỗi
    let msg = "";
    try {
      validateDialogues([entry(a, "data/dialogues/a.json"), entry(d, "data/dialogues/d.json"), entry(b, "data/dialogues/b.json"), entry(c, "data/dialogues/c.json")], opts);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/a\.json: nodes\.0\.choices\.0\.goto.*khong-co/);
    expect(msg).toMatch(/b\.json: nodes\.0\.speaker.*nguoi-la/);
    expect(msg).toMatch(/c\.json: nodes\.0\.lines\.0/);
    expect(msg).not.toMatch(/d\.json/);
  });

  it("nhiều lỗi trong CÙNG một cây đều được liệt kê (không dừng ở lỗi đầu)", () => {
    const t = goodTree();
    t.nodes[0].choices[0].goto = "x1";
    t.nodes[0].choices[1].goto = "x2";
    t.nodes[1].next = "x3";
    let msg = "";
    try {
      run(t);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/x1/);
    expect(msg).toMatch(/x2/);
    expect(msg).toMatch(/x3/);
  });

  it("`lines` chứa chuỗi rỗng bị bắt, chỉ rõ chỉ số trang", () => {
    const t = goodTree();
    t.nodes[1].lines = ["Một", ""];
    expect(() => run(t)).toThrow(/nodes\.1\.lines\.1/);
  });

  it("`lines` là mảng rỗng bị bắt", () => {
    const t = goodTree();
    t.nodes[1].lines = [];
    expect(() => run(t)).toThrow(/nodes\.1\.lines/);
  });

  it("`start` hợp lệ khác node đầu: nạp được; node đầu trở thành mồ côi (chỉ cảnh báo)", () => {
    const t = goodTree({ start: "ket-thuc" });
    const warns: string[] = [];
    const [tree] = run(t, { ...opts, onWarn: (m) => warns.push(m) });
    expect(startNodeId(tree)).toBe("ket-thuc");
    expect(warns.join("\n")).toMatch(/mo-dau.*không có đường tới được.*ket-thuc/);
    // runner thật sự bắt đầu ở `start`
    expect(new DialogueRunner(tree, {}).node?.id).toBe("ket-thuc");
  });

  it("speaker 'narration' hợp lệ kể cả khi npcExists luôn trả false", () => {
    const t = goodTree();
    t.nodes[0].speaker = "narration";
    expect(() => run(t, { npcExists: () => false, onWarn: () => {} })).not.toThrow();
  });

  it("speaker rỗng bị bắt", () => {
    const t = goodTree();
    t.nodes[0].speaker = "";
    expect(() => run(t)).toThrow(/nodes\.0\.speaker/);
  });

  it("`choices` là mảng rỗng bị bắt (không thể tạo node không lối ra)", () => {
    const t = goodTree();
    t.nodes[0].choices = [];
    expect(() => run(t)).toThrow(/nodes\.0\.choices/);
  });

  it("id node không phải kebab-case bị bắt (hoa, khoảng trắng, gạch dưới, tiếng Việt có dấu)", () => {
    for (const bad of ["MoDau", "mo dau", "mo_dau", "mở-đầu", "-mo", "mo-"]) {
      const t = goodTree();
      t.nodes[1].id = bad;
      expect(() => run(t), `id '${bad}'`).toThrow(/nodes\.1\.id/);
    }
  });

  it("id cây thoại không phải kebab-case bị bắt", () => {
    expect(() => run(goodTree({ id: "Cay Thoai" }))).toThrow(/id/);
  });

  it("nhãn lựa chọn rỗng hoặc goto rỗng bị bắt", () => {
    const t = goodTree();
    t.nodes[0].choices[0].label = "";
    expect(() => run(t)).toThrow(/choices\.0\.label/);
    const u = goodTree();
    u.nodes[0].choices[0].goto = "";
    expect(() => run(u)).toThrow(/choices\.0\.goto/);
  });

  it("điều kiện rỗng (allOf: []) hoặc điều kiện có 2 khóa bị bắt", () => {
    const t = goodTree();
    t.nodes[0].choices[0].condition = { allOf: [] };
    expect(() => run(t)).toThrow(/condition/);
    const u = goodTree();
    u.nodes[0].choices[0].condition = { flag: "a", not: { flag: "b" } };
    expect(() => run(u)).toThrow(/condition/);
  });

  it("effects.relationship với khóa lạ hoặc npc sai kebab bị bắt; hợp lệ thì chấp nhận nhưng engine bỏ qua", () => {
    const bad = goodTree();
    bad.nodes[0].choices[0].effects = { relationship: { npc: "huy", loyalty: 1 } };
    expect(() => run(bad)).toThrow(/effects/);
    const bad2 = goodTree();
    bad2.nodes[0].choices[0].effects = { relationship: { npc: "Huy Bi", trust: 1 } };
    expect(() => run(bad2)).toThrow(/effects/);
    const ok = goodTree();
    ok.nodes[0].choices[0].effects = { relationship: { npc: "huy", closeness: 1, trust: -2, pressure: 3 } };
    const [tree] = run(ok);
    const flags: Flags = {};
    const r = new DialogueRunner(tree, flags);
    r.choose(0);
    expect(flags).toEqual({}); // chưa áp dụng quan hệ
    expect(r.node?.id).toBe("ket-thuc");
  });

  it("tên flag sai quy ước ('Ab', rỗng, 'a b', 'a..b', '__proto__') bị loader chặn ở condition; ở setFlags bị chặn (riêng '__proto__' bị zod lặng lẽ loại bỏ, xem ca kế)", () => {
    for (const name of ["__proto__", "Ab", "", "a b", "a..b"]) {
      const u = goodTree();
      u.nodes[0].choices[0].condition = { flag: name };
      expect(() => run(u), `condition '${name}'`).toThrow();
    }
    for (const name of ["Ab", "", "a b", "a..b"]) {
      const t = goodTree();
      t.nodes[0].choices[0].effects = { setFlags: { [name]: true } };
      expect(() => run(t), `setFlags '${name}'`).toThrow();
    }
  });

  it("setFlags với khóa '__proto__': KHÔNG gây ô nhiễm prototype và khóa không lọt vào dữ liệu đã nạp (zod loại lặng lẽ — QUAN SÁT: không báo lỗi)", () => {
    const t = JSON.parse(JSON.stringify(goodTree()));
    t.nodes[0].choices[0].effects = JSON.parse('{"setFlags":{"__proto__":true,"ok":true}}');
    const [tree] = run(t);
    const sf = tree.nodes[0].choices![0].effects!.setFlags!;
    expect(Object.prototype.hasOwnProperty.call(sf, "__proto__")).toBe(false);
    expect(sf).toEqual({ ok: true });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(sf)).toBe(Object.prototype);
    // chạy thật: flags nhận 'ok', không nhận '__proto__'
    const flags: Flags = {};
    new DialogueRunner(tree, flags).choose(0);
    expect(flags).toEqual({ ok: true });
    expect(Object.getPrototypeOf(flags)).toBe(Object.prototype);
  });

  it("vòng lặp mồ côi (không tới được từ start) chỉ cảnh báo, không chặn", () => {
    const t = goodTree();
    t.nodes.push({ id: "v1", speaker: "narration", lines: ["1"], next: "v2" }, { id: "v2", speaker: "narration", lines: ["2"], next: "v1" });
    const warns: string[] = [];
    expect(() => run(t, { ...opts, onWarn: (m) => warns.push(m) })).not.toThrow();
    expect(warns.join("\n")).toMatch(/v1/);
    expect(warns.join("\n")).toMatch(/v2/);
  });

  it("vòng lặp mà MỌI lối thoát đều chỉ mở bằng lựa chọn có điều kiện (fallbackGoto vắng) vẫn qua loader (đã có 'end' tĩnh) — engine vẫn không kẹt", () => {
    // choices[0] có condition, choices[1] cũng; cả hai ẩn → engine đi `end` (không kẹt) dù loader thấy cạnh tĩnh.
    const t = DialogueSchema.parse({
      id: "an-het",
      nodes: [
        {
          id: "goc",
          speaker: "narration",
          lines: ["x"],
          choices: [
            { label: "A", condition: { flag: "a" }, goto: "goc2" },
            { label: "B", condition: { flag: "b" }, goto: "end" },
          ],
        },
        { id: "goc2", speaker: "narration", lines: ["y"], next: "goc" },
      ],
    });
    expect(() => run(t)).not.toThrow();
    const r = new DialogueRunner(t, {});
    expect(r.choices).toEqual([]);
    r.advance();
    expect(r.done).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------------------------
const tree = (): Dialogue =>
  DialogueSchema.parse({
    id: "thu-nghiem",
    nodes: [
      {
        id: "goc",
        speaker: "huy",
        lines: ["Cậu nghĩ sao?"],
        choices: [
          { label: "Nhận thay", isAction: true, effects: { setFlags: { "da-nhan": true } }, goto: "sau" },
          { label: "Im lặng", effects: { setFlags: { "da-im": true } }, goto: "sau" },
        ],
      },
      {
        id: "sau",
        speaker: "huy",
        lines: ["Rồi sao?"],
        choices: [
          { label: "Cảm ơn (chỉ khi đã nhận)", condition: { flag: "da-nhan" }, goto: "end" },
          { label: "Xin lỗi (chỉ khi đã im)", condition: { flag: "da-im" }, goto: "end" },
          { label: "Đi", goto: "end" },
        ],
      },
    ],
  });

describe("evalCondition — lồng sâu (QA)", () => {
  it("chuỗi `not` lồng 200 tầng: chẵn → giữ nguyên, lẻ → đảo", () => {
    const nest = (n: number, leaf: Condition): Condition => (n === 0 ? leaf : { not: nest(n - 1, leaf) });
    expect(evalCondition(nest(200, { flag: "a" }), { a: true })).toBe(true);
    expect(evalCondition(nest(201, { flag: "a" }), { a: true })).toBe(false);
    expect(evalCondition(nest(201, { flag: "a" }), {})).toBe(true);
  });

  it("allOf/anyOf/not trộn 4 tầng", () => {
    // allOf[ anyOf[ not(a), allOf[b, not(c)] ], d ]
    const cond: Condition = { allOf: [{ anyOf: [{ not: { flag: "a" } }, { allOf: [{ flag: "b" }, { not: { flag: "c" } }] }] }, { flag: "d" }] };
    expect(evalCondition(cond, { d: true })).toBe(true); // not a = true
    expect(evalCondition(cond, { a: true, d: true })).toBe(false); // nhánh trái sai, phải thiếu b
    expect(evalCondition(cond, { a: true, b: true, d: true })).toBe(true);
    expect(evalCondition(cond, { a: true, b: true, c: true, d: true })).toBe(false);
    expect(evalCondition(cond, { b: true })).toBe(false); // thiếu d
  });

  it("relationship nằm trong allOf/anyOf/not: coi như thỏa (chưa đánh giá) nhưng không phá phần còn lại", () => {
    const rel: Condition = { relationship: { npc: "huy", trust: 50 } };
    expect(evalCondition({ allOf: [rel, { flag: "a" }] }, {})).toBe(false);
    expect(evalCondition({ allOf: [rel, { flag: "a" }] }, { a: true })).toBe(true);
    expect(evalCondition({ not: rel }, {})).toBe(false); // not(true)
  });

  it("flag trùng tên thuộc tính Object.prototype ('constructor', 'toString', 'valueOf') không bao giờ coi là bật", () => {
    for (const name of ["constructor", "toString", "valueOf", "hasOwnProperty"]) {
      expect(evalCondition({ flag: name }, {}), name).toBe(false);
    }
    // và khi flags đến từ deserialize
    const flags = deserialize(serialize(createInitialState())).flags;
    expect(evalCondition({ flag: "constructor" }, flags)).toBe(false);
  });

  it("flag chỉ coi là bật khi ĐÚNG true (flag false hoặc thiếu thì tắt)", () => {
    expect(evalCondition({ flag: "a" }, { a: false })).toBe(false);
    expect(evalCondition({ not: { flag: "a" } }, { a: false })).toBe(true);
  });
});

describe("applyEffects — không làm bẩn đối tượng gốc (QA)", () => {
  it("không sửa flags đầu vào, không sửa đối tượng effects/setFlags, kết quả không dùng chung tham chiếu", () => {
    const flags: Flags = Object.freeze({ a: true }) as Flags;
    const setFlags = Object.freeze({ b: true, a: false });
    const effects = Object.freeze({ setFlags });
    const out = applyEffects(flags, effects);
    expect(out).toEqual({ a: false, b: true });
    expect(flags).toEqual({ a: true });
    expect(setFlags).toEqual({ b: true, a: false });
    out.zzz = true; // sửa kết quả không ảnh hưởng nguồn
    expect(flags).not.toHaveProperty("zzz");
    expect(setFlags).not.toHaveProperty("zzz");
  });

  it("effects rỗng/setFlags rỗng → bản sao bằng nhau nhưng KHÔNG cùng tham chiếu", () => {
    const f: Flags = { a: true };
    expect(applyEffects(f, {})).toEqual(f);
    expect(applyEffects(f, {})).not.toBe(f);
    expect(applyEffects(f, { setFlags: {} })).not.toBe(f);
  });

  it("áp tuần tự hai hiệu ứng: hiệu ứng sau ghi đè hiệu ứng trước", () => {
    const f1 = applyEffects({}, { setFlags: { a: true } });
    const f2 = applyEffects(f1, { setFlags: { a: false } });
    expect(f1).toEqual({ a: true });
    expect(f2).toEqual({ a: false });
  });
});

describe("DialogueRunner — chỉ số sai, flags dùng chung, không đổi dữ liệu cây (QA)", () => {
  it("choose với chỉ số ngoài khoảng/không nguyên KHÔNG đổi flag và KHÔNG đổi node", () => {
    for (const bad of [-1, 2, 99, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const flags: Flags = {};
      const r = new DialogueRunner(tree(), flags);
      expect(() => r.choose(bad), `index ${String(bad)}`).toThrow(/cần chọn/);
      expect(flags).toEqual({});
      expect(r.node?.id).toBe("goc");
    }
  });

  it("nextNodeId: chỉ số NaN/thiếu ném lỗi rõ", () => {
    const t = tree();
    expect(() => nextNodeId(t.nodes[0], {}, Number.NaN)).toThrow(/cần chọn/);
    expect(() => nextNodeId(t.nodes[0], {}, 0.5)).toThrow(/cần chọn/);
  });

  it("hai runner dùng CHUNG một đối tượng flags: hiệu ứng của runner này lộ ra ở runner kia (đúng ý state.flags sống)", () => {
    const shared: Flags = {};
    const a = new DialogueRunner(tree(), shared);
    const b = new DialogueRunner(tree(), shared);
    a.choose(0); // bật da-nhan
    expect(shared).toEqual({ "da-nhan": true });
    b.choose(1); // b chọn 'Im lặng' → bật da-im, cùng đối tượng
    expect(shared).toEqual({ "da-nhan": true, "da-im": true });
    // Cả hai flag bật → ở node 'sau' cả hai runner thấy đủ 3 lựa chọn
    expect(a.choices.map((c) => c.label)).toHaveLength(3);
    expect(b.choices.map((c) => c.label)).toHaveLength(3);
  });

  it("hai runner với flags RIÊNG không ảnh hưởng nhau", () => {
    const fa: Flags = {};
    const fb: Flags = {};
    const a = new DialogueRunner(tree(), fa);
    const b = new DialogueRunner(tree(), fb);
    a.choose(0);
    expect(fb).toEqual({});
    expect(b.node?.id).toBe("goc");
    expect(a.choices.map((c) => c.label)).toEqual(["Cảm ơn (chỉ khi đã nhận)", "Đi"]);
    b.choose(1);
    expect(b.choices.map((c) => c.label)).toEqual(["Xin lỗi (chỉ khi đã im)", "Đi"]);
  });

  it("flag đặt ở node trước làm lộ/ẩn lựa chọn ở node sau, chỉ số chọn tính trên danh sách đã lọc", () => {
    const flags: Flags = {};
    const r = new DialogueRunner(tree(), flags);
    r.choose(1); // Im lặng
    // 'Cảm ơn' ẩn; 'Xin lỗi' đang ở chỉ số 0
    expect(r.choices.map((c) => c.label)).toEqual(["Xin lỗi (chỉ khi đã im)", "Đi"]);
    r.choose(0);
    expect(r.done).toBe(true);
  });

  it("chạy xong KHÔNG làm đổi cây thoại (cây đóng băng sâu vẫn chạy được, không ném)", () => {
    const deepFreeze = <T>(o: T): T => {
      if (o && typeof o === "object") {
        Object.values(o as object).forEach(deepFreeze);
        Object.freeze(o);
      }
      return o;
    };
    const t = deepFreeze(tree());
    const snapshot = JSON.stringify(t);
    const flags: Flags = {};
    const r = new DialogueRunner(t, flags);
    r.choose(0);
    r.choose(0);
    expect(r.done).toBe(true);
    expect(JSON.stringify(t)).toBe(snapshot);
  });

  it("choose đặt flag về false (tắt) được và ghi false chứ không xóa khóa", () => {
    const t = DialogueSchema.parse({
      id: "tat",
      nodes: [{ id: "a", speaker: "narration", lines: ["x"], choices: [{ label: "Tắt", effects: { setFlags: { x: false } }, goto: "end" }] }],
    });
    const flags: Flags = { x: true };
    new DialogueRunner(t, flags).choose(0);
    expect(flags).toEqual({ x: false });
    expect(Object.prototype.hasOwnProperty.call(flags, "x")).toBe(true);
  });

  it("visibleChoices trả về phần tử gốc của cây (không sao chép) và giữ thứ tự khai báo", () => {
    const t = tree();
    const v = visibleChoices(t.nodes[1], { "da-nhan": true, "da-im": true });
    expect(v).toHaveLength(3);
    expect(v[0]).toBe(t.nodes[1].choices![0]);
    expect(v[2]).toBe(t.nodes[1].choices![2]);
  });

  it("đóng lại rồi mở lại cây thoại với cùng flags: runner mới bắt đầu từ đầu, flags cũ còn nguyên", () => {
    const flags: Flags = {};
    const t = tree();
    new DialogueRunner(t, flags).choose(0);
    const r2 = new DialogueRunner(t, flags);
    expect(r2.node?.id).toBe("goc");
    expect(flags).toEqual({ "da-nhan": true });
  });
});

// ---------------------------------------------------------------------------------------------
// Dữ liệu thật: giới hạn độ dài chữ (hộp thoại ~304px, font 12px VT323, ~3 dòng)
// ---------------------------------------------------------------------------------------------
describe("dữ liệu hội thoại thật — giới hạn độ dài chữ (QA)", () => {
  const MAX_LABEL = 34; // nhãn lựa chọn 1 dòng (cộng tiền tố '▶ » ')
  const MAX_PAGE = 100; // một trang `lines` ≤ ~3 dòng
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const content = loadContent();
  warn.mockRestore();

  const over: string[] = [];
  const overPages: string[] = [];
  for (const t of content.dialogues.values()) {
    for (const n of t.nodes) {
      n.lines.forEach((l, i) => {
        const len = [...l].length;
        if (len > MAX_PAGE) overPages.push(`${t.id}/${n.id}/lines[${i}]: ${len} ký tự`);
      });
      n.choices?.forEach((c, j) => {
        const len = [...c.label].length;
        if (len > MAX_LABEL) over.push(`${t.id}/${n.id}/choices[${j}]: ${len} ký tự — "${c.label}"`);
      });
    }
  }

  it(`mọi nhãn lựa chọn ≤ ${MAX_LABEL} ký tự`, () => {
    expect(over, over.join("\n")).toEqual([]);
  });

  it(`mọi trang \`lines\` ≤ ${MAX_PAGE} ký tự`, () => {
    expect(overPages, overPages.join("\n")).toEqual([]);
  });

  it("nạp toàn bộ dữ liệu thật KHÔNG sinh cảnh báo node mồ côi", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    loadContent();
    const msgs = spy.mock.calls.map((c) => String(c[0]));
    spy.mockRestore();
    expect(msgs.filter((m) => /không có đường tới được/.test(m))).toEqual([]);
  });

  it("mọi speaker trong dữ liệu thật là 'narration' hoặc NPC có tên hiển thị", () => {
    for (const t of content.dialogues.values()) {
      for (const n of t.nodes) {
        if (n.speaker === "narration") continue;
        const npc = content.npcs.get(n.speaker);
        expect(npc, `${t.id}/${n.id} speaker ${n.speaker}`).toBeDefined();
        expect(npc!.name.trim(), `${t.id}/${n.id}`).not.toBe("");
      }
    }
  });

  it("mọi flag đặt/đọc trong dữ liệu thật theo dạng tên đã quy ước; mọi flag được ĐỌC đều có nơi ĐẶT (không điều kiện chết)", () => {
    const set = new Set<string>();
    const read = new Set<string>();
    const collect = (c: Condition): void => {
      if ("flag" in c) read.add(c.flag);
      else if ("allOf" in c) c.allOf.forEach(collect);
      else if ("anyOf" in c) c.anyOf.forEach(collect);
      else if ("not" in c) collect(c.not);
    };
    for (const t of content.dialogues.values()) {
      for (const n of t.nodes) {
        for (const ch of n.choices ?? []) {
          Object.keys(ch.effects?.setFlags ?? {}).forEach((f) => set.add(f));
          if (ch.condition) collect(ch.condition);
        }
      }
    }
    const dead = [...read].filter((f) => !set.has(f));
    expect(dead, `flag được đọc nhưng không cây nào đặt: ${dead.join(", ")}`).toEqual([]);
  });
});
