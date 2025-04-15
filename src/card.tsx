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

    const newCard = new Card(copiedProps, this.getObjectById, this.docHandle);

    this.docHandle.change((doc) => {
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

  toPromptXml(indentation: string = ""): string {
    const { type, childIds, ...attributes } = this.props;
    const children = this.children();

    if (children.length === 0) {
      return `${indentation}<${type} ${Object.entries(attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(" ")} />`;
    }

    return `${indentation}<${type} ${Object.keys(attributes)
      .map((key) => `${key}="${this.get(key as keyof CardSchema)}"`)
      .join(" ")}>\n${children
      .map((child) => child.toPromptXml(indentation + "  "))
      .join("\n")}\n${indentation}</${type}>`;
  }

  view({
    draggedNode: draggedObj,
    selectedNode: selectedObj,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }: ObjViewProps) {
    const id = this.get("id");
    const width = this.get("width");
    const height = this.get("height");
    const x = this.get("x");
    const y = this.get("y");
    const fillMode = this.get("fillMode");
    const color = this.get("color") ?? "black";

    const isBeingDragged = draggedObj?.get("id") === id;
    const isSelected = selectedObj?.get("id") === id;
    const isRoot = !this.parent();

    const style: React.CSSProperties = {
      position: "absolute",
      width: width === "100%" ? "100%" : `${width}px`,
      height: height === "100%" ? "100%" : `${height}px`,
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
          ${isRoot ? "bg-gray-100" : "bg-white rounded-md border-2"}
          ${isBeingDragged && !isRoot ? "pointer-events-none" : ""} 
          ${isSelected ? "shadow-solid" : ""}
        `}
        style={style}
        onPointerDown={(e) => onPointerDown(e, this as Obj)}
        onPointerMove={(e) => onPointerMove(e, this as Obj)}
        onPointerUp={(e) => onPointerUp(e, this as Obj)}
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
