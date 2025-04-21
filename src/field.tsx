import { uuid } from "@automerge/automerge";
import {
  BaseProps,
  create,
  Expression,
  findOrCreate,
  isExpression,
  ObjView,
  ObjViewProps,
  PersistedObject,
} from "./Obj";
import { Color, colorToHex, FontSize, fontSizeToPx } from "./Inspector";
import { TextInput } from "./TextInput";
import { Card, CardProps, wrapCard } from "./Card";
export type FieldProps = BaseProps & {
  type: "field";
  value: string | Expression;
  color?: Color;
  fontSize?: FontSize;
};

export class Field extends PersistedObject<FieldProps> {
  copy(): Field {
    return create<Field, FieldProps>(Field, {
      ...structuredClone(this.props),
    });
  }

  view({
    draggedNode,
    selectedNode,
    isParentLocked,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }: ObjViewProps) {
    const value = this.props.value;
    const color = this.get("color") ?? "black";
    const fontSize = this.get("fontSize") ?? "s";
    const id = this.get("id");
    const x = this.get("x");
    const y = this.get("y");
    const isSelfLocked = this.get("isLocked");
    const isLocked = isSelfLocked || isParentLocked;

    const isBeingDragged = draggedNode?.props.id === id;
    const isSelected = selectedNode?.props.id === id;

    const source = isExpression(value) ? `=${value.source}` : value;

    const result = isExpression(value)
      ? this.parent()!.evaluate(value.source)
      : value;

    if (result instanceof Card) {
      const container = findOrCreate<Card, CardProps>(Card, {
        type: "card",
        id: `container-card-${id}`,
        x,
        y,
        width: 100,
        height: 100,
        childIds: {},
      });

      container.parentId = this.parentId;

      const wrappedCard = wrapCard(container, result);

      return (
        <ObjView
          obj={wrappedCard}
          draggedNode={draggedNode}
          selectedNode={selectedNode}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          isParentLocked={isParentLocked}
        />
      );
    }

    return (
      <div
        className={`px-1 border
          ${isSelected ? "border-blue-500" : "border-transparent"}
          ${isBeingDragged ? "pointer-events-none" : ""}
          ${isLocked ? "select-none" : ""}
        `}
        style={{
          position: "absolute",
          transform: `translate(${x}px, ${y}px)`,
          fontSize: fontSizeToPx(fontSize),
          color: colorToHex(color),
        }}
        onPointerDown={(e) => {
          if (isParentLocked) {
            return;
          }

          onPointerDown(e, this);
        }}
        onPointerMove={(e) => {
          if (isParentLocked) {
            return;
          }

          onPointerMove(e, this);
        }}
        onPointerUp={(e) => {
          if (isParentLocked) {
            return;
          }

          onPointerUp(e, this);
        }}
      >
        {isSelected ? (
          <TextInput
            disabled={isLocked}
            focus={isSelected}
            className="outline-none"
            value={source}
            onChange={(value) => {
              this.update((props) => {
                props.value = value.startsWith("=")
                  ? {
                      type: "expression",
                      source: value.slice(1),
                    }
                  : value;
              });
            }}
            onKeyDown={async (e) => {
              e.stopPropagation();
              if (e.key === "Backspace") {
                if (source.length === 0) {
                  this.destroy();
                }
              }
            }}
          />
        ) : (
          result.toString()
        )}
      </div>
    );
  }
}
