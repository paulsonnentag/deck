import { DocHandle, Repo } from "@automerge/automerge-repo";
import { shouldNeverHappen } from "./utils";
import { Card, CardProps } from "./Card";
import { uuid } from "@automerge/automerge";
import { Field, FieldProps } from "./Field";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { useMemo } from "react";

export type BaseProps = {
  id: string;
  x: number;
  y: number;
};

export type ObjectDoc = {
  rootObjectId: string;
  objects: Record<string, ObjProps>;
};

export type ObjProps = CardProps | FieldProps;

export type Obj = Card | Field;

export abstract class PersistedObject<T extends ObjProps> {
  parentId?: string;

  constructor(public props: T) {}

  parent(): Card | null {
    if (!this.parentId) {
      return null;
    }
    return getObjectById(this.parentId) as Card;
  }

  update(callback: (obj: T) => void) {
    getObjectDocHandle().change((doc) => {
      callback(doc.objects[this.props.id] as T);
    });
  }

  globalPos(): { x: number; y: number } {
    const parent = this.parent();

    if (!parent) {
      return { x: this.props.x, y: this.props.y };
    }

    const parentGlobalPos = parent.globalPos();

    return {
      x: this.props.x + parentGlobalPos.x,
      y: this.props.y + parentGlobalPos.y,
    };
  }

  destroy() {
    getObjectDocHandle().change((doc) => {
      delete doc.objects[this.props.id];
    });
  }

  abstract copy(): PersistedObject<T>;
  abstract view(props: ObjViewProps): React.ReactNode;
}

let objectsDocHandle: DocHandle<ObjectDoc> | null = null;
let objects: Record<string, Obj> = {};

export const registerObjectsDocHandle = (docHandle: DocHandle<ObjectDoc>) => {
  objectsDocHandle = docHandle;
};

const getObjectDocHandle = (): DocHandle<ObjectDoc> => {
  if (!objectsDocHandle) {
    shouldNeverHappen("No objects doc handle registered");
  }
  return objectsDocHandle!;
};

const getObjectDoc = (): ObjectDoc => {
  if (!objectsDocHandle) {
    shouldNeverHappen("No objects doc handle registered");
  }
  return objectsDocHandle!.docSync()!;
};

export const getObjectById = (id: string): Obj => {
  if (objects[id]) {
    return objects[id];
  }

  const doc = getObjectDoc();
  const props = doc.objects[id];

  switch (props.type) {
    case "card": {
      const card = new Card(props);
      objects[id] = card;
      return card;
    }
    case "field": {
      const field = new Field(props);
      objects[id] = field;
      return field;
    }
  }
};

export const create = <Obj extends PersistedObject<P>, P extends ObjProps>(
  constructor: new (props: P) => Obj,
  props: P
): Obj => {
  getObjectDocHandle().change((doc) => {
    doc.objects[props.id] = props;
  });

  return new constructor(props);
};

export const createObjectDoc = (repo: Repo): DocHandle<ObjectDoc> => {
  const childCard: CardProps = {
    id: uuid(),
    x: 100,
    y: 100,
    type: "card",
    width: 200,
    height: 100,
    fillMode: "solid",
    childIds: {},
  };

  const rootCard: CardProps = {
    id: uuid(),
    x: 0,
    y: 0,
    type: "card",
    width: 0,
    height: 0,
    fillMode: "solid",
    childIds: {
      [childCard.id]: true,
    },
  };

  return repo.create({
    rootObjectId: rootCard.id,
    objects: {
      [rootCard.id]: rootCard,
      [childCard.id]: childCard,
    },
  });
};

export type ObjViewProps = {
  draggedNode: Obj | undefined;
  selectedNode: Obj | undefined;
  onPointerDown: (
    event: React.PointerEvent<HTMLDivElement>,
    node: Obj,
    handle?:
      | "top"
      | "bottom"
      | "left"
      | "right"
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
  ) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>, node: Obj) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>, node: Obj) => void;
};

export const ObjView = ({ obj, ...props }: ObjViewProps & { obj: Obj }) => {
  return obj.view(props);
};

export const useRootObject = (): Card | null => {
  const [doc] = useDocument<ObjectDoc>(getObjectDocHandle().url);

  return useMemo(() => {
    if (!doc) {
      return null;
    }

    objects = {};

    return getObjectById(doc.rootObjectId) as Card;
  }, [doc]);
};
