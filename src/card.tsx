import { DocHandle } from "@automerge/automerge-repo";
import { v4 as uuid } from "uuid";
import { Node, NodeView, NodeViewProps } from "./node";
import { loadNode, NodesDoc } from "./nodes";

export type CardProps = {
  type: "card";
  id: string;
  x: number;
  y: number;
  width: number | "100%";
  height: number | "100%";
  childIds: Record<string, true>;
};

export class Card extends Node {
  constructor(
    public docHandle: DocHandle<NodesDoc>,
    public id: string,
    public x: number,
    public y: number,
    public width: number | "100%",
    public height: number | "100%",
    public children: Node[]
  ) {
    super();
  }

  serialize(): CardProps {
    const childIds: Record<string, true> = {};
    for (const child of this.children) {
      childIds[child.id] = true;
    }

    return {
      type: "card",
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      childIds,
    };
  }

  update(callback: (props: CardProps) => void) {
    this.docHandle.change((doc) => {
      const node = doc.nodes[this.id] as CardProps;
      // only run callback if node exists
      if (node) {
        callback(doc.nodes[this.id] as CardProps);
      }
    });
  }

  destroy() {
    super.destroy();

    this.children.forEach((child) => {
      child.destroy();
    });
  }

  copy(): Node {
    return Card.create(this.docHandle, {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      children: this.children.map((child) => child.copy()),
    });
  }

  static load(
    docHandle: DocHandle<NodesDoc>,
    id: string,
    nodes: Record<string, Node>
  ): Card {
    if (nodes[id]) {
      return nodes[id] as Card;
    }

    const props = docHandle.docSync()!.nodes[id] as CardProps;

    const card = new Card(
      docHandle,
      id,
      props.x,
      props.y,
      props.width,
      props.height,
      Object.keys(props.childIds).map((childId) =>
        loadNode(docHandle, nodes, childId)
      )
    );

    for (const child of card.children) {
      child.parent = card;
    }

    nodes[id] = card;

    return card;
  }

  static create(
    docHandle: DocHandle<NodesDoc>,
    props: Omit<CardProps, "type" | "id" | "childIds"> & {
      id?: string;
      children?: Node[];
    }
  ) {
    const card = new Card(
      docHandle,
      props.id ?? uuid(),
      props.x,
      props.y,
      props.width,
      props.height,
      props.children ?? []
    );

    docHandle.change((doc) => {
      doc.nodes[card.id] = card.serialize();
    });

    return card;
  }

  view({
    draggedNode,
    selectedNode,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onBlur,
    onFocus,
  }: NodeViewProps) {
    const isBeingDragged = draggedNode?.id === this.id;
    const isSelected = selectedNode?.id === this.id;
    const isRoot = !this.parent;

    return (
      <div
        className={`shadow-md 
          ${isRoot ? "bg-gray-100" : "bg-white border rounded-md"}
          ${isBeingDragged && !isRoot ? "pointer-events-none" : ""} 
          ${isSelected ? "border-blue-500" : "border-gray-100 "}`}
        style={{
          position: "absolute",
          width: this.width === "100%" ? "100%" : `${this.width}px`,
          height: this.height === "100%" ? "100%" : `${this.height}px`,
          transform: `translate(${this.x}px, ${this.y}px)`,
        }}
        onPointerDown={(e) => onPointerDown(e, this)}
        onPointerMove={(e) => onPointerMove(e, this)}
        onPointerUp={(e) => onPointerUp(e, this)}
      >
        {this.children.map((child) => (
          <NodeView
            key={child.id}
            node={child}
            draggedNode={draggedNode}
            selectedNode={selectedNode}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onBlur={onBlur}
            onFocus={onFocus}
          />
        ))}
      </div>
    );
  }
}
