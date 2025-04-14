import { DocumentId } from "@automerge/automerge-repo";

import { useEffect, useMemo, useState, PointerEvent } from "react";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import * as Automerge from "@automerge/automerge/next";
import { Obj, ObjView } from "./Obj";
import { addChild, Card } from "./Card";
import { useStaticCallback } from "./hooks";
import { Field } from "./Field";
import { Inspector, useInspectorState } from "./Inspector";
import { SwallopPointerEvents } from "./utils";
import { ObjectsDoc } from "./ObjectsDoc";
import { useObjects } from "./ObjectsDoc";
import { uuid } from "@automerge/automerge";

const DEBUG_MODE = true;

type DragState = {
  offset: { x: number; y: number };
};

type FieldToolState = {
  type: "field";
};

type PointerToolState = {
  type: "pointer";
  state?: {
    activeNodeId: string;
    dragState?: DragState;
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
  const { objects, createObject } = useObjects(documentId);
  const [objectsDoc] = useDocument<ObjectsDoc>(documentId);
  const [tool, setTool] = useState<ToolState>({ type: "pointer" });
  const rootNode = objectsDoc ? objects[objectsDoc.rootObjectId] : undefined;

  useEffect(() => {
    (window as any).$objects = objects;
  }, [objects]);

  const [clipboard, setClipboard] = useState<Obj | null>(null);
  const stats = useMemo(() => {
    if (objectsDoc) {
      return Automerge.stats(objectsDoc);
    }
  }, [objectsDoc]);

  const selectedObject = useMemo(() => {
    if (tool.type === "pointer" && tool.state?.activeNodeId) {
      return objects?.[tool.state.activeNodeId];
    }
  }, [objects, tool]);

  const draggedObject = useMemo(() => {
    if (tool.type === "pointer" && tool.state?.dragState) {
      return objects?.[tool.state.activeNodeId];
    }
  }, [objects, tool]);

  const [inspectorState, setInspectorState] = useInspectorState({
    tool,
    selectedNode: selectedObject,
  });

  const onKeyDown = useStaticCallback((event: KeyboardEvent) => {
    // copy card
    if (event.code === "KeyC" && (event.ctrlKey || event.metaKey)) {
      if (selectedObject && selectedObject !== rootNode) {
        setClipboard(selectedObject);
      }

      // cut card
    } else if (event.code === "KeyX" && (event.ctrlKey || event.metaKey)) {
      if (selectedObject && selectedObject !== rootNode) {
        setClipboard(selectedObject);
        selectedObject.destroy();
      }

      // paste card
    } else if (event.code === "KeyV" && (event.ctrlKey || event.metaKey)) {
      if (clipboard) {
        console.log("paste card", clipboard);

        const newObj = clipboard.copy();
        const parent = clipboard.parent() as Card;

        console.log("newObj", newObj);

        parent.update((card) => {
          addChild(card, newObj);
        });

        setTool({
          type: "pointer",
          state: { activeNodeId: newObj.props.id },
        });
      }

      // print card
    } else if (event.code === "KeyP") {
      event.preventDefault();
      if (selectedObject) {
        console.log(selectedObject.toPromptXml(""));
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
      }
      // cancel selection
    } else if (event.code === "Escape") {
      setTool({ type: "pointer" });
    }
  });

  const onPointerDown = useStaticCallback(
    (event: PointerEvent<HTMLDivElement>, node: Obj) => {
      if (event.isPrimary === false || !rootNode) return;

      event.stopPropagation();

      switch (tool.type) {
        case "card": {
          const parentCard: Card = node instanceof Card ? node : node.parent()!;
          const offset = parentCard.globalPos();

          const newCard = createObject({
            id: uuid(),
            type: "card",
            width: 0,
            height: 0,
            x: Math.round(event.clientX - offset.x),
            y: Math.round(event.clientY - offset.y),
            childIds: {},
          });

          parentCard.update((card) => {
            addChild(card, newCard);
          });

          setTool({
            type: "card",
            state: { activeCardId: newCard.props.id },
          });
          break;
        }

        case "pointer": {
          const offset = node.globalPos();

          setTool({
            type: "pointer",
            state: {
              activeNodeId: node.props.id,
              dragState: {
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
          const parentCard: Card = node instanceof Card ? node : node.parent()!;
          const offset = parentCard.globalPos();

          const newField = createObject({
            id: uuid(),
            type: "field",
            x: Math.round(event.clientX - offset.x),
            y: Math.round(event.clientY - offset.y),
            value: "",
          });

          parentCard.update((card) => {
            addChild(card, newField);
          });

          setTool({
            type: "pointer",
            state: {
              activeNodeId: newField.props.id,
            },
          });
          break;
        }
      }
    }
  );

  const onPointerMove = useStaticCallback(
    (event: PointerEvent<HTMLDivElement>, node: Obj) => {
      if (event.isPrimary === false || !objects) return;

      event.stopPropagation();

      switch (tool.type) {
        case "card": {
          const activeCard = tool.state?.activeCardId
            ? (objects[tool.state.activeCardId] as Card)
            : undefined;
          if (!activeCard) break;

          const offset = activeCard.globalPos();

          activeCard.update((card) => {
            card.width = Math.round(event.clientX - offset.x);
            card.height = Math.round(event.clientY - offset.y);
          });
          break;
        }

        case "pointer": {
          const activeNode = tool.state?.activeNodeId
            ? objects[tool.state.activeNodeId]
            : undefined;

          const dragState = tool.state?.dragState;
          if (!activeNode || !dragState) break;

          if (activeNode.parent() !== node) {
            activeNode.parent()!.update((parent) => {
              delete parent.childIds[activeNode.props.id];
            });

            (node as Card).update((card) => {
              card.childIds[activeNode.props.id] = true;
            });

            const offset = node.globalPos();
            activeNode.update((node) => {
              node.x = Math.round(
                event.clientX - offset.x - dragState.offset.x
              );
              node.y = Math.round(
                event.clientY - offset.y - dragState.offset.y
              );
            });
          }

          const offset = node.globalPos();

          activeNode.update((node) => {
            node.x = Math.round(event.clientX - offset.x - dragState.offset.x);
            node.y = Math.round(event.clientY - offset.y - dragState.offset.y);
          });
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
            setTool({
              type: "pointer",
              state: {
                activeNodeId: tool.state.activeCardId,
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
              activeNodeId: tool.state.activeNodeId,
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
        ${tool.type === "field" ? "cursor-text" : ""}`}
    >
      {rootNode && (
        <ObjView
          obj={rootNode}
          draggedNode={draggedObject}
          selectedNode={selectedObject}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      )}

      <div className="absolute top-0 bottom-0 flex flex-col items-center justify-center right-4 pointer-events-none">
        <div className="pointer-events-auto">
          <SwallopPointerEvents>
            <Inspector state={inspectorState} setState={setInspectorState} />
          </SwallopPointerEvents>
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
