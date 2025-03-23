import { useCard } from "./hooks";
import { PointerEvent } from "react";
import { Card } from "./card";

type CardViewProps = {
  card: Card;
  selectedCard: Card | null;
  draggedCard: Card | null;
  isRoot?: boolean;
  onPointerDown: (event: PointerEvent<HTMLDivElement>, card: Card) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>, card: Card) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>, card: Card) => void;
};

export const CardView = ({
  card,
  selectedCard,
  draggedCard,
  isRoot,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: CardViewProps) => {
  useCard(card);

  const isSelected = selectedCard === card;
  const isDragged = draggedCard === card;

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
      } ${isDragged ? "pointer-events-none" : ""}`}
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
            draggedCard={draggedCard}
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
