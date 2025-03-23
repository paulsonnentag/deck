import EventEmitter from "eventemitter3";
import { useState } from "react";
import { v4 as uuid } from "uuid";

export type CardEvent = {
  childAdded: (child: Card) => void;
  childRemoved: (child: Card) => void;
  changed: () => void;
  destroyed: () => void;
};

export type Card = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parent: Card | null;
  children: Card[];
  getOffset: () => { x: number; y: number };
  getGlobalPosition: () => { x: number; y: number };
  setGlobalPosition: ({ x, y }: { x: number; y: number }) => void;
  addChild: (child: Card) => void;
  removeChild: (child: Card) => void;
  isEqualTo: (other: Card) => boolean;
  changed: () => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
  destroy: () => void;
  copy: () => Card;
  _eventEmitter: EventEmitter<CardEvent>;
  _onPrototypeChildAdded: (child: Card) => void;
  _onPrototypeChildRemoved: (child: Card) => void;
  _onPrototypeChanged: () => void;
};

export const Card = Object.create({
  id: uuid(),
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  parent: null,
  children: [],

  _eventEmitter: new EventEmitter<CardEvent>(),

  getOffset() {
    if (this.parent) {
      const parentOffset = this.parent.getOffset();

      return {
        x: this.x + parentOffset.x,
        y: this.y + parentOffset.y,
      };
    }

    return { x: this.x, y: this.y };
  },

  getGlobalPosition() {
    if (this.parent) {
      const parentGlobalPosition = this.parent.getGlobalPosition();

      return {
        x: this.x + parentGlobalPosition.x,
        y: this.y + parentGlobalPosition.y,
      };
    }
    return { x: this.x, y: this.y };
  },

  setGlobalPosition({ x, y }: { x: number; y: number }) {
    const offset = this.parent?.getOffset() ?? { x: 0, y: 0 };

    this.x = x - offset.x;
    this.y = y - offset.y;
    this.changed();
  },

  addChild(child: Card) {
    this.children.push(child);

    console.log("add child", child, this);

    child.parent = this;

    child.on("destroyed", () => {
      this.removeChild(child);
    });

    this._eventEmitter.emit("childAdded", child);
  },

  removeChild(child: Card) {
    this.children = this.children.filter((c) => !c.isEqualTo(child));
    this._eventEmitter.emit("childRemoved", child);
  },

  changed() {
    this._eventEmitter.emit("changed");
  },

  on<K extends keyof CardEvent>(event: K, handler: CardEvent[K]) {
    this._eventEmitter.on(event, handler as any);
  },

  off<K extends keyof CardEvent>(event: K, handler: CardEvent[K]) {
    this._eventEmitter.off(event, handler as any);
  },

  destroy() {
    this._eventEmitter.emit("destroyed");
    this._eventEmitter.removeAllListeners();

    const prototype = Object.getPrototypeOf(this);
    prototype.off("childAdded", this._onPrototypeChildAdded);
    prototype.off("childRemoved", this._onPrototypeChildRemoved);
    prototype.off("changed", this._onPrototypeChanged);
  },

  _onPrototypeChildAdded(child: Card) {
    const copy = child.copy();

    this.children.push(copy);
    this._eventEmitter.emit("childAdded", copy);
  },

  _onPrototypeChildRemoved(child: Card) {
    this.children = this.children.filter(
      (c) => Object.getPrototypeOf(c).id == child.id
    );
  },

  _onPrototypeChanged() {
    this._eventEmitter.emit("changed");
  },

  isEqualTo(other: Card) {
    if (this.id === other.id) {
      return true;
    }

    const prototype = Object.getPrototypeOf(this);

    if (prototype.isEqualTo) {
      return prototype.isEqualTo(other);
    }

    return false;
  },

  copy() {
    const obj: Card = Object.create(this);

    obj.id = uuid();
    obj.children = this.children.map((child) => child.copy());

    this.on("childAdded", (child) => {
      obj.addChild(child.copy());
    });

    this.on("childRemoved", (child) => {
      obj.removeChild(child);
    });

    obj._eventEmitter = new EventEmitter();

    obj._onPrototypeChanged = obj._onPrototypeChanged.bind(obj);
    obj._onPrototypeChildAdded = obj._onPrototypeChildAdded.bind(obj);
    obj._onPrototypeChildRemoved = obj._onPrototypeChildRemoved.bind(obj);

    return obj;
  },
} as Card);
