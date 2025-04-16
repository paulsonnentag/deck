import { uuid } from "@automerge/automerge";
import { BaseProps, create, ObjViewProps, PersistedObject } from "./Obj";
import { Color, colorToHex, FontSize, fontSizeToPx } from "./Inspector";
import { TextInput } from "./text-input";

export type FieldProps = BaseProps & {
  type: "field";
  value: string;
  color?: Color;
  fontSize?: FontSize;
};

export class Field extends PersistedObject<FieldProps> {
  copy(): Field {
    return create<Field, FieldProps>(Field, { ...this.props, id: uuid() });
  }

  view({
    draggedNode,
    selectedNode,
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

    const isBeingDragged = draggedNode?.props.id === id;
    const isSelected = selectedNode?.props.id === id;

    return (
      <div
        className={`px-1 border
          ${isSelected ? "border-blue-500" : "border-transparent"}
          ${isBeingDragged ? "pointer-events-none" : ""}
        `}
        style={{
          position: "absolute",
          transform: `translate(${x}px, ${y}px)`,
          fontSize: fontSizeToPx(fontSize),
          color: colorToHex(color),
        }}
        onPointerDown={(e) => onPointerDown(e, this)}
        onPointerMove={(e) => onPointerMove(e, this)}
        onPointerUp={(e) => onPointerUp(e, this)}
      >
        <TextInput
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
      </div>
    );
  }
}
