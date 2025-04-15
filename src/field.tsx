import { Obj, ObjViewProps } from "./Obj";
import { Color, colorToHex, FontSize, fontSizeToPx } from "./Inspector";
import { generateRuleSource, Rule } from "./rules";
import { TextInput } from "./text-input";
import { uuid } from "@automerge/automerge";

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
    const newField = new Field(copiedProps, this.getObjectById, this.docHandle);

    this.docHandle.change((doc) => {
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
    const value = this.get("value");
    const color = this.get("color") ?? "black";
    const fontSize = this.get("fontSize") ?? "16px";
    const rule = this.get("rule");
    const id = this.get("id");
    const x = this.get("x");
    const y = this.get("y");

    const isBeingDragged = draggedNode?.get("id") === id;
    const isSelected = selectedNode?.get("id") === id;

    const isRulePending = rule?.definition.type === "pending";
    const hasRule = rule !== undefined;

    const onPrompt = async () => {
      // don't allow explanations in root node
      if (!this.parent()!.parent()) {
        return;
      }

      this.update((props) => {
        props.rule = {
          createdAt: this.docHandle.heads()!,
          id: uuid(),
          definition: {
            type: "pending",
          },
        };
      });

      const source = await generateRuleSource(value, this.parent()!);

      this.update((props) => {
        if (!source) {
          delete props.rule;
        } else {
          props.rule = {
            createdAt: this.docHandle.heads()!,
            id: props.rule!.id,
            definition: {
              type: "source",
              source,
            },
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
        onPointerDown={(e) => onPointerDown(e, this as Obj)}
        onPointerMove={(e) => onPointerMove(e, this as Obj)}
        onPointerUp={(e) => onPointerUp(e, this as Obj)}
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
