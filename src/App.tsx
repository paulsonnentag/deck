import { DocumentId } from "@automerge/automerge-repo";

import { ObjectDoc, useObjects } from "./core";
import { useCallback, useEffect, useMemo, useState, PointerEvent } from "react";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import * as Automerge from "@automerge/automerge/next";

const DEBUG_MODE = true;

type DragState = {
  offset: { x: number; y: number };
};

type PointerToolState = {
  type: "pointer";
  state?: {
    selectedObj?: any;
    dragState?: DragState;
  };
};

type CardToolState = {
  type: "card";
  state?: {
    selectedCard?: any;
  };
};

type ToolState = CardToolState | PointerToolState;

type AppProps = {
  documentId: DocumentId;
};

export const App = ({ documentId }: AppProps) => {
  const [objectDoc] = useDocument<ObjectDoc>(documentId);
  const objects = useObjects(documentId);
  const [tool, setTool] = useState<ToolState>({ type: "pointer" });
  const [clipboard, setClipboard] = useState<any>(null);
  const stats = useMemo(() => {
    if (objectDoc) {
      return Automerge.stats(objectDoc);
    }
  }, [objectDoc]);

  const selectedObj = useMemo(() => {
    if (tool.type === "pointer" && tool.state?.selectedObj) {
      return tool.state.selectedObj;
    }
    return null;
  }, [tool]);

  const draggedObj = useMemo(() => {
    if (tool.type === "pointer" && tool.state?.dragState) {
      return tool.state.selectedObj;
    }
    return null;
  }, [tool]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // copy card
      if (event.code === "KeyC" && (event.ctrlKey || event.metaKey)) {
        if (selectedObj) {
          setClipboard(selectedObj);
        }

        // cut card
      } else if (event.code === "KeyX" && (event.ctrlKey || event.metaKey)) {
        if (selectedObj) {
          setClipboard(selectedObj);
          selectedObj.destroy();
        }

        // paste card
      } else if (event.code === "KeyV" && (event.ctrlKey || event.metaKey)) {
        if (clipboard) {
          const newObj = clipboard.copy();
          newObj.setGlobalPosition({ x: 0, y: 0 });

          setTool({
            type: "pointer",
            state: { selectedObj: newObj },
          });
        }

        // switch to card tool
      } else if (event.code === "KeyC" || event.code === "KeyR") {
        setTool({ type: "card" });

        // delete card
      } else if (event.code === "Backspace") {
        if (selectedObj) {
          setTool({ type: "pointer" });
          selectedObj.destroy();
        }
        // cancel selection
      } else if (event.code === "Escape") {
        setTool({ type: "pointer" });
      }
    },
    [selectedObj, clipboard]
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>, obj?: any) => {
      if (event.isPrimary === false) return;

      event.stopPropagation();

      if (tool.type === "card") {
        const newCard = objects.card.extend({
          props: {
            width: 0,
            height: 0,
            x: event.clientX,
            y: event.clientY,
          },
        });

        setTool({
          type: "card",
          state: { selectedCard: newCard },
        });
      } else if (tool.type === "pointer") {
        if (!obj) {
          setTool({ type: "pointer" });
        } else {
          setTool({
            type: "pointer",
            state: {
              selectedObj: obj,
              dragState: {
                offset: {
                  x: event.clientX - obj.props.x,
                  y: event.clientY - obj.props.y,
                },
              },
            },
          });
        }
      }
    },
    [objects.card, tool.type]
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>, obj?: any) => {
      if (event.isPrimary === false) return;

      event.stopPropagation();

      if (tool.type === "card" && tool.state?.selectedCard) {
        const { selectedCard } = tool.state;

        console.log("updata card", { selectedCard });

        selectedCard.update(({ x, y }: any) => ({
          width: event.clientX - x,
          height: event.clientY - y,
        }));
      } else if (
        tool.type === "pointer" &&
        tool.state?.selectedObj &&
        tool.state.dragState
      ) {
        const { selectedObj, dragState } = tool.state;

        selectedObj.update(() => ({
          x: event.clientX - dragState.offset.x,
          y: event.clientY - dragState.offset.y,
        }));
      }
    },
    [tool]
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.isPrimary === false) return;

      event.stopPropagation();

      if (tool.type === "card" && tool.state?.selectedCard) {
        setTool({
          type: "pointer",
          state: { selectedObj: tool.state.selectedCard },
        });
      } else if (
        tool.type === "pointer" &&
        tool.state?.selectedObj &&
        tool.state.dragState
      ) {
        setTool({
          type: "pointer",
          state: { selectedObj: tool.state.selectedObj },
        });
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
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {Object.values(objects).map((object) => {
        if (
          object.id === "card" ||
          object.id === "field" ||
          object.id === "obj"
        ) {
          return null;
        }

        return (
          <ObjectView
            key={object.id}
            object={object}
            selectedObj={selectedObj}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        );
      })}

      {DEBUG_MODE && stats ? (
        <div className="absolute bottom-0 right-0 p-2 font-mono text-xs">
          {stats.numChanges} changes, {stats.numOps} ops
        </div>
      ) : null}
    </div>
  );
};

type ObjectViewProps = {
  object: any;
  selectedObj: any;
  onPointerDown: (event: PointerEvent<HTMLDivElement>, obj?: any) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>, obj?: any) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>, obj?: any) => void;
};

const ObjectView = ({
  object,
  selectedObj,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ObjectViewProps) => {
  return object.view({
    onPointerDown,
    onPointerMove,
    onPointerUp,
    selectedObj,
  });
};
