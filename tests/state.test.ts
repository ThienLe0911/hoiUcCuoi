import { describe, expect, it } from "vitest";
import { applyTime, createInitialState, deserialize, serialize, timeFromState } from "../src/core/state";
import { GameTime } from "../src/core/time";

describe("GameState", () => {
  it("mặc định: ngày 1, khoảng 0, ở cổng trường, sân thượng khóa", () => {
    const s = createInitialState();
    expect(s.version).toBe(1);
    expect(s.day).toBe(1);
    expect(s.period).toBe(0);
    expect(s.areaId).toBe("cong-truong");
    expect(s.areaLocks["san-thuong"]).toBe(true);
    expect(s.areaLocks["san-chinh"]).toBe(false);
  });

  it("round-trip JSON giữ nguyên dữ liệu và có version", () => {
    const s = createInitialState();
    s.day = 4;
    s.period = 2;
    s.position = { x: 5.5, y: 7 };
    const json = serialize(s);
    expect(JSON.parse(json).version).toBe(1);
    expect(deserialize(json)).toEqual(s);
  });

  it("từ chối JSON hỏng hoặc thiếu version", () => {
    expect(() => deserialize("{oops")).toThrow(/JSON/);
    expect(() => deserialize(JSON.stringify({ day: 1 }))).toThrow(/Phiên bản/);
    const bad = { ...createInitialState(), period: 9 };
    expect(() => deserialize(JSON.stringify(bad))).toThrow(/period/);
  });

  it("nhất quán với đồng hồ", () => {
    const t = new GameTime(6);
    for (let i = 0; i < 6; i++) t.advancePeriod();
    const s = applyTime(createInitialState(), t);
    expect(s.day).toBe(2);
    expect(s.period).toBe(2);
    const t2 = timeFromState(s, 6);
    expect(t2.day).toBe(2);
    expect(t2.period).toBe(2);
  });
});
