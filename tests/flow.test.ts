import { describe, expect, it } from "vitest";
import { advancePeriods } from "../src/core/flow";
import { GameTime } from "../src/core/time";

describe("advancePeriods", () => {
  it("qua một khoảng giữa ngày không báo hết ngày", () => {
    const t = new GameTime(6);
    expect(advancePeriods(t, 1)).toEqual({ dayEnded: null, timeEnded: false });
    expect(t.period).toBe(1);
  });

  it("qua khoảng cuối của ngày báo hết ngày và sang ngày mới", () => {
    const t = new GameTime(6, { day: 1, period: 3 });
    expect(advancePeriods(t, 1)).toEqual({ dayEnded: 1, timeEnded: false });
    expect(t.day).toBe(2);
    expect(t.period).toBe(0);
  });

  it("chạy trọn 6 ngày bằng từng khoảng: hết ngày 1–5 rồi hết thời gian ở ngày 6", () => {
    const t = new GameTime(6);
    const ended: number[] = [];
    let timeEnded = false;
    for (let i = 0; i < 24; i++) {
      const r = advancePeriods(t, 1);
      if (r.dayEnded !== null) ended.push(r.dayEnded);
      if (r.timeEnded) timeEnded = true;
    }
    expect(ended).toEqual([1, 2, 3, 4, 5]);
    expect(timeEnded).toBe(true);
    expect(t.day).toBe(6);
    expect(t.ended).toBe(true);
  });

  it("cost 0 không đổi gì; sau khi hết thời gian không tiến thêm", () => {
    const t = new GameTime(1, { day: 1, period: 3 });
    expect(advancePeriods(t, 0)).toEqual({ dayEnded: null, timeEnded: false });
    expect(advancePeriods(t, 1).timeEnded).toBe(true);
    expect(advancePeriods(t, 1).timeEnded).toBe(true);
    expect(t.day).toBe(1);
  });
});
