export class $Object {
  constructor(props) {
    this.props = props;
    this.prototype = null;
  }

  get(key) {
    if (this.props.hasOwnProperty(key)) {
      return this.props[key];
    }

    if (this.prototype) {
      let value = this.prototype.get(key);

      if (value instanceof $Set) {
        value = this.props[key] = value.layer();
      }

      return value;
    }

    return undefined;
  }

  set(key, value) {
    this.props[key] = value;
  }

  copy() {
    if (!this.prototype) {
      this.prototype = new $Object(this.props);
      this.props = {};
    }

    let obj = new $Object({});
    obj.prototype = this.prototype;
    return obj;
  }

  // return a new object that inherits from this object
  // but can be modified independently

  layer() {
    const obj = new $Object({});
    obj.prototype = this;
    return obj;
  }
}

export class $Set {
  constructor(items) {
    this.items = new Set(items);
    this.prototype = null;
    this.overrides = new Map();
  }

  layer() {
    const obj = new $Set([]);
    obj.prototype = this;
    return obj;
  }

  #items() {
    let set = new Set(this.items);

    if (this.prototype) {
      set = set.union(this.prototype.#items());
    }

    return set;
  }

  value() {
    if (!this.prototype) {
      return this.items;
    }

    const inheritedItems = new Set();

    for (let inheritedItem of this.prototype.#items()) {
      if (inheritedItem instanceof $Object) {
        if (this.overrides.has(inheritedItem)) {
          inheritedItem = this.overrides.get(inheritedItem);
        } else {
          const overrideItem = inheritedItem.layer();
          this.overrides.set(inheritedItem, overrideItem);
          inheritedItem = overrideItem;
        }
      }

      inheritedItems.add(inheritedItem);
    }

    return inheritedItems.union(this.items);
  }

  add(item) {
    this.items.add(item);
  }
}
