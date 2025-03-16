import { $Object, $Set } from "./core";
import { PointerIcon, SquareIcon } from "lucide-react";
import clsx from "clsx";
import { useRef, useState } from "react";

const defaultCard = new $Object({
  children: new $Set(),
  x: 100,
  y: 100,
  width: 100,
  height: 100,
});

export const App = () => {
  const [selectedTool, setSelectedTool] = useState<ToolType>("pointer");
  const activeCard = useRef<$Object>(null);
  const cards = useRef<$Object[]>([]);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.isPrimary === false) return;

    switch (selectedTool) {
      case "card":
        if (activeCard.current) {
          activeCard.current.set(
            "width",
            event.clientX - activeCard.current.get("x")
          );
          activeCard.current.set(
            "height",
            event.clientY - activeCard.current.get("y")
          );
        }
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.isPrimary === false) return;

    switch (selectedTool) {
      case "card":
        console.log("create new card");

        activeCard.current = defaultCard.copy();
        activeCard.current.set("x", event.clientX);
        activeCard.current.set("y", event.clientY);
        activeCard.current.set("width", 0);
        activeCard.current.set("height", 0);
        cards.current.push(activeCard.current);
        break;
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.isPrimary === false) return;

    switch (selectedTool) {
      case "card":
        activeCard.current = null;
        setSelectedTool("pointer");
        break;
    }
  };

  return (
    <div
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      className={clsx("w-screen h-screen relative bg-gray-100", {
        "cursor-crosshair": selectedTool === "card",
      })}
    >
      {cards.current.map((card) => (
        <CardView key={card.id} card={card} />
      ))}

      <div className="absolute bottom-2 w-full flex justify-center">
        <Toolbar
          selectedTool={selectedTool}
          onSelectTool={(tool) => {
            console.log("selectedTool", tool);
            setSelectedTool(tool);
          }}
        />
      </div>
    </div>
  );
};

type CardViewProps = {
  card: $Object;
  onPointerDownOnCard: (card: $Object) => void;
};

const CardView: React.FC<CardViewProps> = ({ card, onPointerDownOnCard }) => {
  const x = card.get("x");
  const y = card.get("y");
  const width = card.get("width");
  const height = card.get("height");

  return (
    <div
      onPointerDown={(event) => {
        event.stopPropagation();
        onPointerDownOnCard(card, event);
      }}
      className="absolute border border-gray-300 bg-white"
      style={{
        transform: `translate(${x}px, ${y}px)`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <div className="relative" />
    </div>
  );
};

type ToolType = "pointer" | "card";

type ToolbarProps = {
  selectedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
};

const Toolbar: React.FC<ToolbarProps> = ({ selectedTool, onSelectTool }) => {
  return (
    <div className="flex shadow-md rounded-md bg-white p-1 gap-1">
      <button
        className={clsx("p-2 rounded-md", {
          "bg-blue-500": selectedTool === "pointer",
        })}
        onClick={() => onSelectTool("pointer")}
      >
        <PointerIcon
          className={clsx({ "text-white": selectedTool === "pointer" })}
        />
      </button>
      <button
        className={clsx("p-2 rounded-md", {
          "bg-blue-500": selectedTool === "card",
        })}
        onClick={() => onSelectTool("card")}
      >
        <SquareIcon
          className={clsx({ "text-white": selectedTool === "card" })}
        />
      </button>
    </div>
  );
};
