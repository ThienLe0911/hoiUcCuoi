import { describe, expect, it } from "vitest";
import { ActionState } from "../src/core/actions";
import { attachKeyboard } from "../src/core/keyboard";

describe("ActionState", () => {
  it("nhấn và nhả", () => {
    const s = new ActionState();
    s.press("up", "KeyW");
    expect(s.isDown("up")).toBe(true);
    expect(s.getMoveDirection()).toBe("up");
    s.release("up", "KeyW");
    expect(s.isDown("up")).toBe(false);
    expect(s.getMoveDirection()).toBeNull();
  });

  it("hai hướng cùng lúc chỉ lấy hướng nhấn sau cùng (không đi chéo)", () => {
    const s = new ActionState();
    s.press("up", "KeyW");
    s.press("right", "KeyD");
    expect(s.getMoveDirection()).toBe("right");
  });

  it("nhả hướng sau thì quay về hướng trước còn giữ", () => {
    const s = new ActionState();
    s.press("up", "KeyW");
    s.press("right", "KeyD");
    s.release("right", "KeyD");
    expect(s.getMoveDirection()).toBe("up");
  });

  it("hai nguồn cùng một hành động", () => {
    const s = new ActionState();
    s.press("left", "KeyA");
    s.press("left", "ArrowLeft");
    s.release("left", "KeyA");
    expect(s.isDown("left")).toBe(true);
    s.release("left", "ArrowLeft");
    expect(s.isDown("left")).toBe(false);
  });

  it("edge-trigger cho interact/menu", () => {
    const s = new ActionState();
    s.press("interact", "KeyE");
    expect(s.consumePressed("interact")).toBe(true);
    expect(s.consumePressed("interact")).toBe(false);
    s.release("interact", "KeyE");
    s.press("interact", "KeyE");
    expect(s.consumePressed("interact")).toBe(true);
  });

  it("reset xóa mọi trạng thái", () => {
    const s = new ActionState();
    s.press("down", "KeyS");
    s.press("interact", "KeyE");
    s.reset();
    expect(s.isDown("down")).toBe(false);
    expect(s.getMoveDirection()).toBeNull();
    expect(s.consumePressed("interact")).toBe(false);
  });
});

describe("attachKeyboard", () => {
  const key = (type: string, code: string, repeat = false) =>
    Object.assign(new Event(type, { cancelable: true }), { code, repeat });

  it("ánh xạ phím, bỏ qua repeat, dispose gỡ listener", () => {
    const target = new EventTarget();
    const s = new ActionState();
    const dispose = attachKeyboard(s, target);

    target.dispatchEvent(key("keydown", "KeyW"));
    expect(s.isDown("up")).toBe(true);
    target.dispatchEvent(key("keydown", "KeyW", true));
    target.dispatchEvent(key("keyup", "KeyW"));
    expect(s.isDown("up")).toBe(false);

    const space = key("keydown", "Space");
    target.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(true);
    expect(s.isDown("interact")).toBe(true);

    target.dispatchEvent(new Event("blur"));
    expect(s.isDown("interact")).toBe(false);

    dispose();
    target.dispatchEvent(key("keydown", "KeyA"));
    expect(s.isDown("left")).toBe(false);
  });
});
