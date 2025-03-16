import { v4 as uuid } from "uuid";
import { EventEmitter } from "eventemitter3";

type CardEvents = {
  pointerdown: (event: PointerEvent, card: Card) => void;
};

type CardConfig = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export class Card extends EventEmitter<CardEvents> {
  id: string = uuid();

  x: number;
  y: number;
  width: number;
  height: number;

  isSelected: boolean = false;
  cardElement: HTMLElement;
  childrenContainer: HTMLElement;

  children: Card[] = [];

  constructor(config: CardConfig) {
    super();
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.width = config.width ?? 100;
    this.height = config.height ?? 100;
    this.onPointerDown = this.onPointerDown.bind(this);
    this.cardElement = document.createElement("div");
    this.childrenContainer = document.createElement("div");
    this.cardElement.appendChild(this.childrenContainer);

    this.cardElement.addEventListener("pointerdown", this.onPointerDown);
    this.reconcile();
  }

  getOffset() {
    // Get the position of this element relative to the screen
    const rect = this.cardElement.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
    };
  }

  onPointerDown(event: PointerEvent) {
    event.stopPropagation();
    this.emit("pointerdown", event, this);
  }

  mount(container: HTMLElement) {
    if (this.cardElement.parentElement) {
      this.cardElement.parentElement.removeChild(this.cardElement);
    }

    container.appendChild(this.cardElement);

    Object.values(this.children).forEach((child) => {
      child.mount(this.cardElement!);
    });
  }

  destroy() {
    this.children.forEach((child) => {
      child.destroy();
    });

    this.cardElement.removeEventListener("pointerdown", this.onPointerDown);
    this.cardElement.remove();
  }

  reconcile() {
    this.cardElement.className = `absolute border bg-white ${
      this.isSelected ? "border-blue-500 z-10" : "border-gray-300"
    }`;
    this.cardElement.style.width = `${this.width}px`;
    this.cardElement.style.height = `${this.height}px`;
    this.cardElement.style.transform = `translate(${this.x}px, ${this.y}px)`;
  }

  addChild(child: Card) {
    this.children.push(child);
    child.mount(this.childrenContainer);
  }
}
