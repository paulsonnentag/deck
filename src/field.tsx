import { uuid } from "@automerge/automerge";
import { BaseProps, create, Obj, ObjViewProps, PersistedObject } from "./Obj";
import { Color, colorToHex, FontSize, fontSizeToPx } from "./Inspector";
import { TextInput } from "./TextInput";

type FieldValue = string | { expression: string; objId?: string };

export type FieldProps = BaseProps & {
  type: "field";
  value: FieldValue;
  color?: Color;
  fontSize?: FontSize;
};

export class Field extends PersistedObject<FieldProps> {
  copy(): Field {
    return create<Field, FieldProps>(Field, {
      ...structuredClone(this.props),
      id: uuid(),
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
    const color = this.props.color ?? "black";
    const fontSize = this.props.fontSize ?? "s";
    const id = this.props.id;
    const x = this.props.x;
    const y = this.props.y;
    const isSelfLocked = this.props.isLocked;
    const isLocked = isSelfLocked || isParentLocked;

    const isBeingDragged = draggedNode?.props.id === id;
    const isSelected = selectedNode?.props.id === id;

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
          if (isLocked) {
            return;
          }

          onPointerDown(e, this);
        }}
        onPointerMove={(e) => {
          if (isLocked) {
            return;
          }

          onPointerMove(e, this);
        }}
        onPointerUp={(e) => {
          if (isLocked) {
            return;
          }

          onPointerUp(e, this);
        }}
      >
        {typeof value === "string" ? (
          <TextInput
            disabled={isLocked}
            focus={isSelected}
            className="outline-none"
            value={value}
            onChange={(value) =>
              this.update((props) => {
                props.value = value;
              })
            }
            onKeyDown={async (e) => {
              e.stopPropagation();
              if (e.key === "Backspace") {
                if (value.length === 0) {
                  this.destroy();
                }
              }
            }}
          />
        ) : (
          <div className="text-gray-500">
            {evaluateExpression(this.parent()!, value.expression)}
          </div>
        )}
      </div>
    );
  }
}

const evaluateExpression = (obj: Obj, expression: string) => {
  try {
    return new Function("props", `with (props) { return ${expression} }`)(
      obj.props
    );
  } catch (e) {
    return "Error";
  }
};
