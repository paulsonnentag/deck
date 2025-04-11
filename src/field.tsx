import { DocHandle } from "@automerge/automerge-repo";
import { v4 as uuid } from "uuid";
import { Node, NodeViewProps } from "./node";
import { NodesDoc } from "./nodes";
import { Color, colorToHex, FontSize, fontSizeToPx } from "./inspector";
import { TextInput } from "./text-input";
import { generateRule, generateRuleSource } from "./rules";

type Rule =
  | {
      type: "pending";
    }
  | {
      type: "source";
      source: string;
    };

export type FieldProps = {
  type: "field";
  id: string;
  copyOf?: string;
  x: number;
  y: number;
  value: string;
  color?: Color;
  fontSize?: FontSize;
  rule?: Rule;
};

export class Field extends Node {
  constructor(
    public docHandle: DocHandle<NodesDoc>,
    public id: string,
    public x: number,
    public y: number,
    public value: string,
    public color?: Color,
    public fontSize?: FontSize,
    public rule?: Rule
  ) {
    super();
  }

  serialize(): FieldProps {
    const props: FieldProps = {
      type: "field",
      id: this.id,
      x: this.x,
      y: this.y,
      value: this.value,
    };

    if (this.color) {
      props.color = this.color;
    }

    if (this.fontSize) {
      props.fontSize = this.fontSize;
    }

    return props;
  }

  update(callback: (props: FieldProps) => void) {
    this.docHandle.change((doc) => {
      const node = doc.nodes[this.id];
      // only run callback if node exists
      if (node) {
        callback(node as FieldProps);
      }
    });
  }

  copy(): Node {
    const props: Omit<FieldProps, "type" | "id"> & {
      id?: string;
      copyOf?: string;
    } = {
      x: this.x,
      y: this.y,
      value: this.value,
    };

    if (this.color) {
      props.color = this.color;
    }

    if (this.fontSize) {
      props.fontSize = this.fontSize;
    }

    return Field.create(this.docHandle, props);
  }

  static load(
    docHandle: DocHandle<NodesDoc>,
    id: string,
    nodes: Record<string, Node>
  ): Field {
    if (nodes[id]) {
      return nodes[id] as Field;
    }

    const props = docHandle.docSync()!.nodes[id] as FieldProps;
    const field = new Field(
      docHandle,
      id,
      props.x,
      props.y,
      props.value,
      props.color,
      props.fontSize,
      props.rule
    );
    nodes[id] = field;

    return field;
  }

  static create(
    docHandle: DocHandle<NodesDoc>,
    props: Omit<FieldProps, "type" | "id"> & {
      id?: string;
      copyOf?: string;
    }
  ) {
    const field = new Field(
      docHandle,
      props.id ?? uuid(),
      props.x,
      props.y,
      props.value,
      props.color,
      props.fontSize,
      props.rule
    );

    docHandle.change((doc) => {
      doc.nodes[field.id] = field.serialize();
    });

    return field;
  }

  view({
    draggedNode,
    selectedNode,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }: NodeViewProps) {
    const isBeingDragged = draggedNode?.id === this.id;
    const isSelected = selectedNode?.id === this.id;

    const isRulePending = this.rule?.type === "pending";
    const hasRule = this.rule !== undefined;

    const onPrompt = async () => {
      this.update((props) => {
        props.rule = {
          type: "pending",
        };
      });

      console.log(this.parent?.serializeWithChildren());

      const source = await generateRuleSource(this.value, this.parent!);

      console.log("source", source);

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
          transform: `translate(${this.x}px, ${this.y}px)`,
        }}
        onPointerDown={(e) => onPointerDown(e, this)}
        onPointerMove={(e) => onPointerMove(e, this)}
        onPointerUp={(e) => onPointerUp(e, this)}
      >
        {
          <TextInput
            focus={isSelected}
            className="outline-none"
            value={this.value}
            onChange={(value) =>
              this.update((props) => {
                props.value = value;
                delete props.rule;
              })
            }
            onKeyDown={async (e) => {
              e.stopPropagation();
              if (e.key === "Backspace") {
                if (this.value.length === 0) {
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

/*

{false && <input
            className="outline-none"
            type="text"
            value={this.value}
            onChange={(e) =>
              this.update((props) => {
                props.value = e.target.value;
              })
            }
            style={{
              color: colorToHex(this.color),
              fontSize: fontSizeToPx(this.fontSize),
            }}
            onFocus={(e) => onFocus(e, this)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Backspace") {
                if (this.value.length === 0) {
                  this.destroy();
                }
              }
            }}
          />}

*/
