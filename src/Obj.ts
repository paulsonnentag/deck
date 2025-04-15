import * as Automerge from "@automerge/automerge/next";
import { ObjectsDoc } from "./ObjectsDoc";
import { Card, removeChild } from "./Card";
import { Heads, uuid, view } from "@automerge/automerge";
import { objToXML, Rule, RuleWithDefinition } from "./rules";
import { DocHandle } from "@automerge/automerge-repo";
import { Field } from "./Field";
import { isEmpty } from "./utils";

export type ObjProps<T = unknown> = {
  type: string;
  id: string;
  copyOf?: string;
  x: number;
  y: number;
  parentId?: string;
} & T;

type OverrideValue = {
  value: any;
  rule: Rule;
  isActive: boolean;
};

export abstract class Obj<T = unknown> {
  props: ObjProps<T>;

  overrides: Record<string, OverrideValue[]> = {};
  get(key: keyof ObjProps<T>) {
    const overrides = this.overrides[key as string];

    if (overrides) {
      return overrides.find((override: OverrideValue) => override.isActive)
        ?.value;
    }

    return this.props[key];
  }

  getAt(key: keyof ObjProps<T>, heads: Heads) {
    const doc = Automerge.view(this.docHandle.docSync()!, heads);
    return (doc.objects as any)[this.props.id]![key];
  }

  override(
    key: keyof ObjProps<T>,
    value: ObjProps<T>[keyof ObjProps<T>],
    rule: RuleWithDefinition
  ) {
    const currentValue = this.props[key];
    const previousValue = this.getAt(key, rule.createdAt);
    const isActive = isEmpty(currentValue) || currentValue === previousValue;

    // record each unsuccessful override as an exception
    // todo: only record exceptions if the object is in the rule card
    if (!isActive) {
      rule.definition.exceptions.push({
        object: this as Obj,
        key: key as string,
        expectedValue: currentValue,
        computedValue: value,
      });
    }

    this.overrides[key as string] = [
      ...(this.overrides[key as string] || []),
      { value, rule, isActive },
    ];
  }

  constructor(
    props: Omit<ObjProps<T>, "id"> & { id?: string },
    protected getObjectById: (id: string) => Obj,
    protected docHandle: DocHandle<ObjectsDoc>
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
    this.docHandle.change((doc) => {
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

    this.docHandle.change((doc) => {
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

export const ObjView = <T>({
  obj,
  ...props
}: ObjViewProps & { obj: Obj<T> }) => {
  return obj.view(props);
};
