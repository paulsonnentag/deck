import { describe, expect, test } from "vitest";
import { $Object, $Set } from "./core";

describe("object", () => {
  describe("basics", () => {
    test("create object", () => {
      const obj = new $Object({ x: 10, y: 20 });

      expect(obj.get("x")).toBe(10);
      expect(obj.get("y")).toBe(20);
    });

    test("create a copy of an object", () => {
      const original = new $Object({ x: 10, y: 20 });
      const copy = original.copy();

      expect(copy.get("x")).toBe(10);
      expect(copy.get("y")).toBe(20);

      // modifying the original object should not affect the copy
      original.set("x", 100);
      expect(original.get("x")).toBe(100);
      expect(copy.get("x")).toBe(10);

      // modifying the copy should not affect the original object
      copy.set("y", 200);
      expect(original.get("y")).toBe(20);
      expect(copy.get("y")).toBe(200);

      // modifying the prototype should affect all copies
      copy.prototype.set("z", 30);
      expect(original.get("z")).toBe(30);
      expect(copy.get("z")).toBe(30);
    });
  });

  describe("sets", () => {
    test("create a copy of an objec with a set value", () => {
      const original = new $Object({ items: new $Set([1, 2, 3]) });
      const copy = original.copy();

      expect(original.get("items").value()).toEqual(new Set([1, 2, 3]));
      expect(copy.get("items").value()).toEqual(new Set([1, 2, 3]));

      // modifying the set in the original item should not affect the copy
      original.get("items").add(4);
      expect(original.get("items").value()).toEqual(new Set([1, 2, 3, 4]));
      expect(copy.get("items").value()).toEqual(new Set([1, 2, 3]));

      // modifying the copy should not affect the original object
      copy.get("items").add(5);
      expect(original.get("items").value()).toEqual(new Set([1, 2, 3, 4]));
      expect(copy.get("items").value()).toEqual(new Set([1, 2, 3, 5]));

      // modifying the prototype should affect all copies
      copy.prototype.get("items").add(6);
      expect(original.get("items").value()).toEqual(new Set([1, 2, 3, 4, 6]));
      expect(copy.get("items").value()).toEqual(new Set([1, 2, 3, 5, 6]));
    });

    test("create a copy of an object with a set value that contains objects", () => {
      const a = new $Object({ x: 1 });
      const b = new $Object({ x: 2 });

      const original = new $Object({ items: new $Set([a, b]) });
      const copy = original.copy();

      // modifying an object in the original set should not change the copy
      const aInOriginal = Array.from(original.get("items").value())[0];
      aInOriginal.set("x", 10);

      let originalItems = Array.from(original.get("items").value());
      expect(originalItems.length).toEqual(2);
      expect(originalItems[0].get("x")).toEqual(10);
      expect(originalItems[1].get("x")).toEqual(2);

      let copyItems = Array.from(copy.get("items").value());
      expect(copyItems.length).toEqual(2);
      expect(copyItems[0].get("x")).toEqual(1);
      expect(copyItems[1].get("x")).toEqual(2);

      // modifying an object in the copy should not change the original
      const aInCopy = Array.from(copy.get("items").value())[1];
      aInCopy.set("x", 20);

      copyItems = Array.from(copy.get("items").value());
      expect(copyItems.length).toEqual(2);
      expect(copyItems[0].get("x")).toEqual(1);
      expect(copyItems[1].get("x")).toEqual(20);

      originalItems = Array.from(original.get("items").value());
      expect(originalItems.length).toEqual(2);
      expect(originalItems[0].get("x")).toEqual(10);
      expect(originalItems[1].get("x")).toEqual(2);

      // modifying an object in the prototype should affect all copies
      Array.from(copy.prototype.get("items").value())[0].set("y", 100);

      originalItems = Array.from(original.get("items").value());
      expect(originalItems[0].get("y")).toEqual(100);

      copyItems = Array.from(copy.get("items").value());
      expect(copyItems[0].get("y")).toEqual(100);
    });
  });
});
