import { DocHandle } from "@automerge/automerge-repo";
import { v4 as uuid } from "uuid";
import { Node, NodeViewProps } from "./node";
import { NodesDoc } from "./nodes";

export type FieldProps = {
  type: "field";
  id: string;
  x: number;
  y: number;
  value: string;
};

export class Field extends Node {
  constructor(
    private docHandle: DocHandle<NodesDoc>,
    public id: string,
    public x: number,
    public y: number,
    public value: string
  ) {
    super();
  }

  serialize(): FieldProps {
    return {
      type: "field",
      id: this.id,
      x: this.x,
      y: this.y,
      value: this.value,
    };
  }

  update(callback: (props: FieldProps) => void) {
    this.docHandle.change((doc) => {
      callback(doc.nodes[this.id] as FieldProps);
    });
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
    const field = new Field(docHandle, id, props.x, props.y, props.value);

    nodes[id] = field;

    return field;
  }

  static create(
    docHandle: DocHandle<NodesDoc>,
    props: Omit<FieldProps, "type" | "id"> & {
      id?: string;
    }
  ) {
    const field = new Field(
      docHandle,
      props.id ?? uuid(),
      props.x,
      props.y,
      props.value
    );

    docHandle.change((doc) => {
      doc.nodes[field.id] = field.serialize();
    });

    return field;
  }

  view(props: NodeViewProps) {
    return (
      <div
        style={{
          position: "absolute",
          transform: `translate(${this.x}px, ${this.y}px)`,
        }}
        onPointerDown={(e) => props.onPointerDown(e, this)}
        onPointerMove={(e) => props.onPointerMove(e, this)}
        onPointerUp={(e) => props.onPointerUp(e, this)}
      >
        <input
          type="text"
          value={this.value}
          onChange={(e) =>
            this.update((props) => {
              props.value = e.target.value;
            })
          }
        />
      </div>
    );
  }
}
