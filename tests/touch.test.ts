import { describe, expect, it } from "vitest";
import { dpadDirection, inCircle, inRect } from "../src/core/touch";

describe("dpadDirection", () => {
  it("vùng chết không cho hướng", () => {
    expect(dpadDirection(2, 3, 8)).toBeNull();
  });
  it("chọn trục lớn hơn, không đi chéo", () => {
    expect(dpadDirection(20, 5, 8)).toBe("right");
    expect(dpadDirection(-20, 5, 8)).toBe("left");
    expect(dpadDirection(5, 20, 8)).toBe("down");
    expect(dpadDirection(5, -20, 8)).toBe("up");
    expect(dpadDirection(15, 14, 8)).toBe("right");
  });
});

describe("vùng chạm", () => {
  it("hình tròn", () => {
    expect(inCircle(10, 10, 10, 10, 5)).toBe(true);
    expect(inCircle(16, 10, 10, 10, 5)).toBe(false);
  });
  it("hình chữ nhật", () => {
    expect(inRect(5, 5, 0, 0, 10, 10)).toBe(true);
    expect(inRect(11, 5, 0, 0, 10, 10)).toBe(false);
  });
});
