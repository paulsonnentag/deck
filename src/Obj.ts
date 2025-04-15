import { ObjectsDoc } from "./ObjectsDoc";
import { Card, removeChild } from "./Card";
import { uuid, view } from "@automerge/automerge";
import { objToXML } from "./rules";

export type ObjProps<T = unknown> = {
  type: string;
  id: string;
  copyOf?: string;
  x: number;
  y: number;
  parentId?: string;
} & T;

export abstract class Obj<T = unknown> {
  props: ObjProps<T>;

  constructor(
    props: Omit<ObjProps<T>, "id"> & { id?: string },
    protected getObjectById: (id: string) => Obj,
    protected updateDoc: (callback: (doc: ObjectsDoc) => void) => void
  ) {
    if (props.id) {
      this.props = props as ObjProps<T>;
    } else {
      this.props = { ...props, id: uuid() } as ObjProps<T>;
    }
  }

  parent(): Card | null {
    if (!this.props.parentId) {
      return null;
    }

    return this.getObjectById(this.props.parentId) as Card;
  }

  copyOf() {
    if (!this.props.copyOf) {
      return null;
    }

    return this.getObjectById(this.props.copyOf);
  }

  globalPos(): { x: number; y: number } {
    const { x, y } = this.props;
    const parent = this.parent();
    if (!parent) {
      return { x, y };
    }

    const parentGlobalPos = parent.globalPos();

    return {
      x: x + parentGlobalPos.x,
      y: y + parentGlobalPos.y,
    };
  }

  update(callback: (props: ObjProps<T>) => void) {
    this.updateDoc((doc) => {
      const obj = doc.objects[this.props.id] as unknown as ObjProps<T>;
      if (obj) {
        callback(obj);
      }
    });
  }

  destroy() {
    if (this.parent()) {
      this.parent()!.update((props) => {
        delete props.childIds[this.props.id];
      });
    }

    this.updateDoc((doc) => {
      delete doc.objects[this.props.id];
    });
  }

  serialize(): ObjProps<T> {
    return structuredClone(this.props);
  }

  copyProps(): ObjProps<T> {
    const copiedProps = Object.assign({}, this.props);
    copiedProps.id = uuid();
    copiedProps.copyOf = this.props.id;

    return copiedProps;
  }

  isCopyOf(obj: Obj) {
    if (obj.props.id === this.props.id) {
      return true;
    }

    if (this.copyOf()?.isCopyOf(obj)) {
      return true;
    }

    return false;
  }

  abstract copy(): Obj<T>;
  abstract toPromptXml(indentation: string): string;
  abstract view(props: ObjViewProps): React.ReactNode;
}

export type ObjViewProps = {
  draggedNode: Obj | undefined;
  selectedNode: Obj | undefined;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>, node: Obj) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>, node: Obj) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>, node: Obj) => void;
};

export const ObjView = <T>({
  obj,
  ...props
}: ObjViewProps & { obj: Obj<T> }) => {
  return obj.view(props);
};
