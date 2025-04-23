import { Field } from "./Field";
import { colorToHex } from "./Inspector";
import { Color, colorToBackgroundColorHex } from "./Inspector";
import {
  BaseProps,
  Obj,
  ObjView,
  ObjViewProps,
  PersistedObject,
  create,
  getObjectById,
  getObjectDocHandle,
} from "./Obj";

export type CardProps = BaseProps & {
  type: "card";
  width: number;
  height: number;
  fillMode?: "solid" | "none";
  color?: Color;
  childIds: Record<string, true>;
};

export class Card extends PersistedObject<CardProps> {
  destroy() {
    this.children().forEach((child) => {
      child.destroy();
    });

    super.destroy();
  }

  children() {
    return Object.keys(this.props.childIds).map((id) => {
      const child = getObjectById(id)!;

      if (child instanceof Field) {
      }

      child.parentId = this.props.id;
      return child;
    });
  }

  addChild(child: Obj) {
    this.update((props) => {
      props.childIds[child.props.id] = true;
    });
  }

  removeChild(child: Obj) {
    this.update((props) => {
      delete props.childIds[child.props.id];
    });
  }

  copy(): Card {
    return create<Card, CardProps>(Card, {
      ...structuredClone(this.props),
      childIds: Object.fromEntries(
        this.children().map((child) => [child.copy().props.id, true])
      ),
    });
  }

  view({
    draggedNode: draggedObj,
    selectedNode: selectedObj,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    isParentLocked,
  }: ObjViewProps) {
    const id = this.get("id");
    const width = this.get("width");
    const height = this.get("height");
    const x = this.get("x");
    const y = this.get("y");
    const fillMode = this.get("fillMode");
    const color = this.get("color");
    const isSelfLocked = this.get("isLocked");
    const isLocked = isSelfLocked || isParentLocked;

    const isBeingDragged = draggedObj?.props.id === id;
    const isSelected = selectedObj?.props.id === id;
    const isRoot = !this.parent();

    const style: React.CSSProperties = {
      position: "absolute",
      width: isRoot ? "100%" : `${width}px`,
      height: isRoot ? "100%" : `${height}px`,
      transform: `translate(${x}px, ${y}px)`,
    };

    if (!isRoot) {
      style.backgroundColor =
        fillMode === "solid" ? colorToBackgroundColorHex(color) : "white";
      style.borderColor = colorToHex(color);
    }

    return (
      <div
        className={`
            ${isRoot ? "" : "rounded-md border-2"}
            ${isBeingDragged && !isRoot ? "pointer-events-none" : ""} 
            ${isSelected ? "shadow-solid" : ""}
          `}
        style={style}
        onPointerDown={(e) => {
          if (isParentLocked) {
            return;
          }

          onPointerDown(e, this as Obj);
        }}
        onPointerMove={(e) => {
          if (isParentLocked) {
            return;
          }

          onPointerMove(e, this as Obj);
        }}
        onPointerUp={(e) => {
          if (isParentLocked) {
            return;
          }

          onPointerUp(e, this as Obj);
        }}
      >
        {this.children().map((child) => (
          <ObjView
            isParentLocked={isLocked || isParentLocked}
            key={child.props.id}
            obj={child}
            draggedNode={draggedObj}
            selectedNode={selectedObj}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        ))}
        {!isRoot && !isLocked && (
          <>
            <div
              className={`absolute top-[-5px] h-[10px] cursor-ns-resize left-[5px] right-[5px]`}
              onPointerDown={(e) => onPointerDown(e, this as Obj, "top")}
            />
            <div
              className={`absolute left-[-5px] w-[10px] cursor-ew-resize top-[5px] bottom-[5px]`}
              onPointerDown={(e) => onPointerDown(e, this as Obj, "left")}
            />
            <div
              className={`absolute right-[-5px] w-[10px] cursor-ew-resize top-[5px] bottom-[5px]`}
              onPointerDown={(e) => onPointerDown(e, this as Obj, "right")}
            />
            <div
              className={`absolute bottom-[-5px] h-[10px] cursor-ns-resize left-[5px] right-[5px]`}
              onPointerDown={(e) => onPointerDown(e, this as Obj, "bottom")}
            />
            <div
              className={`absolute top-[-5px] left-[-5px] w-[10px] h-[10px] cursor-nwse-resize`}
              onPointerDown={(e) => onPointerDown(e, this as Obj, "top-left")}
            />
            <div
              className={`absolute top-[-5px] right-[-5px] w-[10px] h-[10px] cursor-nesw-resize`}
              onPointerDown={(e) => onPointerDown(e, this as Obj, "top-right")}
            />

            <div
              className={`absolute bottom-[-5px] left-[-5px] w-[10px] h-[10px] cursor-nesw-resize`}
              onPointerDown={(e) =>
                onPointerDown(e, this as Obj, "bottom-left")
              }
            />

            <div
              className={`absolute bottom-[-5px] right-[-5px] w-[10px] h-[10px] cursor-nwse-resize`}
              onPointerDown={(e) =>
                onPointerDown(e, this as Obj, "bottom-right")
              }
            />
          </>
        )}
      </div>
    );
  }
}
