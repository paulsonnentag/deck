import "./index.css";
import { createRoot } from "react-dom/client";

const OVERRIDES_MAP = Symbol("overrides_map");

const $object = {
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

const card = $object.$extend({
  $view() {
    const self = this as any;
    const { width, height, x, y, children } = self;

    const style = {
      width: width !== undefined ? `${width}px` : "100%",
      height: height !== undefined ? `${height}px` : "100%",
      transform: `translate(${x ?? 0}px, ${y ?? 0}px)`,
    };

    return (
      <div style={style} className="border border-gray-300 absolute">
        <div className="w-full h-full relative">
          {children
            ? children.map((child: any) => {
                const resolvedChild = self.$resolve(child);

                return resolvedChild.$view();
              })
            : null}
        </div>
      </div>
    );
  },
});

const field = $object.$extend({
  $view() {
    const self = this as any;
    const { width, x, y, value, readonly } = self;

    const style: React.CSSProperties = {
      transform: `translate(${x ?? 0}px, ${y ?? 0}px)`,
    };

    if (width !== undefined) {
      style.width = `${width}px`;
    }

    return (
      <div style={style} className="absolute">
        {readonly ? (
          <div className="w-full">{value}</div>
        ) : (
          <input
            className="w-full"
            readOnly={readonly}
            type="text"
            value={value}
            onChange={() => (self.value = event.target.value)}
          />
        )}
      </div>
    );
  },
});

// const c = $object.$extend({
//   value: 100,
// });

// const d = $object.$extend({
//   value: 100,
// });

// const a = $object.$extend({
//   doubleC() {
//     return this.$resolve(c).value * 2;
//   },
//   halfD() {
//     return this.$resolve(d).value / 2;
//   },
// });

// const b = a.$extend({}, [
//   [c, { value: 10 }],
//   [d, { value: 10 }],
// ]);

// console.log(a.doubleC());
// console.log(b.doubleC());

// console.log(a.halfD());
// console.log(b.halfD());

const eventTitle = field.$extend({
  x: 10,
  y: 10,
  value: "Meeting with John",
});

const eventStart = field.$extend({
  x: 10,
  y: 50,
  value: "10:00",
  width: 50,
});

const eventEnd = field.$extend({
  x: 100,
  y: 50,
  value: "11:00",
  width: 50,
});

const eventDash = field.$extend({
  x: 75,
  y: 50,
  readonly: true,
  value: "-",
  width: 50,
});

const event = card.$extend({
  width: 400,
  height: 150,
  x: 100,
  y: 100,
  children: [eventTitle, eventStart, eventDash, eventEnd],
});

const event2 = event.$extend(
  {
    x: 100,
    y: 300,
  },
  [
    [eventTitle, { value: "Another meeting" }],
    [eventStart, { value: "12:00" }],
    [eventEnd, { value: "13:00" }],
  ]
);

const main = card.$extend({
  children: [event, event2],
});

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(main.$view());
