import { Card } from "./Card";
import { useCard } from "./hooks";
import { PointerEvent, useCallback, useState, useEffect } from "react";

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
      }
    },
    [tool]
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.isPrimary === false) return;

      if (tool.type === "card" && tool.state?.card) {
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

type CardViewProps = {
  card: Card;
  selectedCard: Card | null;
  isRoot?: boolean;
  onPointerDown: (event: PointerEvent<HTMLDivElement>, card: Card) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>, card: Card) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>, card: Card) => void;
};

export const CardView = ({
  card,
  selectedCard,
  isRoot,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: CardViewProps) => {
  useCard(card);

  const isSelected = selectedCard === card;

  console.log("isSelected", isSelected);

  const style = isRoot
    ? {}
    : {
        transform: `translate(${card.x}px, ${card.y}px)`,
        width: `${card.width}px`,
        height: `${card.height}px`,
      };

  return (
    <div
      className={`absolute ${
        isRoot
          ? "w-screen h-screen bg-gray-100"
          : "bg-white border rounded-sm " +
            (isSelected ? " border-blue-500" : "border-gray-200")
      }`}
      style={style}
      onPointerDown={(event) => {
        event.stopPropagation();
        onPointerDown(event, card);
      }}
      onPointerMove={(event) => {
        event.stopPropagation();
        onPointerMove(event, card);
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        onPointerUp(event, card);
      }}
    >
      <div className="relative w-full h-full">
        {card.children.map((child) => (
          <CardView
            key={child.id}
            card={child}
            selectedCard={selectedCard}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        ))}
      </div>
    </div>
  );
};
