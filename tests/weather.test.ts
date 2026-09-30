import { describe, expect, it } from "vitest";
import weatherJson from "../data/weather.json";
import { validateWeather } from "../src/data/loader";
import { weatherOfDay } from "../src/core/weather";

describe("weather.json + weatherOfDay", () => {
  const table = validateWeather(structuredClone(weatherJson), { maxDay: 6 }).weather;

  it("Ngày 5 mưa", () => {
    expect(weatherOfDay(table, 5)).toBe("rainy");
  });

  it("các ngày 1,2,3,4,6 nắng", () => {
    for (const d of [1, 2, 3, 4, 6]) expect(weatherOfDay(table, d), `ngày ${d}`).toBe("sunny");
  });

  it("ngày thiếu trong bảng mặc định nắng", () => {
    expect(weatherOfDay(table, 99)).toBe("sunny");
    expect(weatherOfDay({}, 5)).toBe("sunny");
  });

  it("giá trị sai ('bão') bị loader từ chối", () => {
    expect(() => validateWeather({ weather: { "1": "bão" } })).toThrow();
  });
});
