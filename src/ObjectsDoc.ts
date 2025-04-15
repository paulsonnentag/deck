import { DocHandle, DocumentId, Repo } from "@automerge/automerge-repo";
import { Card, CardSchema } from "./Card";
import { Field, FieldSchema } from "./Field";
import { Obj, ObjProps } from "./Obj";
import { uuid } from "@automerge/automerge";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { useMemo } from "react";
import { shouldNeverHappen } from "./utils";
import { applyRules } from "./rules";

export type ObjectsDoc = {
  rootObjectId: string;
  objects: Record<string, ObjProps<CardSchema | FieldSchema>>;
};

export const createObjectsDoc = (repo: Repo): DocHandle<ObjectsDoc> => {
  const rootCardProps: ObjProps<CardSchema> = {
    type: "card",
    id: uuid(),
    x: 0,
    y: 0,
    width: "100%",
    height: "100%",
    childIds: {},
  };

  return repo.create({
    rootObjectId: rootCardProps.id,
    objects: {
      [rootCardProps.id]: rootCardProps,
    },
  });
};

export const loadObjects = (
  docHandle: DocHandle<ObjectsDoc>
): {
  objects: Record<string, Obj<unknown>>;
  createObject: {
    (props: ObjProps<CardSchema>): Card;
    (props: ObjProps<FieldSchema>): Field;
  };
} => {
  const objects: Record<string, Obj> = {};

  const getObjectById = (id: string) => {
    if (objects[id]) {
      return objects[id];
    }

    const props = docHandle.docSync()!.objects[id];
    if (!props) {
      shouldNeverHappen(`Object ${id} not found`);
    }

    switch (props.type) {
      case "card":
        return new Card(props, getObjectById, docHandle) as Obj;
      case "field":
        return new Field(props, getObjectById, docHandle) as Obj;

      default:
        throw new Error(`Unknown object: ${JSON.stringify(props)}`);
    }
  };

  function createObject(props: ObjProps<CardSchema>): Card;
  function createObject(props: ObjProps<FieldSchema>): Field;
  function createObject(
    props: ObjProps<CardSchema | FieldSchema>
  ): Obj<CardSchema | FieldSchema> {
    switch (props.type) {
      case "card": {
        const card = new Card(props, getObjectById, docHandle);
        docHandle.change((doc) => {
          doc.objects[card.props.id] = card.props;
        });

        return card;
      }
      case "field": {
        const field = new Field(props, getObjectById, docHandle);
        docHandle.change((doc) => {
          doc.objects[field.props.id] = field.props;
        });

        return field;
      }
    }
  }

  for (const id of Object.keys(docHandle.docSync()!.objects)) {
    objects[id] = getObjectById(id);
  }

  return { objects, createObject };
};

export const useObjects = (
  documentId: DocumentId
): {
  objects: Record<string, Obj<unknown>>;
  createObject: {
    (props: ObjProps<CardSchema>): Card;
    (props: ObjProps<FieldSchema>): Field;
  };
} => {
  const docHandle = useHandle<ObjectsDoc>(documentId);
  const [doc] = useDocument<ObjectsDoc>(documentId);

  return useMemo(() => {
    if (!doc || !docHandle) {
      return {
        objects: {},
        createObject: (props: ObjProps<CardSchema | FieldSchema>) => {
          throw new Error("No doc handle");
        },
      };
    }

    const { objects, createObject } = loadObjects(docHandle);

    applyRules(objects);

    return { objects, createObject };
  }, [doc, docHandle]);
};
