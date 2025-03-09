const OVERRIDES_MAP = Symbol("overrides_map");

export const editorState = {
  changeListeners: [] as (() => void)[],

  selectedNode: null as null | Record<string, any>,

  dragState: null as null | {
    node: any;
    offsetX: number;
    offsetY: number;
  },

  setSelectedNode(node: any) {
    this.selectedNode = node;
    this.notifyChangeListeners();
  },

  addChangeListener(listener: () => void) {
    this.changeListeners.push(listener);
  },

  removeChangeListener(listener: () => void) {
    this.changeListeners = this.changeListeners.filter((l) => l !== listener);
  },

  notifyChangeListeners() {
    this.changeListeners.forEach((listener) => listener());
  },
};

const Obj = {
  $override(object: any, props: any) {
    const self = this as any;

    let overridesMap: Map<Record<string, any>, Record<string, any>>;

    // either use the existing overrides map (we need to be careful to not use an inherited overides map)
    if (Object.prototype.hasOwnProperty.call(self, OVERRIDES_MAP)) {
      overridesMap = self[OVERRIDES_MAP];

      // .... or create a new one
    } else {
      overridesMap = self[OVERRIDES_MAP] = new Map();
    }

    let overrideObject: any = overridesMap.get(object);
    if (!overrideObject) {
      const protoOverideObject = self[OVERRIDES_MAP]?.get(object);
      overrideObject = Object.create(protoOverideObject ?? object);
      overridesMap.set(object, overrideObject as Record<string, any>);
    }

    Object.assign(overrideObject, props);
  },

  $resolve(object: any) {
    const self = this as any;

    const overridesMap: Map<any, any> = self[OVERRIDES_MAP];

    if (overridesMap && overridesMap.has(object)) {
      return overridesMap.get(object);
    }

    return object;
  },

  $extend(
    props: Record<string, any>,
    overides: [Record<string, any>, Record<string, any>][] = []
  ) {
    const object = Object.assign(Object.create(this), props);

    for (const [o, props] of overides) {
      object.$override(o, props);
    }

    return object;
  },

  // catch all methods so $lookup and $evaluate don't throw an error if called on an object that dosn't implement them

  $evaluate() {
    return this;
  },

  $field(name: string) {
    return null;
  },

  $unwrap() {
    return this;
  },
};

class Computation {
  source: string;

  constructor(source: string) {
    this.source = source;
  }

  evaluate(self: Record<string, any>) {
    return new Function(
      "self",
      `with (self) {
  return ${this.source};
}`
    )(self);
  }
}

export const computation = (source: string) => {
  return new Computation(source);
};

export const Card = Obj.$extend({
  width: null,
  height: null,
  x: 0,
  y: 0,
  children: [],

  _resolvedChildren: new WeakMap<Record<string, any>, Record<string, any>>(),

  _getResolvedChildren() {
    if (!Object.prototype.hasOwnProperty.call(this, "_resolvedChildren")) {
      this._resolvedChildren = new WeakMap();
    }

    return this.children.map((child: any) => {
      if (this._resolvedChildren.has(child)) {
        return this._resolvedChildren.get(child);
      }

      if (child.$parent) {
        throw new Error("invalid state: child already has a parent");
      }

      const resolvedChild = this.$resolve(child);

      if (resolvedChild.$parent) {
        throw new Error("invalid state: resolved child already has a parent");
      }

      const resolvedChildWithParent = Object.assign(
        Object.create(resolvedChild),
        {
          $parent: this,
          $unwrap() {
            return resolvedChild;
          },
        }
      );

      this._resolvedChildren.set(child, resolvedChildWithParent);

      return resolvedChildWithParent;
    });
  },

  $view(key?: React.Key) {
    const style = {
      width: this.width != null ? `${this.width}px` : "100%",
      height: this.height != null ? `${this.height}px` : "100%",
      transform: `translate(${this.x ?? 0}px, ${this.y ?? 0}px)`,
    };

    return (
      <div
        style={style}
        className={`border absolute bg-white ${
          editorState.selectedNode === this
            ? "border-blue-500"
            : "border-gray-300"
        }`}
        key={key}
        onClick={(event) => {
          if (!this.$parent) {
            return;
          }

          event.stopPropagation();
          editorState.setSelectedNode(this);
        }}
        onDragStart={(event) => {
          event.stopPropagation();
          setTimeout(() => {
            (event.target as HTMLElement).style.visibility = "hidden";
          }, 0);
          event.dataTransfer.effectAllowed = "move";
          editorState.dragState = {
            node: this,
            offsetX: event.clientX - this.x,
            offsetY: event.clientY - this.y,
          };
        }}
        onDragEnd={(event) => {
          (event.target as HTMLElement).style.visibility = "visible";
          editorState.dragState = null;
        }}
        draggable={this.$parent != undefined}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onDragEnter={(event) => {
          (event.target as HTMLElement).classList.add("bg-gray-100");
          event.preventDefault();
          event.stopPropagation();
        }}
        onDragLeave={(event) => {
          (event.target as HTMLElement).classList.remove("bg-gray-100");
        }}
        onDrop={(event) => {
          (event.target as HTMLElement).classList.remove("bg-gray-100");
          event.stopPropagation();

          if (!editorState.dragState) {
            throw new Error("invalid state: no drag state");
          }

          const { node, offsetX, offsetY } = editorState.dragState;

          const oldParent = node.$parent;
          const newParent = this.$unwrap();

          const draggedNode = node.$unwrap() as Record<string, any>;

          // get position where stuff was dragged relative to the card
          const draggedX =
            event.clientX -
            event.currentTarget.getBoundingClientRect().left -
            offsetX;
          const draggedY =
            event.clientY -
            event.currentTarget.getBoundingClientRect().top -
            offsetY;

          draggedNode.x = draggedX;
          draggedNode.y = draggedY;

          if (oldParent !== newParent) {
            oldParent.children = oldParent.children.filter(
              (child: any) => child !== node
            );
            newParent.children.push(node.$unwrap());
          }

          editorState.notifyChangeListeners();
        }}
      >
        <div className="w-full h-full relative">
          {this._getResolvedChildren().map((child: any, index: number) =>
            child.$view(index)
          )}
        </div>
      </div>
    );
  },

  $field(name: string) {
    const child = this._getResolvedChildren().find(
      (child: any) => child.name === name
    );

    if (!child) {
      return null;
    }

    return child.$evaluate();
  },
});

export const Field = Obj.$extend({
  width: null,
  x: 0,
  y: 0,
  value: "",
  readOnly: false,

  $evaluate() {
    if (this.value instanceof Computation) {
      return this.value.evaluate(this);
    }

    return this.value;
  },

  $view(key?: React.Key) {
    const { width, x, y } = this;

    const readOnly = this.value instanceof Computation || this.readOnly;
    const isSelected = editorState.selectedNode === this;

    const style: React.CSSProperties = {
      transform: `translate(${x ?? 0}px, ${y ?? 0}px)`,
      zIndex: isSelected ? 1000 : (x ?? 0) + (y ?? 0),
    };

    if (width !== undefined) {
      style.width = `${width}px`;
    }

    const value = this.$evaluate();

    return (
      <div
        style={style}
        className={`absolute border bg-white ${
          isSelected ? "border-blue-500" : "border-white"
        }`}
        key={key}
        draggable
        onDragStart={(event) => {
          setTimeout(() => {
            (event.target as HTMLElement).style.visibility = "hidden";
          }, 0);

          event.stopPropagation();
          event.dataTransfer.effectAllowed = "move";
          editorState.dragState = {
            node: this,
            offsetX: 0, // event.clientX - this.x,
            offsetY: 0, // event.clientY - this.y,
          };
        }}
        onDragEnd={(event) => {
          (event.target as HTMLElement).style.visibility = "visible";
          editorState.dragState = null;
        }}
      >
        {readOnly ? (
          <div
            className="w-full"
            onClick={(event) => {
              console.log("clicked", this);
              event.stopPropagation();
              event.preventDefault();
              editorState.setSelectedNode(this);
            }}
          >
            {value.toString()}
          </div>
        ) : (
          <input
            onClick={(event) => {
              event.stopPropagation();
              editorState.setSelectedNode(this);
            }}
            className="w-full outline-none"
            readOnly={readOnly}
            type="text"
            value={value.toString()}
            onChange={(event) => (this.value = event.target.value)}
          />
        )}
      </div>
    );
  },
});
