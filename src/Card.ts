import { v4 as uuid } from "uuid";
import { EventEmitter } from "eventemitter3";

type CardEvents = {
  pointerdown: (event: PointerEvent, card: Card) => void;
  click: (event: MouseEvent, card: Card) => void;
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
  element: HTMLElement;

  children: Card[] = [];

  constructor(config: CardConfig) {
    super();
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.width = config.width ?? 100;
    this.height = config.height ?? 100;
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onClick = this.onClick.bind(this);

    this.element = document.createElement("div")!;
    this.element.addEventListener("pointerdown", this.onPointerDown);
    this.element.addEventListener("click", this.onClick);
    this.reconcile();
  }

  onPointerDown(event: PointerEvent) {
    event.stopPropagation();
    this.emit("pointerdown", event, this);
  }

  onClick(event: MouseEvent) {
    event.stopPropagation();
    this.emit("click", event, this);
  }

  mount(container: HTMLElement) {
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }

    container.appendChild(this.element);

    Object.values(this.children).forEach((child) => {
      child.mount(this.element!);
    });
  }

  destroy() {
    this.children.forEach((child) => {
      child.destroy();
    });

    this.element.removeEventListener("pointerdown", this.onPointerDown);
    this.element.remove();
  }

  reconcile() {
    this.element.className = `absolute border bg-white ${
      this.isSelected ? "border-blue-500 z-10" : "border-gray-300"
    }`;
    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;
    this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
  }
}
