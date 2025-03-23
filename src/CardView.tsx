import { useCard } from "./hooks";
import { PointerEvent } from "react";
import { Card } from "./card";

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
