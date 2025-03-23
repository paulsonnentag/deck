import { Card } from "./card";
import { CardSelection, CardView } from "./CardView";

class Editor {
  selection: CardSelection = new CardSelection();

  toolState: ToolState = {
    type: "pointer",
  };

  constructor(readonly rootElement: HTMLDivElement) {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    this.rootElement.addEventListener("keydown", this.onKeyDown);
    this.rootElement.addEventListener("pointerdown", this.onPointerDown);
    this.rootElement.addEventListener("pointermove", this.onPointerMove);
    this.rootElement.addEventListener("pointerup", this.onPointerUp);
  }

  setTool(type: ToolType) {
    document.body.classList.remove("cursor-crosshair");

    if (type === "pointer") {
      this.toolState = { type: "pointer" };
    } else if (type === "card" && this.toolState.type !== "card") {
      this.selection.selectedCard = null;
      this.toolState = { type: "card" };
      document.body.classList.add("cursor-crosshair");
    }
  }

  onPointerDown(event: PointerEvent, cardView?: CardView) {
    if (event.isPrimary === false) return;

    if (this.toolState.type === "pointer") {
      if (cardView) {
        const rect = cardView.cardElement.getBoundingClientRect();

        this.toolState.state = {
          card: cardView.card,
          offset: {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          },
        };
        this.selection.selectedCard = cardView.card;
      } else {
        this.selection.selectedCard = null;
      }
    } else if (this.toolState.type === "card") {
      // todo: handle offset
      const offset = { x: 0, y: 0 };

      const newCard = new Card({
        x: event.clientX - offset.x,
        y: event.clientY - offset.y,
        width: 0,
        height: 0,
      });

      newCard.on("pointerdown", this.onPointerDown);

      if (cardView) {
        cardView.card.addChild(newCard);
      } else {
        newCard.mount(this.rootElement);
      }

      this.toolState.state = {
        card: newCard,
        offset,
      };
    }
  }

  onPointerMove = (event: PointerEvent) => {
    if (event.isPrimary === false) return;

    if (this.toolState.type === "pointer" && this.toolState.state) {
      const { card, offset } = this.toolState.state;

      // handle card on other card
      // if (card.parent) {
      //   const parentOffset = card.parent.getOffset();
      //   card.x = event.clientX - offset.x - parentOffset.x;
      //   card.y = event.clientY - offset.y - parentOffset.y;
      //

      card.x = event.clientX - offset.x;
      card.y = event.clientY - offset.y;
      card.changed();
    } else if (this.toolState.type === "card" && this.toolState.state) {
      const { card, offset } = this.toolState.state;
      card.width = event.clientX - card.x - offset.x;
      card.height = event.clientY - card.y - offset.y;
      card.changed();
    }
  };

  onPointerUp = (event: PointerEvent) => {
    if (event.isPrimary === false) return;

    if (this.toolState.type === "card" && this.toolState.state) {
      const { card } = this.toolState.state;

      this.selection.selectedCard = card;
      this.setTool("pointer");
    }

    if (this.toolState.type === "pointer" && this.toolState.state) {
      this.toolState.state = undefined;
    }
  };

  onKeyDown = (event: KeyboardEvent) => {
    if (event.code === "KeyC") {
      this.setTool("card");
    } else if (event.code === "Backspace") {
      if (this.selection.selectedCard) {
        this.selection.selectedCard.destroy();
      }
    }
  };
}
