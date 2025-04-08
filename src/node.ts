import { Card } from "./card";

export abstract class Node {
  parent?: Card;

  abstract id: string;
  abstract x: number;
  abstract y: number;
  abstract view(props: NodeViewProps): React.ReactNode;
  abstract update(callback: (props: { x: number; y: number }) => void): void;

  globalPos(): { x: number; y: number } {
    if (this.parent) {
      return {
        x: this.x + this.parent.globalPos().x,
        y: this.y + this.parent.globalPos().y,
      };
    }
    return { x: this.x, y: this.y };
  }
}

export type NodeViewProps = {
  draggedNode: Node | undefined;
  selectedNode: Node | undefined;
  onPointerDown: (
    event: React.PointerEvent<HTMLDivElement>,
    node: Node
  ) => void;
  onPointerMove: (
    event: React.PointerEvent<HTMLDivElement>,
    node: Node
  ) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>, node: Node) => void;
};

export const NodeView = ({
  node,
  ...props
}: NodeViewProps & { node: Node }) => {
  return node.view(props);
};
