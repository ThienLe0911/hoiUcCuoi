import { describe, expect, it } from "vitest";
import npcsJson from "../data/npcs.json";
import { validateNpcs } from "../src/data/loader";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const real = (): any => structuredClone(npcsJson);

describe("npcs.json", () => {
  it("dữ liệu thật nạp thành công", () => {
    const data = validateNpcs(real());
    expect(data.npcs.length).toBeGreaterThan(5);
  });

  it("có đủ 5 NPC chính", () => {
    const data = validateNpcs(real());
    const main = data.npcs.filter((n) => n.kind === "main").map((n) => n.id);
    expect(main.sort()).toEqual(["huy", "kiet", "ngan-trinh", "nguyen", "thu"]);
  });

  it("id không trùng", () => {
    const data = validateNpcs(real());
    const ids = data.npcs.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("mọi NPC tương tác được đều có câu thoại không rỗng", () => {
    const data = validateNpcs(real());
    for (const n of data.npcs.filter((x) => x.interactable)) {
      expect(n.line.trim(), `${n.id} thiếu line`).not.toBe("");
    }
  });

  it("thiếu trường bị bắt, nêu đúng đường dẫn", () => {
    const d = real();
    delete d.npcs[0].name;
    expect(() => validateNpcs(d)).toThrow(/npcs\.0\.name/);
  });
});
