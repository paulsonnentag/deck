import { DocumentId } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { useCallback, useMemo } from "react";
import { v4 as uuid } from "uuid";

type SerializedObj = {
  id: string;
  prototypeId: string;
  props: Record<string, any>;
};

export type ObjectDoc = {
  objects: Record<string, SerializedObj>;
};

const getBaseObjects = (
  updateObjectDoc: (update: (doc: ObjectDoc) => void) => void
) => {
  const Obj = {
    id: "obj",
    props: {} as any,
    parent: null as any,

    extend({
      props = {},
      id = uuid(),
      ...rest
    }: {
      props?: any;
      id?: string;
      [key: string]: any;
    }) {
      const newObj = Object.create(this);
      newObj.id = id;
      newObj.props = Object.create(this.props);
      newObj.prototype = this;
      Object.assign(newObj.props, props);
      Object.assign(newObj, rest);
      return newObj;
    },

    set(key: string, value: any) {
      updateObjectDoc(({ objects }) => {
        objects[this.id].props[key] = value;
      });
    },

    serialize(): any {
      const ownProperties: any = {};

      for (const [key, value] of Object.entries(this.props)) {
        ownProperties[key] = value;
      }

      return {
        id: this.id,
        prototypeId: Object.getPrototypeOf(this).id,
        props: this.props,
      };
    },

    prototypeOf(obj: any) {
      if (!obj.prototype) {
        return false;
      }

      if (obj.prototype === this) {
        return true;
      }

      return obj.prototype.prototypeOf(this);
    },
  };

  const Card = Obj.extend({
    id: "Card",
    props: {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      color: "#fff",
    },
    view() {
      const { x, y, width, height, color } = this.props;

      return (
        <div
          className="shadow-md border border-gray-100 rounded-md"
          style={{
            position: "absolute",
            width: `${width}px`,
            height: `${height}px`,
            transform: `translate(${x}px, ${y}px)`,
            backgroundColor: color,
          }}
        ></div>
      );
    },
  });

  const Field = Obj.extend({
    id: "Field",
    props: {
      x: 0,
      y: 0,
      value: "",
    },
    view() {
      const { x, y, value } = this.props;

      return (
        <div
          style={{
            position: "absolute",
            transform: `translate(${x}px, ${y}px)`,
          }}
        >
          <input
            type="text"
            value={value}
            onChange={(e) => this.set("value", e.target.value)}
          />
        </div>
      );
    },
  });

  return {
    Card,
    Field,
  };
};

export const getObjects = (
  objectDoc: ObjectDoc,
  updateObjectDoc: (update: (doc: ObjectDoc) => void) => void
): Record<string, any> => {
  const objects: Record<string, any> = getBaseObjects(updateObjectDoc);

  const loadObject = (id: string) => {
    if (objects[id]) {
      return objects[id];
    }

    const { prototypeId, props } = objectDoc.objects[id];
    const prototype: any = loadObject(prototypeId);
    const obj = prototype.extend({ props, id });
    objects[id] = obj;
    return obj;
  };

  for (const id of Object.keys(objectDoc.objects)) {
    loadObject(id);
  }

  return objects;
};

export const useObjects = (
  documentId: DocumentId
): { objects: Record<string, any>; createObject: (object: any) => void } => {
  const [objectDoc, updateObjectDoc] = useDocument<ObjectDoc>(documentId);

  const createObject = useCallback(
    (object: any) => {
      updateObjectDoc(({ objects }) => {
        objects[object.id] = object.serialize();
      });
    },
    [updateObjectDoc]
  );

  return useMemo(() => {
    if (!objectDoc) {
      return { objects: [], createObject };
    }

    return { objects: getObjects(objectDoc, updateObjectDoc), createObject };
  }, [objectDoc, updateObjectDoc, createObject]);
};
