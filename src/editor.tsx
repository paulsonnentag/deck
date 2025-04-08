import { DocumentId } from "@automerge/automerge-repo";

import { useCallback, useEffect, useMemo, useState, PointerEvent } from "react";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import * as Automerge from "@automerge/automerge/next";
import { Node, NodeView } from "./node";
import { Card } from "./card";
import { NodesDoc, useNodes } from "./nodes";

const DEBUG_MODE = true;

type DragState = {
  offset: { x: number; y: number };
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

type ToolState = CardToolState | PointerToolState;

type AppProps = {
  documentId: DocumentId;
};

export const Editor = ({ documentId }: AppProps) => {
  const nodes = useNodes(documentId);
  const nodesDocHandle = useHandle<NodesDoc>(documentId);
  const [nodesDoc] = useDocument<NodesDoc>(documentId);
  const rootNode = nodesDoc ? nodes?.[nodesDoc.rootNodeId] : undefined;

  useEffect(() => {
    (window as any).nodes = nodes;
  }, [nodes]);

  const [tool, setTool] = useState<ToolState>({ type: "pointer" });
  const [clipboard, setClipboard] = useState<any>(null);
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

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // copy card
      if (event.code === "KeyC" && (event.ctrlKey || event.metaKey)) {
        if (selectedNode) {
          setClipboard(selectedNode);
        }

        // cut card
      } else if (event.code === "KeyX" && (event.ctrlKey || event.metaKey)) {
        if (selectedNode) {
          // todo
          console.log("todo implement cut node");
        }

        // paste card
      } else if (event.code === "KeyV" && (event.ctrlKey || event.metaKey)) {
        if (clipboard) {
          const newObj = clipboard.copy();
          newObj.setGlobalPosition({ x: 0, y: 0 });

          setTool({
            type: "pointer",
            state: { activeNode: newObj },
          });
        }

        // switch to card tool
      } else if (event.code === "KeyC" || event.code === "KeyR") {
        setTool({ type: "card" });

        // delete card
      } else if (event.code === "Backspace") {
        if (selectedNode) {
          selectedNode.destroy();
        }
        // cancel selection
      } else if (event.code === "Escape") {
        setTool({ type: "pointer" });
      }
    },
    [selectedNode, clipboard]
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>, node: Node) => {
      if (event.isPrimary === false || !nodesDocHandle || !rootNode) return;

      event.stopPropagation();

      if (tool.type === "card") {
        const parentCard: Card = node instanceof Card ? node : node.parent!;

        const offset = parentCard.globalPos();

        const newCard = Card.create(nodesDocHandle, {
          width: 0,
          height: 0,
          x: event.clientX - offset.x,
          y: event.clientY - offset.y,
        });

        parentCard.update((card) => {
          card.childIds[newCard.id] = true;
        });

        setTool({
          type: "card",
          state: { activeCardId: newCard.id },
        });
      } else if (tool.type === "pointer") {
        const offset = node.globalPos();

        if (node.id === rootNode.id) {
          setTool({
            type: "pointer",
          });
          return;
        }
        setTool({
          type: "pointer",
          state: {
            activeNodeId: node.id,
            dragState: {
              offset: {
                x: event.clientX - offset.x,
                y: event.clientY - offset.y,
              },
            },
          },
        });
      }
    },
    [nodesDocHandle, tool.type, rootNode]
  );

  const onPointerMove = useCallback(
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
            card.width = event.clientX - offset.x;
            card.height = event.clientY - offset.y;
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
    },
    [tool, nodes]
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>, node: Node) => {
      if (event.isPrimary === false) return;

      event.stopPropagation();

      switch (tool.type) {
        case "card": {
          if (tool.state?.activeCardId) {
            setTool({
              type: "pointer",
              state: { activeNodeId: tool.state.activeCardId },
            });
          }
          break;
        }

        case "pointer": {
          if (!tool.state) break;

          setTool({
            type: "pointer",
            state: { activeNodeId: tool.state.activeNodeId },
          });
          break;
        }
      }
    },
    [tool]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  return (
    <div
      className={`w-screen h-screen overflow-auto bg-gray-50 ${
        tool.type === "card" ? "cursor-crosshair" : ""
      }`}
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
      {DEBUG_MODE && stats ? (
        <div className="absolute bottom-0 right-0 p-2 font-mono text-xs pointer-events-none">
          {stats.numChanges} changes, {stats.numOps} ops
        </div>
      ) : null}
    </div>
  );
};
