import { useCard } from "./hooks";
import { PointerEvent } from "react";
import { Card } from "./card";

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type CardViewProps = {
  card: Card;
  selectedCard: Card | null;
  draggedCard: Card | null;
  isRoot?: boolean;
  onPointerDown: (
    event: PointerEvent<HTMLDivElement>,
    card: Card,
    corner?: Corner
  ) => void;
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
          ? "w-screen h-screen bg-gray-200"
          : "bg-white border rounded-sm shadow-sm " +
            (isSelected ? " border-blue-500" : "border-gray-200")
      } ${isDragged ? "pointer-events-none" : ""}`}
      style={style}
      onPointerDown={(event) => onPointerDown(event, card)}
      onPointerMove={(event) => onPointerMove(event, card)}
      onPointerUp={(event) => onPointerUp(event, card)}
    >
      <div className="relative w-full h-full">
        {isSelected && (
          <>
            <div
              className="absolute top-0 left-0 w-[10px] h-[10px] border border-blue-500 -ml-[5px] -mt-[5px] bg-white"
              onPointerDown={(event) => {
                event.stopPropagation();
                onPointerDown(event, card, "top-left");
              }}
            />
            <div
              className="absolute top-0 right-0 w-[10px] h-[10px] border border-blue-500 -mr-[5px] -mt-[5px] bg-white"
              onPointerDown={(event) => {
                event.stopPropagation();
                onPointerDown(event, card, "top-right");
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-[10px] h-[10px] border border-blue-500 -ml-[5px] -mb-[5px] bg-white"
              onPointerDown={(event) => {
                event.stopPropagation();
                onPointerDown(event, card, "bottom-left");
              }}
            />
            <div
              className="absolute bottom-0 right-0 w-[10px] h-[10px] border border-blue-500 -mr-[5px] -mb-[5px] bg-white"
              onPointerDown={(event) => {
                event.stopPropagation();
                onPointerDown(event, card, "bottom-right");
              }}
            />
          </>
        )}

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
