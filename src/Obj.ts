import { DocHandle } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { useMemo } from "react";
import { Card, CardProps } from "./Card";
import { Field, FieldProps } from "./Field";
import { shouldNeverHappen } from "./utils";
import { applyExtensions } from "./extensions";
import { uuid } from "@automerge/automerge";
import * as API from "./api";

export type Expression = {
  type: "expression";
  source: string;
};

export const isExpression = (value: any): value is Expression => {
  return (
    typeof value === "object" && "type" in value && value.type === "expression"
  );
};

export type BaseProps = {
  id: string;
  x: number;
  y: number;
  isLocked?: boolean;
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
    const parent = this.parent();

    if (parent) {
      parent.removeChild(this as Obj);
    }

    getObjectDocHandle().change((doc) => {
      delete doc.objects[this.props.id];
    });
  }

  get<K extends keyof T>(key: K): T[K] {
    const value = this.props[key];

    if (isExpression(value)) {
      return this.evaluate(value.source);
    }

    return value;
  }

  evaluate(expression: string) {
    try {
      return new Function(
        "props",
        "API",
        `with ({...API, ...props}) { return ${expression} }`
      )(this, API);
    } catch (error) {
      console.error(error);
      return "Error";
    }
  }

  abstract copy(): PersistedObject<T>;
  abstract view(props: ObjViewProps): React.ReactNode;
}

let objectsDocHandle: DocHandle<ObjectDoc> | null = null;
let objects: Record<string, Obj> = {};

export const registerObjectsDocHandle = (docHandle: DocHandle<ObjectDoc>) => {
  objectsDocHandle = docHandle;
};

export const getObjectDocHandle = (): DocHandle<ObjectDoc> => {
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

  if (!props) {
    shouldNeverHappen(`Object with id ${id} not found`);
  }

  const obj = objFromProps(props);
  objects[id] = obj;
  return obj;
};

const objFromProps = (props: ObjProps): Obj => {
  switch (props.type) {
    case "card": {
      return new Card(props);
    }
    case "field": {
      return new Field(props);
    }
  }
};

export const findOrCreate = <
  Obj extends PersistedObject<P>,
  P extends ObjProps
>(
  constructor: new (props: P) => Obj,
  props: P,
  create?: (obj: Obj) => void
): Obj => {
  let obj = objects[props.id] as Obj;
  if (obj) {
    console.log("find", props.id);
    return obj;
  }

  console.log("create", props.id);

  getObjectDocHandle().change((doc) => {
    doc.objects[props.id] = props;
  });
  obj = new constructor(props);
  objects[props.id] = obj as any;

  create?.(obj);

  return obj;
};

export const create = <Obj extends PersistedObject<P>, P extends ObjProps>(
  constructor: new (props: P) => Obj,
  props: Omit<P, "id">
): Obj => {
  const id = uuid();
  const propsWithId = { ...props, id } as P;

  getObjectDocHandle().change((doc) => {
    doc.objects[id] = propsWithId;
  });

  return new constructor(propsWithId);
};

export const updateExtensionState = <T>(
  props: T & BaseProps,
  callback: (props: T) => void
) => {
  getObjectDocHandle().change((doc) => {
    callback(doc.objects[props.id] as T);
  });
};

export type ObjViewProps = {
  isParentLocked?: boolean;
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

    for (const obj of Object.values(doc.objects)) {
      getObjectById(obj.id);
    }

    for (const obj of Object.values(objects)) {
      applyExtensions(obj);
    }

    return getObjectById(doc.rootObjectId) as Card;
  }, [doc]);
};
