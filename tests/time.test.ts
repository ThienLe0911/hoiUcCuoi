import { describe, expect, it } from "vitest";
import { GameTime, PERIOD_NAMES } from "../src/core/time";

describe("GameTime", () => {
  it("bắt đầu ở ngày 1, khoảng 0, Thứ Hai", () => {
    const t = new GameTime(6);
    expect(t.day).toBe(1);
    expect(t.period).toBe(0);
    expect(t.weekdayName).toBe("Thứ Hai");
    expect(t.periodName).toBe(PERIOD_NAMES[0]);
  });

  it("đi đúng thứ tự 4 khoảng rồi sang ngày mới", () => {
    const t = new GameTime(6);
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      seen.push(t.periodName);
      t.advancePeriod();
    }
    expect(seen).toEqual([...PERIOD_NAMES]);
    expect(t.day).toBe(2);
    expect(t.period).toBe(0);
    expect(t.weekdayName).toBe("Thứ Ba");
  });

  it("thứ đúng từ ngày 1 đến ngày 6", () => {
    const t = new GameTime(6);
    const days: string[] = [t.weekdayName];
    for (let d = 1; d < 6; d++) {
      for (let i = 0; i < 4; i++) t.advancePeriod();
      days.push(t.weekdayName);
    }
    expect(days).toEqual(["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]);
  });

  it("phát 'time-ended' ở cuối ngày N và không vượt quá N", () => {
    const t = new GameTime(2);
    let ended = 0;
    t.on("time-ended", () => ended++);
    for (let i = 0; i < 20; i++) t.advancePeriod();
    expect(ended).toBe(1);
    expect(t.day).toBe(2);
    expect(t.period).toBe(3);
    expect(t.ended).toBe(true);
  });

  it("phát sự kiện đúng số lần", () => {
    const t = new GameTime(3);
    let periods = 0;
    let days = 0;
    t.on("period-changed", () => periods++);
    t.on("day-changed", () => days++);
    for (let i = 0; i < 8; i++) t.advancePeriod(); // 2 ngày trọn vẹn
    expect(days).toBe(2);
    expect(periods).toBe(8);
  });

  it("restore không phát sự kiện và từ chối giá trị sai", () => {
    const t = new GameTime(6);
    let n = 0;
    t.on("period-changed", () => n++);
    t.restore({ day: 3, period: 2 });
    expect(n).toBe(0);
    expect(t.weekdayName).toBe("Thứ Tư");
    expect(() => t.restore({ day: 9, period: 0 })).toThrow();
    expect(() => t.restore({ day: 1, period: 4 })).toThrow();
  });
});
