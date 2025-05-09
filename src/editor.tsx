import { DocumentId } from "@automerge/automerge-repo";

import { useDocument } from "@automerge/automerge-repo-react-hooks";
import * as Automerge from "@automerge/automerge/next";
import { PointerEvent, useEffect, useMemo, useState } from "react";
import { Card, CardProps } from "./Card";
import { useStaticCallback } from "./hooks";
import { Inspector, useInspectorState } from "./Inspector";
import {
  create,
  getObjectById,
  Obj,
  ObjectDoc,
  ObjView,
  useRootObject,
} from "./Obj";
import { SwallowPointerEvents } from "./utils";
import { uuid } from "@automerge/automerge";
import { Field, FieldProps } from "./Field";

const DEBUG_MODE = true;

export type Handle =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

const handleToCursorClassName = (handle: Handle) => {
  switch (handle) {
    case "top":
      return "cursor-ns-resize";
    case "bottom":
      return "cursor-ns-resize";
    case "left":
      return "cursor-ew-resize";
    case "right":
      return "cursor-ew-resize";
    case "top-left":
      return "cursor-nwse-resize";
    case "top-right":
      return "cursor-nesw-resize";
    case "bottom-left":
      return "cursor-nesw-resize";
    case "bottom-right":
      return "cursor-nwse-resize";
  }
};

type DragState = {
  offset: { x: number; y: number };
  handle?: Handle;
};

type FieldToolState = {
  type: "field";
};

type PointerToolState = {
  type: "pointer";
  state?: {
    activeObjectId: string;
    dragState?: DragState;
    handle?: Handle;
  };
};

type CardToolState = {
  type: "card";
  state?: {
    activeCardId?: string;
  };
};

export type ToolState = CardToolState | PointerToolState | FieldToolState;

type AppProps = {
  documentId: DocumentId;
};

export const Editor = ({ documentId }: AppProps) => {
  const rootCard = useRootObject();
  const [objectsDoc] = useDocument<ObjectDoc>(documentId);
  const [tool, setTool] = useState<ToolState>({ type: "pointer" });

  const [clipboard, setClipboard] = useState<Obj | null>(null);
  const stats = useMemo(() => {
    if (objectsDoc) {
      return Automerge.stats(objectsDoc);
    }
  }, [objectsDoc]);

  const selectedObject = useMemo(() => {
    if (tool.type === "pointer" && tool.state?.activeObjectId) {
      return getObjectById(tool.state.activeObjectId);
    }
  }, [tool, rootCard]); // need to re-run when objects are recomputed, this is why we have rootCard in here

  const draggedObject = useMemo(() => {
    if (tool.type === "pointer" && tool.state?.dragState) {
      return getObjectById(tool.state.activeObjectId);
    }
  }, [tool, rootCard]); // need to re-run when objects are recomputed, this is why we have rootCard in here

  const [inspectorState, setInspectorState] = useInspectorState({
    tool,
    selectedObject,
  });

  const onKeyDown = useStaticCallback((event: KeyboardEvent) => {
    // copy card
    if (event.code === "KeyC" && (event.ctrlKey || event.metaKey)) {
      if (selectedObject && selectedObject !== rootCard) {
        setClipboard(selectedObject);
      }

      // cut card
    } else if (event.code === "KeyX" && (event.ctrlKey || event.metaKey)) {
      if (selectedObject && selectedObject !== rootCard) {
        setTool({ type: "pointer" });
        setClipboard(selectedObject);
        selectedObject.destroy();
      }

      // paste card
    } else if (event.code === "KeyV" && (event.ctrlKey || event.metaKey)) {
      if (clipboard) {
        const newObj = clipboard.copy();
        const parent = clipboard.parent() as Card;

        parent.addChild(newObj);

        setTool({
          type: "pointer",
          state: { activeObjectId: newObj.props.id },
        });
      }

      // print card
    } else if (event.code === "KeyP") {
      event.preventDefault();
      if (selectedObject) {
        console.log(selectedObject);
      }

      // switch to card tool
    } else if (event.code === "KeyC" || event.code === "KeyR") {
      setTool({ type: "card" });

      // switch to field tool
    } else if (event.code === "KeyF" || event.code === "KeyT") {
      setTool({ type: "field" });

      // delete card
    } else if (event.code === "Backspace") {
      if (selectedObject) {
        selectedObject.destroy();
        setTool({ type: "pointer" });
      }
      // cancel selection
    } else if (event.code === "Escape") {
      setTool({ type: "pointer" });
    }
  });

  const onPointerDown = useStaticCallback(
    (event: PointerEvent<HTMLDivElement>, obj: Obj, handle?: Handle) => {
      if (event.isPrimary === false || !rootCard) return;

      event.stopPropagation();

      switch (tool.type) {
        case "card": {
          const parentCard: Card = obj instanceof Card ? obj : obj.parent()!;
          const offset = parentCard.globalPos();

          const newCard = create(Card, {
            id: uuid(),
            type: "card",
            width: 0,
            height: 0,
            fillMode: "solid",
            childIds: {},
            x: Math.round(event.clientX - offset.x),
            y: Math.round(event.clientY - offset.y),
          } as CardProps);

          parentCard.addChild(newCard);

          setTool({
            type: "card",
            state: { activeCardId: newCard.props.id },
          });
          break;
        }

        case "pointer": {
          const offset = obj.globalPos();

          setTool({
            type: "pointer",
            state: {
              activeObjectId: obj.props.id,
              dragState: {
                handle,
                offset: {
                  x: Math.round(event.clientX - offset.x),
                  y: Math.round(event.clientY - offset.y),
                },
              },
            },
          });
          break;
        }

        case "field": {
          const parentCard: Card = obj instanceof Card ? obj : obj.parent()!;
          const offset = parentCard.globalPos();

          const newField = create<Field, FieldProps>(Field, {
            type: "field",
            x: Math.round(event.clientX - offset.x),
            y: Math.round(event.clientY - offset.y),
            value: "",
          });

          parentCard.addChild(newField);

          setTool({
            type: "pointer",
            state: {
              activeObjectId: newField.props.id,
            },
          });
          break;
        }
      }
    }
  );

  const onPointerMove = useStaticCallback(
    (event: PointerEvent<HTMLDivElement>, node: Obj) => {
      if (event.isPrimary === false) return;

      event.stopPropagation();

      switch (tool.type) {
        case "card": {
          const activeCard = tool.state?.activeCardId
            ? (getObjectById(tool.state.activeCardId) as Card)
            : undefined;
          if (!activeCard) {
            break;
          }

          const offset = activeCard.globalPos();

          activeCard.update((card) => {
            card.width = Math.round(event.clientX - offset.x);
            card.height = Math.round(event.clientY - offset.y);
          });
          break;
        }

        case "pointer": {
          const activeObject = tool.state?.activeObjectId
            ? getObjectById(tool.state.activeObjectId)
            : undefined;

          const dragState = tool.state?.dragState;

          if (
            !activeObject ||
            !dragState ||
            activeObject.parent() === null ||
            activeObject.props.isLocked
          ) {
            break;
          }

          const handle = dragState.handle;

          // Handle resize if handle is set and we're manipulating a card
          if (handle && activeObject instanceof Card) {
            const offset = activeObject.globalPos();
            const width = activeObject.props.width;
            const height = activeObject.props.height;

            activeObject.update((node) => {
              if (
                handle === "right" ||
                handle === "top-right" ||
                handle === "bottom-right"
              ) {
                node.width = Math.max(20, Math.round(event.clientX - offset.x));
              }
              if (
                handle === "bottom" ||
                handle === "bottom-left" ||
                handle === "bottom-right"
              ) {
                node.height = Math.max(
                  20,
                  Math.round(event.clientY - offset.y)
                );
              }
              if (
                handle === "left" ||
                handle === "top-left" ||
                handle === "bottom-left"
              ) {
                const newWidth = Math.max(
                  20,
                  width - Math.round(event.clientX - offset.x)
                );
                node.x += width - newWidth;
                node.width = newWidth;
              }
              if (
                handle === "top" ||
                handle === "top-left" ||
                handle === "top-right"
              ) {
                const newHeight = Math.max(
                  20,
                  height - Math.round(event.clientY - offset.y)
                );
                node.y += height - newHeight;
                node.height = newHeight;
              }
            });
          }
          // Handle dragging
          else {
            const draggedOverCard =
              node instanceof Card ? node : node.parent()!;

            if (activeObject.parent() !== draggedOverCard) {
              activeObject.parent()!.removeChild(activeObject);

              draggedOverCard.addChild(activeObject);

              const offset = node.globalPos();
              activeObject.update((node) => {
                node.x = Math.round(
                  event.clientX - offset.x - dragState.offset.x
                );
                node.y = Math.round(
                  event.clientY - offset.y - dragState.offset.y
                );
              });
            }

            const offset = draggedOverCard.globalPos();

            activeObject.update((node) => {
              node.x = Math.round(
                event.clientX - offset.x - dragState.offset.x
              );
              node.y = Math.round(
                event.clientY - offset.y - dragState.offset.y
              );
            });
          }
          break;
        }
      }
    }
  );

  const onPointerUp = useStaticCallback(
    (event: PointerEvent<HTMLDivElement>, node: Obj) => {
      if (event.isPrimary === false) return;

      event.stopPropagation();

      switch (tool.type) {
        case "card": {
          if (tool.state?.activeCardId) {
            const activeCard = getObjectById(tool.state.activeCardId) as Card;

            if (activeCard.props.width < 50 || activeCard.props.height < 50) {
              activeCard.update((card) => {
                card.width = 50;
                card.height = 50;
                card.x = card.x - 25;
                card.y = card.y - 25;
              });
            }

            setTool({
              type: "pointer",
              state: {
                activeObjectId: tool.state.activeCardId,
              },
            });
          }
          break;
        }

        case "pointer": {
          if (!tool.state) break;

          setTool({
            type: "pointer",
            state: {
              activeObjectId: tool.state.activeObjectId,
              dragState: undefined,
            },
          });
          break;
        }
      }
    }
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  return (
    <div
      className={`w-screen h-screen overflow-auto bg-gray-50 
        ${tool.type === "card" ? "cursor-crosshair" : ""}
        ${tool.type === "field" ? "cursor-text" : ""}
        ${
          tool.type === "pointer" &&
          tool.state?.dragState &&
          tool.state.dragState.handle
            ? handleToCursorClassName(tool.state.dragState.handle)
            : ""
        }`}
    >
      {rootCard && (
        <ObjView
          obj={rootCard}
          draggedNode={draggedObject}
          selectedNode={selectedObject}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      )}

      <div className="absolute top-4 right-4 pointer-events-none">
        <div className="pointer-events-auto">
          <SwallowPointerEvents>
            <Inspector state={inspectorState} setState={setInspectorState} />
          </SwallowPointerEvents>
        </div>
      </div>

      {DEBUG_MODE && stats ? (
        <div className="absolute bottom-0 right-0 p-2 font-mono text-xs pointer-events-none">
          {stats.numChanges} changes, {stats.numOps} ops
        </div>
      ) : null}
    </div>
  );
};
