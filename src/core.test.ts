import { describe, expect, test } from "vitest";
import { Obj } from "./core";

describe("object", () => {
  test("create object", () => {
    const obj = new Obj({ x: 10, y: 20 });

    expect(obj.get("x")).toBe(10);
    expect(obj.get("y")).toBe(20);
  });

  test("create a copy of an object", () => {
    const obj = new Obj({ x: 10, y: 20 });
    const copy = obj.copy();

    expect(copy.get("x")).toBe(10);
    expect(copy.get("y")).toBe(20);

    // modifying the original object should not affect the copy
    obj.set("x", 100);
    expect(obj.get("x")).toBe(100);
    expect(copy.get("x")).toBe(10);

    // modifying the copy should not affect the original object
    copy.set("y", 200);
    expect(obj.get("y")).toBe(20);
    expect(copy.get("y")).toBe(200);

    // modifying the prototype should affect all copies
    copy.prototype!.set("z", 30);
    expect(obj.get("z")).toBe(30);
    expect(copy.get("z")).toBe(30);
  });
});
