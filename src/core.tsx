const OVERRIDES_MAP = Symbol("overrides_map");

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

  _resolvedChildren() {
    return this.children.map((child: any) => {
      return Object.assign(Object.create(this.$resolve(child)), {
        $parent: this,
      });
    });
  },

  $view(key?: React.Key) {
    const style = {
      width: this.width !== undefined ? `${this.width}px` : "100%",
      height: this.height !== undefined ? `${this.height}px` : "100%",
      transform: `translate(${this.x ?? 0}px, ${this.y ?? 0}px)`,
    };

    return (
      <div style={style} className="border border-gray-300 absolute" key={key}>
        <div className="w-full h-full relative">
          {this._resolvedChildren().map((child: any, index: number) => {
            if (!child) {
              console.log(this);
              debugger;
            }

            return child.$view(index);
          })}
        </div>
      </div>
    );
  },

  $field(name: string) {
    const child = this._resolvedChildren().find(
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

    const style: React.CSSProperties = {
      transform: `translate(${x ?? 0}px, ${y ?? 0}px)`,
      zIndex: (x ?? 0) + (y ?? 0),
    };

    if (width !== undefined) {
      style.width = `${width}px`;
    }

    const value = this.$evaluate();

    return (
      <div style={style} className="absolute bg-white" key={key}>
        {readOnly ? (
          <div className="w-full">{value.toString()}</div>
        ) : (
          <input
            className="w-full"
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
