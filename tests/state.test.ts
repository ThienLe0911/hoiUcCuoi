import { describe, expect, it } from "vitest";
import { applyTime, createInitialState, deserialize, serialize, timeFromState } from "../src/core/state";
import { GameTime } from "../src/core/time";

describe("GameState", () => {
  it("mặc định: ngày 1, khoảng 0, ở cổng trường, sân thượng khóa", () => {
    const s = createInitialState();
    expect(s.version).toBe(2);
    expect(s.day).toBe(1);
    expect(s.period).toBe(0);
    expect(s.areaId).toBe("cong-truong");
    expect(s.areaLocks["san-thuong"]).toBe(true);
    expect(s.areaLocks["san-chinh"]).toBe(false);
    expect(s.flags).toEqual({});
  });

  it("round-trip JSON giữ nguyên dữ liệu (kể cả flags) và có version", () => {
    const s = createInitialState();
    s.day = 4;
    s.period = 2;
    s.position = { x: 5.5, y: 7 };
    s.flags = { "ngay3.nhan-thay": true, "ngay3.im-lang": false };
    const json = serialize(s);
    expect(JSON.parse(json).version).toBe(2);
    expect(deserialize(json)).toEqual(s);
  });

  it("nâng cấp save v1 (chưa có flags) lên v2 với flags rỗng, không mất dữ liệu cũ", () => {
    const { flags: _flags, ...rest } = createInitialState();
    const v1 = { ...rest, version: 1, day: 3, period: 1, areaId: "san-chinh" };
    const up = deserialize(JSON.stringify(v1));
    expect(up.version).toBe(2);
    expect(up.flags).toEqual({});
    expect(up.day).toBe(3);
    expect(up.period).toBe(1);
    expect(up.areaId).toBe("san-chinh");
    expect(up.areaLocks["san-thuong"]).toBe(true);
  });

  it("từ chối phiên bản mới hơn 2 hoặc cũ hơn 1", () => {
    const s = createInitialState();
    expect(() => deserialize(JSON.stringify({ ...s, version: 3 }))).toThrow(/Phiên bản.*3/);
    expect(() => deserialize(JSON.stringify({ ...s, version: 0 }))).toThrow(/Phiên bản/);
  });

  it("v2 phải có flags hợp lệ", () => {
    const s = createInitialState();
    const { flags: _f, ...noFlags } = s;
    expect(() => deserialize(JSON.stringify(noFlags))).toThrow(/flags/);
    expect(() => deserialize(JSON.stringify({ ...s, flags: { a: "yes" } }))).toThrow(/flags/);
    expect(() => deserialize(JSON.stringify({ ...s, flags: [true] }))).toThrow(/flags/);
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
