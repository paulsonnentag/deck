import { Card } from "./card";
import { PointerEvent, useCallback, useState, useEffect, useMemo } from "react";
import { CardView, Corner } from "./CardView";

type CardToolState = {
  type: "card";
  state?: {
    card: Card;
  };
};

type DragStateMove = { type: "move"; offset: { x: number; y: number } };
type DragStateResize = { type: "resize"; corner: Corner };
type DragState = DragStateMove | DragStateResize;

type PointerToolState = {
  type: "pointer";
  state?: {
    card: Card;
    dragState?: DragState;
  };
};

type ToolState = CardToolState | PointerToolState;

type EditorProps = {
  rootCard: Card;
};

export const Editor = ({ rootCard }: EditorProps) => {
  const [tool, setTool] = useState<ToolState>({ type: "pointer" });
  const [clipboard, setClipboard] = useState<Card | null>(null);

  const selectedCard = useMemo(() => {
    if (tool.type === "pointer" && tool.state?.card) {
      return tool.state.card;
    }
    return null;
  }, [tool]);

  const draggedCard = useMemo(() => {
    if (tool.type === "pointer" && tool.state?.card && tool.state.dragState) {
      return tool.state.card;
    }
    return null;
  }, [tool]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // copy card
      if (event.code === "KeyC" && (event.ctrlKey || event.metaKey)) {
        if (selectedCard) {
          setClipboard(selectedCard);
        }

        // cut card
      } else if (event.code === "KeyX" && (event.ctrlKey || event.metaKey)) {
        if (selectedCard) {
          setClipboard(selectedCard);
          selectedCard.destroy();
        }

        // paste card
      } else if (event.code === "KeyV" && (event.ctrlKey || event.metaKey)) {
        if (clipboard) {
          const newCard = clipboard.shadow();
          newCard.setGlobalPosition({ x: 0, y: 0 });

          clipboard.parent!.addChild(newCard);
          setTool({ type: "pointer", state: { card: newCard } });
        }

        // switch to card tool
      } else if (event.code === "KeyC" || event.code === "KeyR") {
        setTool({ type: "card" });

        // delete card
      } else if (event.code === "Backspace") {
        if (selectedCard) {
          setTool({ type: "pointer" });
          selectedCard.destroy();
        }
        // cancel selection
      } else if (event.code === "Escape") {
        setTool({ type: "pointer" });
      }
    },
    [selectedCard, clipboard]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>, card: Card, corner?: Corner) => {
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
          let dragState: DragState;

          if (corner) {
            dragState = { type: "resize", corner };
          } else {
            const globalPosition = card.getGlobalPosition();
            const dragPositionOffset = {
              x: event.clientX - globalPosition.x,
              y: event.clientY - globalPosition.y,
            };
            dragState = { type: "move", offset: dragPositionOffset };
          }

          setTool({
            type: "pointer",
            state: {
              card,
              dragState,
            },
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
        tool.state.dragState
      ) {
        const { card, dragState } = tool.state;

        switch (dragState.type) {
          case "move":
            if (card.parent && card.parent !== containerCard) {
              card.parent.removeChild(card);
              containerCard.addChild(card);
            }

            card.setGlobalPosition({
              x: event.clientX - dragState.offset.x,
              y: event.clientY - dragState.offset.y,
            });
            break;

          case "resize": {
            const globalPosition = card.getGlobalPosition();

            switch (dragState.corner) {
              case "top-left":
                card.width += globalPosition.x - event.clientX;
                card.height += globalPosition.y - event.clientY;
                card.setGlobalPosition({
                  x: event.clientX,
                  y: event.clientY,
                });
                break;

              case "top-right":
                card.width = event.clientX - globalPosition.x;
                card.height += globalPosition.y - event.clientY;
                card.setGlobalPosition({
                  x: globalPosition.x,
                  y: event.clientY,
                });
                break;

              case "bottom-left":
                card.width += globalPosition.x - event.clientX;
                card.height = event.clientY - globalPosition.y;
                card.setGlobalPosition({
                  x: event.clientX,
                  y: globalPosition.y,
                });
                break;

              case "bottom-right":
                card.width = event.clientX - globalPosition.x;
                card.height = event.clientY - globalPosition.y;
                break;
            }
            card.changed();
            break;
          }
        }
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
        tool.state.dragState
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
