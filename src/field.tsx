import { Obj, ObjViewProps } from "./Obj";
import { Color, colorToHex, FontSize, fontSizeToPx } from "./Inspector";
import { generateRuleSource } from "./rules";
import { TextInput } from "./text-input";

type Rule =
  | {
      type: "pending";
    }
  | {
      type: "source";
      source: string;
    };

export type FieldSchema = {
  type: "field";
  value: string;
  color?: Color;
  fontSize?: FontSize;
  rule?: Rule;
};

export class Field extends Obj<FieldSchema> {
  toPromptXml(indentation: string): string {
    const { type, ...attributes } = this.props;

    return `${indentation}<${type} ${Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ")} />`;
  }

  encodeForPrompt(indentation: string): string {
    return `${indentation}<${this.props.type} ${Object.entries(this.props)
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ")} />`;
  }

  copy(): Field {
    const copiedProps = this.copyProps();
    const newField = new Field(copiedProps, this.getObjectById, this.updateDoc);

    this.updateDoc((doc) => {
      doc.objects[newField.props.id] = newField.props;
    });

    return newField;
  }

  view({
    draggedNode,
    selectedNode,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }: ObjViewProps) {
    const { value, color, fontSize, rule, id, x, y } = this.props;

    const isBeingDragged = draggedNode?.props.id === id;
    const isSelected = selectedNode?.props.id === id;

    const isRulePending = rule?.type === "pending";
    const hasRule = rule !== undefined;

    const onPrompt = async () => {
      // don't allow explanations in root node
      if (!this.parent()!.parent()) {
        return;
      }

      this.update((props) => {
        props.rule = {
          type: "pending",
        };
      });

      const source = await generateRuleSource(value, this.parent()!);

      this.update((props) => {
        if (!source) {
          delete props.rule;
        } else {
          props.rule = {
            type: "source",
            source,
          };
        }
      });
    };

    return (
      <div
        className={`px-1 border          
          ${hasRule ? "bg-gray-200" : ""}
          ${isRulePending ? "animate-pulse bg-gray-200" : ""}
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
        {
          <TextInput
            focus={isSelected}
            className="outline-none"
            value={value}
            onChange={(value) =>
              this.update((props) => {
                props.value = value;
                delete props.rule;
              })
            }
            onKeyDown={async (e) => {
              e.stopPropagation();
              if (e.key === "Backspace") {
                if (value.length === 0) {
                  this.destroy();
                }
              }

              if (e.key === "Enter" && e.metaKey) {
                e.preventDefault();
                onPrompt();
              }
            }}
          />
        }
      </div>
    );
  }
}
