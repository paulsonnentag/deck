import { Card } from "./card";
import { PointerEvent, useCallback, useState, useEffect } from "react";
import { CardView } from "./CardView";

type CardToolState = {
  type: "card";
  state?: {
    card: Card;
  };
};

type PointerToolState = {
  type: "pointer";
  state?: {
    card: Card;
    dragPositionOffset: {
      x: number;
      y: number;
    };
  };
};

type ToolState = CardToolState | PointerToolState;

type EditorProps = {
  rootCard: Card;
};

export const Editor = ({ rootCard }: EditorProps) => {
  const [tool, setTool] = useState<ToolState>({ type: "pointer" });
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      console.log("key down", event.code);

      if (event.code === "KeyC" || event.code === "KeyR") {
        setTool({ type: "card" });
      } else if (event.code === "Backspace") {
        if (selectedCard) {
          setSelectedCard(null);
          selectedCard.destroy();
        }
      }
    },
    [selectedCard]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>, card: Card) => {
      if (event.isPrimary === false) return;

      if (tool.type === "card") {
        const newCard = Card.copy();
        newCard.x = event.clientX;
        newCard.y = event.clientY;
        newCard.width = 0;
        newCard.height = 0;

        tool.state = {
          card: newCard,
        };

        rootCard.addChild(newCard);
      } else if (tool.type === "pointer") {
        if (card === rootCard) {
          setSelectedCard(null);
        } else {
          console.log("select card", card);
          setSelectedCard(card);

          const dragPositionOffset = {
            x: event.clientX - card.x,
            y: event.clientY - card.y,
          };

          setTool({
            type: "pointer",
            state: { card, dragPositionOffset },
          });
        }
      }
    },
    [tool, rootCard]
  );

  console.log("selectedCard", selectedCard);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.isPrimary === false) return;

      if (tool.type === "card" && tool.state?.card) {
        const { card } = tool.state;
        card.width = event.clientX - card.x;
        card.height = event.clientY - card.y;
        card.changed();
      } else if (tool.type === "pointer" && tool.state?.card) {
        const { card } = tool.state;

        card.x = event.clientX - tool.state.dragPositionOffset.x;
        card.y = event.clientY - tool.state.dragPositionOffset.y;
        card.changed();
      }
    },
    [tool]
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.isPrimary === false) return;

      if (tool.type === "card" && tool.state?.card) {
        setTool({ type: "pointer" });
        setSelectedCard(tool.state.card);
      } else if (tool.type === "pointer" && tool.state?.card) {
        setTool({ type: "pointer" });
      }
    },
    [tool]
  );

  return (
    <div
      className={`w-screen h-screen ${
        tool.type === "card" ? "cursor-crosshair" : ""
      }`}
    >
      <CardView
        card={rootCard}
        selectedCard={selectedCard}
        isRoot={true}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </div>
  );
};
