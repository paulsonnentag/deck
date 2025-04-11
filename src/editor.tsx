import { DocumentId } from "@automerge/automerge-repo";

import { useEffect, useMemo, useState, PointerEvent, useRef } from "react";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import * as Automerge from "@automerge/automerge/next";
import { Node, NodeView } from "./node";
import { Card } from "./card";
import { NodesDoc, useNodes } from "./nodes";
import { useStaticCallback } from "./hooks";
import { Field } from "./field";
import {
  ColorPicker,
  FontSizePicker,
  FillModePicker,
  Inspector,
  InspectorDivider,
  useInspectorState,
} from "./inspector";
import { SwallopPointerEvents } from "./utils";

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
  const nodes = useNodes(documentId);
  const nodesDocHandle = useHandle<NodesDoc>(documentId);
  const [nodesDoc] = useDocument<NodesDoc>(documentId);
  const [tool, setTool] = useState<ToolState>({ type: "pointer" });
  const rootNode = nodesDoc ? nodes?.[nodesDoc.rootNodeId] : undefined;

  useEffect(() => {
    (window as any).nodes = nodes;
  }, [nodes]);

  const [clipboard, setClipboard] = useState<Node | null>(null);
  const stats = useMemo(() => {
    if (nodesDoc) {
      return Automerge.stats(nodesDoc);
    }
  }, [nodesDoc]);

  const selectedNode = useMemo(() => {
    if (tool.type === "pointer" && tool.state?.activeNodeId) {
      return nodes?.[tool.state.activeNodeId];
    }
  }, [nodes, tool]);

  const draggedNode = useMemo(() => {
    if (tool.type === "pointer" && tool.state?.dragState) {
      return nodes?.[tool.state.activeNodeId];
    }
  }, [nodes, tool]);

  const [inspectorState, setInspectorState] = useInspectorState({
    tool,
    selectedNode,
  });

  const onKeyDown = useStaticCallback((event: KeyboardEvent) => {
    // copy card
    if (event.code === "KeyC" && (event.ctrlKey || event.metaKey)) {
      if (selectedNode && selectedNode !== rootNode) {
        setClipboard(selectedNode);
      }

      // cut card
    } else if (event.code === "KeyX" && (event.ctrlKey || event.metaKey)) {
      if (selectedNode && selectedNode !== rootNode) {
        setClipboard(selectedNode);
        selectedNode.destroy();
      }

      // paste card
    } else if (event.code === "KeyV" && (event.ctrlKey || event.metaKey)) {
      if (clipboard) {
        console.log("paste card", clipboard);

        const newObj = clipboard.copy();
        const parent = clipboard.parent as Card;

        parent.update((card) => {
          card.childIds[newObj.id] = true;
        });

        setTool({
          type: "pointer",
          state: { activeNodeId: newObj.id },
        });
      }

      // print card
    } else if (event.code === "KeyP") {
      event.preventDefault();
      if (selectedNode) {
        if (selectedNode instanceof Card) {
          console.log(selectedNode.serializeWithChildren());
        }
      }

      // switch to card tool
    } else if (event.code === "KeyC" || event.code === "KeyR") {
      setTool({ type: "card" });

      // switch to field tool
    } else if (event.code === "KeyF" || event.code === "KeyT") {
      setTool({ type: "field" });

      // delete card
    } else if (event.code === "Backspace") {
      if (selectedNode) {
        selectedNode.destroy();
      }
      // cancel selection
    } else if (event.code === "Escape") {
      setTool({ type: "pointer" });
    }
  });

  const onPointerDown = useStaticCallback(
    (event: PointerEvent<HTMLDivElement>, node: Node) => {
      if (event.isPrimary === false || !nodesDocHandle || !rootNode) return;

      event.stopPropagation();

      switch (tool.type) {
        case "card": {
          const parentCard: Card = node instanceof Card ? node : node.parent!;
          const offset = parentCard.globalPos();

          const newCard = Card.create(nodesDocHandle, {
            width: 0,
            height: 0,
            x: Math.round(event.clientX - offset.x),
            y: Math.round(event.clientY - offset.y),
          });

          parentCard.update((card) => {
            card.childIds[newCard.id] = true;
          });

          setTool({
            type: "card",
            state: { activeCardId: newCard.id },
          });
          break;
        }

        case "pointer": {
          const offset = node.globalPos();

          setTool({
            type: "pointer",
            state: {
              activeNodeId: node.id,
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
          const parentCard: Card = node instanceof Card ? node : node.parent!;
          const offset = parentCard.globalPos();

          const newField = Field.create(nodesDocHandle, {
            x: Math.round(event.clientX - offset.x),
            y: Math.round(event.clientY - offset.y),
            value: "",
          });

          parentCard.update((card) => {
            card.childIds[newField.id] = true;
          });

          setTool({
            type: "pointer",
            state: {
              activeNodeId: newField.id,
            },
          });
          break;
        }
      }
    }
  );

  const onPointerMove = useStaticCallback(
    (event: PointerEvent<HTMLDivElement>, node: Node) => {
      if (event.isPrimary === false || !nodes) return;

      event.stopPropagation();

      switch (tool.type) {
        case "card": {
          const activeCard = tool.state?.activeCardId
            ? (nodes[tool.state.activeCardId] as Card)
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
            ? nodes[tool.state.activeNodeId]
            : undefined;

          const dragState = tool.state?.dragState;
          if (!activeNode || !dragState) break;

          if (activeNode.parent !== node) {
            activeNode.parent!.update((parent) => {
              delete parent.childIds[activeNode.id];
            });

            (node as Card).update((card) => {
              card.childIds[activeNode.id] = true;
            });

            const offset = node.globalPos();
            activeNode.update((node) => {
              node.x = event.clientX - offset.x - dragState.offset.x;
              node.y = event.clientY - offset.y - dragState.offset.y;
            });
          }

          const offset = node.globalPos();

          activeNode.update((node) => {
            node.x = event.clientX - offset.x - dragState.offset.x;
            node.y = event.clientY - offset.y - dragState.offset.y;
          });
          break;
        }
      }
    }
  );

  const onPointerUp = useStaticCallback(
    (event: PointerEvent<HTMLDivElement>, node: Node) => {
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
        <NodeView
          node={rootNode}
          draggedNode={draggedNode}
          selectedNode={selectedNode}
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
