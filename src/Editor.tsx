import { Card } from "./card";
import { PointerEvent, useCallback, useState, useEffect, useMemo } from "react";
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
    dragPositionOffset?: {
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

  const selectedCard = useMemo(() => {
    if (tool.type === "pointer" && tool.state?.card) {
      return tool.state.card;
    }
    return null;
  }, [tool]);

  const draggedCard = useMemo(() => {
    if (
      tool.type === "pointer" &&
      tool.state?.card &&
      tool.state.dragPositionOffset
    ) {
      return tool.state.card;
    }
    return null;
  }, [tool]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.code === "KeyC" || event.code === "KeyR") {
        setTool({ type: "card" });
      } else if (event.code === "Backspace") {
        if (selectedCard) {
          setTool({ type: "pointer" });
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

      event.stopPropagation();

      if (tool.type === "card") {
        const newCard = Card.copy();
        card.addChild(newCard);
        newCard.setGlobalPosition({ x: event.clientX, y: event.clientY });
        newCard.width = 0;
        newCard.height = 0;

        tool.state = {
          card: newCard,
        };
      } else if (tool.type === "pointer") {
        if (card === rootCard) {
          setTool({ type: "pointer" });
        } else {
          const globalPosition = card.getGlobalPosition();

          const dragPositionOffset = {
            x: event.clientX - globalPosition.x,
            y: event.clientY - globalPosition.y,
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

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>, containerCard: Card) => {
      if (event.isPrimary === false) return;

      event.stopPropagation();

      if (tool.type === "card" && tool.state?.card) {
        const { card } = tool.state;
        const globalPosition = card.getGlobalPosition();

        card.width = event.clientX - globalPosition.x;
        card.height = event.clientY - globalPosition.y;
        card.changed();
      } else if (
        tool.type === "pointer" &&
        tool.state?.card &&
        tool.state.dragPositionOffset
      ) {
        const { card } = tool.state;

        if (card.parent && card.parent !== containerCard) {
          card.parent.removeChild(card);
          containerCard.addChild(card);
        }

        card.setGlobalPosition({
          x: event.clientX - tool.state.dragPositionOffset.x,
          y: event.clientY - tool.state.dragPositionOffset.y,
        });
      }
    },
    [tool]
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.isPrimary === false) return;

      event.stopPropagation();

      if (tool.type === "card" && tool.state?.card) {
        setTool({ type: "pointer", state: { card: tool.state.card } });
      } else if (
        tool.type === "pointer" &&
        tool.state?.card &&
        tool.state.dragPositionOffset
      ) {
        setTool({ type: "pointer", state: { card: tool.state.card } });
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
        draggedCard={draggedCard}
        isRoot={true}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </div>
  );
};
