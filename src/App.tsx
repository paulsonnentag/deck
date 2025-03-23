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

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    console.log("key down", event.code);

    if (event.code === "KeyC" || event.code === "KeyR") {
      setTool({ type: "card" });
    }
    // } else if (event.code === "Backspace") {
    //   if (selectedCard) {
    //     setSelectedCard(null);
    //     selectedCard.destroy();
    //   }
    // }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
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
      }
    },
    [tool, rootCard]
  );

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
  isRoot?: boolean;
  onPointerDown: (event: PointerEvent<HTMLDivElement>, card: Card) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>, card: Card) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>, card: Card) => void;
};

export const CardView = ({
  card,
  isRoot,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: CardViewProps) => {
  useCard(card);

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
          : "bg-white border border-gray-200"
      }`}
      style={style}
      onPointerDown={(event) => onPointerDown(event, card)}
      onPointerMove={(event) => onPointerMove(event, card)}
      onPointerUp={(event) => onPointerUp(event, card)}
    >
      <div className="relative w-full h-full">
        {card.children.map((child) => (
          <CardView
            key={child.id}
            card={child}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        ))}
      </div>
    </div>
  );
};
