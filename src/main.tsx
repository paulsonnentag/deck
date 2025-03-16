import "./index.css";
import { Card } from "./Card";

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

    card.x = event.clientX - offset.x;
    card.y = event.clientY - offset.y;
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

const card1 = new Card({
  x: 100,
  y: 100,
  width: 100,
  height: 100,
});

card1.on("pointerdown", onPointerDown);

const card2 = new Card({
  x: 10,
  y: 10,
  width: 10,
  height: 10,
});

card2.on("pointerdown", onPointerDown);

card1.mount(root);

card1.addChild(card2);
