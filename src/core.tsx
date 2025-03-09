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
};

export const Computed = Obj.$extend({
  source: "",
  evaluate() {
    console.log("evaluating", this.source);

    return new Function(
      "self",
      `with (self) {
      return ${this.source};
    }`
    )(this);
  },
});

export const Card = Obj.$extend({
  $view(key?: React.Key) {
    const self = this as any;
    const { width, height, x, y, children } = self;

    const style = {
      width: width !== undefined ? `${width}px` : "100%",
      height: height !== undefined ? `${height}px` : "100%",
      transform: `translate(${x ?? 0}px, ${y ?? 0}px)`,
    };

    return (
      <div style={style} className="border border-gray-300 absolute" key={key}>
        <div className="w-full h-full relative">
          {children
            ? children.map((child: any, index: number) => {
                const resolvedChild = self.$resolve(child);

                return resolvedChild.$view(index);
              })
            : null}
        </div>
      </div>
    );
  },
});

export const Field = Obj.$extend({
  $view(key?: React.Key) {
    const self = this as any;
    const { width, x, y } = self;

    let { value, readOnly } = self;
    if (Object.prototype.isPrototypeOf.call(Computed, value)) {
      readOnly = true;
      value = value.evaluate();
    }

    const style: React.CSSProperties = {
      transform: `translate(${x ?? 0}px, ${y ?? 0}px)`,
      zIndex: (x ?? 0) + (y ?? 0),
    };

    if (width !== undefined) {
      style.width = `${width}px`;
    }

    return (
      <div style={style} className="absolute bg-white" key={key}>
        {readOnly ? (
          <div className="w-full">{value}</div>
        ) : (
          <input
            className="w-full"
            readOnly={readOnly}
            type="text"
            value={value}
            onChange={(event) => (self.value = event.target.value)}
          />
        )}
      </div>
    );
  },
});
