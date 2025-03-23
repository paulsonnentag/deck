import "./index.css";
import { Card } from "./card";

const root = document.getElementById("root")!;
root.className = "bg-gray-100 w-screen h-screen";

type ToolType = "pointer" | "card";

type CardToolState = {
  type: "card";
  state?: {
    card: Card;
    offset: { x: number; y: number };
  };
};

type PointerToolState = {
  type: "pointer";
  state?: {
    card: Card;
    offset: { x: number; y: number };
  };
};

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

const setTool = (type: ToolType) => {};

const onKeyDown = (event: KeyboardEvent) => {
  console.log(event.code);

  if (event.code === "KeyC") {
    setTool("card");
  } else if (event.code === "Backspace") {
    console.log("delete");

    if (selectedCard) {
      setSelectedCard(null);
      selectedCard.destroy();
    }
  }
};

const onPointerDown = (event: PointerEvent, card?: Card) => {
  if (event.isPrimary === false) return;

  if (toolState.type === "pointer") {
    if (card) {
      const rect = card.cardElement.getBoundingClientRect();

      toolState.state = {
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
    const offset = card ? card.getOffset() : { x: 0, y: 0 };

    const newCard = new Card({
      x: event.clientX - offset.x,
      y: event.clientY - offset.y,
      width: 0,
      height: 0,
    });

    newCard.on("pointerdown", onPointerDown);

    if (card) {
      card.addChild(newCard);
    } else {
      newCard.mount(root);
    }

    toolState.state = {
      card: newCard,
      offset,
    };
  }
};

const onPointerMove = (event: PointerEvent) => {
  if (event.isPrimary === false) return;

  if (toolState.type === "pointer" && toolState.state) {
    const { card, offset } = toolState.state;

    if (card.parent) {
      const parentOffset = card.parent.getOffset();
      card.x = event.clientX - offset.x - parentOffset.x;
      card.y = event.clientY - offset.y - parentOffset.y;
    } else {
      card.x = event.clientX - offset.x;
      card.y = event.clientY - offset.y;
    }

    card.reconcile();
  } else if (toolState.type === "card" && toolState.state) {
    const { card, offset } = toolState.state;

    card.width = event.clientX - card.x - offset.x;
    card.height = event.clientY - card.y - offset.y;
    card.reconcile();
  }
};

const onPointerUp = (event: PointerEvent) => {
  if (event.isPrimary === false) return;

  if (toolState.type === "card" && toolState.state) {
    const { card } = toolState.state;

    setSelectedCard(card);
    setTool("pointer");
  }

  if (toolState.type === "pointer" && toolState.state) {
    toolState.state = undefined;
  }
};

window.addEventListener("keydown", onKeyDown);
root.addEventListener("pointerdown", onPointerDown);
root.addEventListener("pointermove", onPointerMove);
root.addEventListener("pointerup", onPointerUp);
