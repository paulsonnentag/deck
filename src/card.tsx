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
  childIds: string[];
};

export class Card extends Node {
  constructor(
    private docHandle: DocHandle<NodesDoc>,
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
    return {
      type: "card",
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      childIds: this.children.map((child) => child.id),
    };
  }

  update(callback: (props: CardProps) => void) {
    this.docHandle.change((doc) => {
      callback(doc.nodes[this.id] as CardProps);
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
      props.childIds.map((childId) => loadNode(docHandle, nodes, childId))
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
  }: NodeViewProps) {
    const isBeingDragged = draggedNode?.id === this.id;
    const isSelected = selectedNode?.id === this.id;
    const isRoot = !this.parent;

    return (
      <div
        className={`shadow-md 
          ${isRoot ? "bg-gray-100" : "bg-white border rounded-md"}
          ${isBeingDragged ? "pointer-events-none" : ""} 
          ${isSelected ? "border-blue-500 z-1" : "border-gray-100 "}`}
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
          />
        ))}
      </div>
    );
  }
}
