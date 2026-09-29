import { describe, expect, it } from "vitest";
import areasJson from "../data/areas.json";
import { validateAreas } from "../src/data/loader";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const real = (): any => structuredClone(areasJson);

describe("areas.json", () => {
  it("dữ liệu thật hợp lệ và có 5 khu vực, sân thượng khóa", () => {
    const data = validateAreas(real(), { fileExists: () => true });
    expect(data.areas.map((a) => a.id)).toEqual([
      "cong-truong",
      "san-chinh",
      "hanh-lang-lop-12",
      "san-the-chat",
      "san-thuong",
    ]);
    expect(data.areas.find((a) => a.id === "san-thuong")?.locked).toBe(true);
  });

  it("đồ thị nối hai chiều nhất quán", () => {
    const data = validateAreas(real());
    for (const a of data.areas) {
      for (const e of a.exits) {
        const back = data.areas.find((x) => x.id === e.toArea)!.exits.some((x) => x.toArea === a.id);
        expect(back, `${a.id} → ${e.toArea} phải có chiều ngược`).toBe(true);
      }
    }
  });

  it("thiếu trường bị bắt, nêu đúng đường dẫn", () => {
    const d = real();
    delete d.areas[1].name;
    expect(() => validateAreas(d)).toThrow(/areas\.1\.name/);
  });

  it("exit trỏ khu vực không tồn tại", () => {
    const d = real();
    d.areas[0].exits[0].toArea = "khong-co";
    expect(() => validateAreas(d)).toThrow(/areas\.0\.exits\.0\.toArea.*khong-co/);
  });

  it("toSpawn không tồn tại", () => {
    const d = real();
    d.areas[0].exits[0].toSpawn = "nowhere";
    expect(() => validateAreas(d)).toThrow(/toSpawn.*nowhere/);
  });

  it("id trùng", () => {
    const d = real();
    d.areas[1].id = "cong-truong";
    expect(() => validateAreas(d)).toThrow(/trùng lặp/);
  });

  it("mapFile không tồn tại", () => {
    expect(() => validateAreas(real(), { fileExists: (f) => f !== "maps/san-chinh.tmj" })).toThrow(
      /areas\.1\.mapFile.*san-chinh\.tmj/,
    );
  });
});
