import { DocumentId } from "@automerge/automerge-repo";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
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

type ViewProps = {
  draggedObj?: any;
  selectedObj?: any;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, obj: any) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>, obj: any) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>, obj: any) => void;
};

const getBaseObjects = (
  updateObjectDoc: (update: (doc: ObjectDoc) => void) => void
) => {
  const Obj = {
    id: "obj",
    props: {} as any,
    parent: null as any,

    _extend({
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
      Object.assign(newObj.props, props);
      Object.assign(newObj, rest);
      return newObj;
    },

    extend(args: any) {
      const newObj = this._extend(args);

      console.log("new thing", { newObj });

      updateObjectDoc(({ objects }) => {
        objects[newObj.id] = newObj.serialize();
      });

      return newObj;
    },

    copy() {
      const newObj = Object.create(Object.getPrototypeOf(this));
      newObj.id = uuid();
      newObj.props = Object.assign({}, this.props);

      updateObjectDoc(({ objects }) => {
        const serialized = this.serialize();
        objects[newObj.id] = serialized;
      });

      return newObj;
    },

    update(fn: (props: Record<string, any>) => Record<string, any>) {
      updateObjectDoc(({ objects }) => {
        const changedProps: Record<string, any> = fn(objects[this.id].props);

        console.log("changedProps", { changedProps });

        const obj = objects[this.id];
        for (const [key, value] of Object.entries(changedProps)) {
          obj.props[key] = value;
        }
      });
    },

    set(key: string, value: any) {
      updateObjectDoc(({ objects }) => {
        objects[this.id].props[key] = value;
      });
    },

    destroy() {
      updateObjectDoc(({ objects }) => {
        delete objects[this.id];
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
  };

  const card = Obj._extend({
    id: "card",
    props: {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      color: "#fff",
    },
    view({
      draggedObj,
      selectedObj,
      onPointerDown,
      onPointerMove,
      onPointerUp,
    }: ViewProps) {
      const { x, y, width, height, color } = this.props;
      const isBeingDragged = draggedObj === this;
      const isSelected = selectedObj?.id === this.id;

      return (
        <div
          className={`shadow-md border rounded-md ${
            isBeingDragged ? "pointer-events-none" : ""
          } ${isSelected ? "border-blue-500 z-1" : "border-gray-100 "}`}
          style={{
            position: "absolute",
            width: `${width}px`,
            height: `${height}px`,
            transform: `translate(${x}px, ${y}px)`,
            backgroundColor: color,
          }}
          onPointerDown={(e) => onPointerDown(e, this)}
          onPointerMove={(e) => onPointerMove(e, this)}
          onPointerUp={(e) => onPointerUp(e, this)}
        ></div>
      );
    },
  });

  const field = Obj._extend({
    id: "field",
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
    card,
    field,
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
    const obj = prototype._extend({ props, id });

    objects[id] = obj;
    return obj;
  };

  for (const id of Object.keys(objectDoc.objects)) {
    loadObject(id);
  }

  return objects;
};

export const useObjects = (documentId: DocumentId): Record<string, any> => {
  const [objectDoc, updateObjectDoc] = useDocument<ObjectDoc>(documentId);

  return useMemo(() => {
    if (!objectDoc) {
      return {};
    }

    const objects = getObjects(objectDoc, updateObjectDoc);

    // dummy rule to test dynamic changes
    for (const obj of Object.values(objects)) {
      console.log("obj", obj.props.y);

      if (obj.props.y > 500) {
        obj.props.color = "oklch(96.7% 0.003 264.542)";
        console.log("obj", obj);
      }
    }

    return objects;

    return objects;
  }, [objectDoc, updateObjectDoc]);
};
