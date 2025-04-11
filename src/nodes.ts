import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { Card, CardProps } from "./card";
import { Field, FieldProps } from "./field";
import { DocHandle, DocumentId } from "@automerge/automerge-repo";
import { Node } from "./node";
import { useMemo } from "react";
import { applyRules, useRules } from "./rules";

export type NodeProps = CardProps | FieldProps;

export type NodesDoc = {
  rootNodeId: string;
  nodes: Record<string, NodeProps>;
};

export const loadNode = (
  docHandle: DocHandle<NodesDoc>,
  objects: Record<string, Node>,
  id: string
): Node => {
  if (objects[id]) {
    return objects[id];
  }

  const doc = docHandle.docSync()!;
  const props = doc.nodes[id];

  switch (props.type) {
    case "card":
      return Card.load(docHandle, id, objects);
    case "field":
      return Field.load(docHandle, id, objects);
  }
};

export const useNodes = (
  documentId: DocumentId
): Record<string, Node> | null => {
  const [nodesDoc] = useDocument<NodesDoc>(documentId);
  const nodesDocHandle = useHandle<NodesDoc>(documentId);

  return useMemo(() => {
    if (!nodesDoc || !nodesDocHandle) {
      return {};
    }

    const nodes = {};

    for (const nodeId of Object.keys(nodesDoc.nodes)) {
      loadNode(nodesDocHandle, nodes, nodeId);
    }

    applyRules(nodes);

    return nodes as Record<string, Node>;
  }, [nodesDoc, nodesDocHandle]);
};
