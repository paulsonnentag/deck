import { ObjView, Obj, ObjViewProps, ObjProps } from "./Obj";
import {
  FillMode,
  colorToHex,
  Color,
  colorToBackgroundColorHex,
} from "./Inspector";

export type CardSchema = {
  type: "card";
  width: number | "100%";
  height: number | "100%";
  childIds: Record<string, boolean>;
  color?: Color;
  fillMode?: FillMode;
};

export class Card extends Obj<CardSchema> {
  destroy() {
    const { childIds } = this.props;

    Object.keys(childIds).forEach((childId) => {
      const child = this.getObjectById(childId);
      child.destroy();
    });

    super.destroy();
  }

  copy(): Card {
    const copiedProps = this.copyProps();
    copiedProps.childIds = Object.fromEntries(
      this.children().map((child) => [child.copy().props.id, true])
    );

    const newCard = new Card(copiedProps, this.getObjectById, this.updateDoc);

    this.updateDoc((doc) => {
      doc.objects[newCard.props.id] = newCard.serialize();
    });

    return newCard;
  }
  children() {
    return Object.keys(this.props.childIds).map((id) => {
      const child = this.getObjectById(id);
      child.props.parentId = this.props.id;
      return child;
    });
  }

  view({
    draggedNode: draggedObj,
    selectedNode: selectedObj,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }: ObjViewProps) {
    const { id, width, height, x, y, fillMode, color = "black" } = this.props;

    const isBeingDragged = draggedObj?.props.id === id;
    const isSelected = selectedObj?.props.id === id;
    const isRoot = !this.parent();

    const style: React.CSSProperties = {
      position: "absolute",
      width: width === "100%" ? "100%" : `${width}px`,
      height: height === "100%" ? "100%" : `${height}px`,
      transform: `translate(${x}px, ${y}px)`,
    };

    if (!isRoot) {
      style.backgroundColor =
        fillMode === "solid" ? colorToBackgroundColorHex(color) : "transparent";
      style.borderColor = colorToHex(color);
    }

    return (
      <div
        className={`
          ${isRoot ? "bg-gray-100" : "bg-white rounded-md border-2"}
          ${isBeingDragged && !isRoot ? "pointer-events-none" : ""} 
          ${isSelected ? "outline outline-blue-500" : ""}
        `}
        style={style}
        onPointerDown={(e) => onPointerDown(e, this)}
        onPointerMove={(e) => onPointerMove(e, this)}
        onPointerUp={(e) => onPointerUp(e, this)}
      >
        {this.children().map((child) => (
          <ObjView
            key={child.props.id}
            obj={child}
            draggedNode={draggedObj}
            selectedNode={selectedObj}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        ))}
      </div>
    );
  }
}

export const addChild = (card: ObjProps<CardSchema>, child: Obj<unknown>) => {
  card.childIds[child.props.id] = true;
};

export const removeChild = (
  card: ObjProps<CardSchema>,
  child: Obj<unknown>
) => {
  delete card.childIds[child.props.id];
};
