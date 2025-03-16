import "./index.css";
import { Card } from "./Card";

const root = document.getElementById("root")!;
root.className = "bg-gray-100 w-screen h-screen";

type ToolType = "pointer" | "card";

const cards: Card[] = [];

let selectedTool: ToolType = "pointer";

let activeCard: Card | null = null;
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

const setTool = (tool: ToolType) => {
  selectedTool = tool;

  if (tool === "card") {
    setSelectedCard(null);
    document.body.classList.add("cursor-crosshair");
  } else {
    document.body.classList.remove("cursor-crosshair");
  }
};

const onKeyPress = (event: KeyboardEvent) => {
  if (event.code === "KeyC") {
    setTool("card");
  }
};

const onPointerDown = (event: PointerEvent, card?: Card) => {
  if (event.isPrimary === false) return;

  if (selectedTool === "card") {
    if (activeCard) {
      activeCard.isSelected = false;
      activeCard.reconcile();
    }

    // todo: handle pointer down on card

    const card = new Card({
      x: event.clientX,
      y: event.clientY,
      width: 0,
      height: 0,
    });

    card.on("pointerdown", onPointerDown);
    card.on("click", onCardClick);
    card.mount(root);
    cards.push(card);
    activeCard = card;
  }
};

const onCardClick = (event: MouseEvent, card: Card) => {
  console.log("card clicked", card);
  if (selectedTool === "pointer") {
    setSelectedCard(card);
  }
};

const onPointerMove = (event: PointerEvent) => {
  if (event.isPrimary === false) return;

  if (selectedTool === "card" && activeCard) {
    activeCard.width = event.clientX - activeCard.x;
    activeCard.height = event.clientY - activeCard.y;
    activeCard.reconcile();
  }
};

const onPointerUp = (event: PointerEvent) => {
  if (event.isPrimary === false) return;

  if (selectedTool === "card" && activeCard) {
    setSelectedCard(activeCard);
    activeCard = null;
    setTool("pointer");
  }
};

window.addEventListener("keypress", onKeyPress);
root.addEventListener("pointerdown", onPointerDown);
root.addEventListener("pointermove", onPointerMove);
root.addEventListener("pointerup", onPointerUp);
