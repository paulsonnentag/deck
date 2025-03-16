import "./index.css";
import { Card } from "./Card";

const root = document.getElementById("root")!;
root.className = "bg-gray-100 w-screen h-screen";

type ToolType = "pointer" | "card";

let cards: Card[] = [];

type CardToolState = {
  type: "card";
  newCard?: Card;
};

type PointerToolState = {
  type: "pointer";
  dragState?: {
    card: Card;
    offset: { x: number; y: number };
  };
};

type ToolState = CardToolState | PointerToolState;

let toolState: ToolState = { type: "pointer" };

let selectedCard: Card | null = null;

const setSelectedCard = (card: Card | null) => {
  if (selectedCard) {
    selectedCard.isSelected = false;
    selectedCard.reconcile();
  }

  if (card) {
    selectedCard = card;
    card.isSelected = true;
    card.reconcile();
  }
};

const setTool = (type: ToolType) => {
  document.body.classList.remove("cursor-crosshair");

  if (type === "pointer") {
    toolState = { type: "pointer" };
  } else if (type === "card" && toolState.type !== "card") {
    setSelectedCard(null);
    toolState = { type: "card" };
    document.body.classList.add("cursor-crosshair");
  }
};

const onKeyDown = (event: KeyboardEvent) => {
  console.log(event.code);

  if (event.code === "KeyC") {
    setTool("card");
  } else if (event.code === "Backspace") {
    console.log("delete");

    if (selectedCard) {
      setSelectedCard(null);
      selectedCard.destroy();
      cards = cards.filter((card) => card !== selectedCard);
    }
  }
};

const onPointerDown = (event: PointerEvent, card?: Card) => {
  if (event.isPrimary === false) return;

  if (toolState.type === "pointer") {
    if (card) {
      const rect = card.element.getBoundingClientRect();

      toolState.dragState = {
        card,
        offset: {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        },
      };
      setSelectedCard(card);
    } else {
      setSelectedCard(null);
    }
  } else if (toolState.type === "card") {
    // todo: handle pointer down on card
    const card = new Card({
      x: event.clientX,
      y: event.clientY,
      width: 0,
      height: 0,
    });

    card.on("pointerdown", onPointerDown);
    card.mount(root);
    cards.push(card);

    toolState.newCard = card;
  }
};

const onPointerMove = (event: PointerEvent) => {
  if (event.isPrimary === false) return;

  if (toolState.type === "pointer" && toolState.dragState) {
    const { card, offset } = toolState.dragState;

    if (card && offset) {
      card.x = event.clientX - offset.x;
      card.y = event.clientY - offset.y;
      card.reconcile();
    }
  } else if (toolState.type === "card") {
    const { newCard } = toolState;

    if (newCard) {
      newCard.width = event.clientX - newCard.x;
      newCard.height = event.clientY - newCard.y;
      newCard.reconcile();
    }
  }
};

const onPointerUp = (event: PointerEvent) => {
  if (event.isPrimary === false) return;

  if (toolState.type === "card" && toolState.newCard) {
    setSelectedCard(toolState.newCard);
    setTool("pointer");
  }

  if (toolState.type === "pointer" && toolState.dragState) {
    toolState.dragState = undefined;
  }
};

window.addEventListener("keydown", onKeyDown);
root.addEventListener("pointerdown", onPointerDown);
root.addEventListener("pointermove", onPointerMove);
root.addEventListener("pointerup", onPointerUp);
