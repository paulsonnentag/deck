import { DocHandle } from "@automerge/automerge-repo";
import { v4 as uuid } from "uuid";
import { Node, NodeView, NodeViewProps } from "./node";
import { loadNode, NodesDoc } from "./nodes";
import {
  Inspector,
  InspectorDivider,
  FillMode,
  colorToHex,
  Color,
  colorToBackgroundColorHex,
} from "./inspector";
import { ColorPicker } from "./inspector";

export type CardProps = {
  type: "card";
  id: string;
  x: number;
  y: number;
  width: number | "100%";
  height: number | "100%";
  childIds: Record<string, true>;
  color?: Color;
  fillMode?: FillMode;
};

export type CardPropsWithChildren = Omit<CardProps, "childIds"> & {
  children: Node[];
};

export class Card extends Node {
  constructor(
    public docHandle: DocHandle<NodesDoc>,
    public id: string,
    public x: number,
    public y: number,
    public width: number | "100%",
    public height: number | "100%",
    public children: Node[],
    public color?: Color,
    public fillMode?: FillMode
  ) {
    super();
  }

  serialize(): CardProps {
    const props: CardProps = {
      type: "card",
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      childIds: Object.fromEntries(
        this.children.map((child) => [child.id, true])
      ),
    };

    if (this.color) {
      props.color = this.color;
    }

    if (this.fillMode) {
      props.fillMode = this.fillMode;
    }

    return props;
  }

  serializeWithChildren(): CardPropsWithChildren {
    const props = this.serialize() as any;

    delete props.childIds;

    return {
      ...props,
      children: this.children.map((child) =>
        child instanceof Card
          ? child.serializeWithChildren()
          : child.serialize()
      ),
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
    const props: Omit<CardProps, "type" | "id" | "childIds"> & {
      children?: Node[];
    } = {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      children: this.children.map((child) => child.copy()),
    };

    if (this.color) {
      props.color = this.color;
    }

    if (this.fillMode) {
      props.fillMode = this.fillMode;
    }

    return Card.create(this.docHandle, props);
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
      ),
      props.color,
      props.fillMode
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
      props.children ?? [],
      props.color,
      props.fillMode
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
    onFocus,
  }: NodeViewProps) {
    const isBeingDragged = draggedNode?.id === this.id;
    const isSelected = selectedNode?.id === this.id;
    const isRoot = !this.parent;

    const style: React.CSSProperties = {
      position: "absolute",
      width: this.width === "100%" ? "100%" : `${this.width}px`,
      height: this.height === "100%" ? "100%" : `${this.height}px`,
      transform: `translate(${this.x}px, ${this.y}px)`,
    };

    if (!isRoot) {
      style.backgroundColor =
        this.fillMode === "solid"
          ? colorToBackgroundColorHex(this.color)
          : "transparent";
      style.borderColor = colorToHex(this.color);
    }

    return (
      <div
        className={`
          ${isRoot ? "bg-gray-100" : "bg-white rounded-md border-2"}
          ${isBeingDragged && !isRoot ? "pointer-events-none" : ""} 
          ${isSelected ? "outline outline-blue-500" : ""}
        `}
        style={style}
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
