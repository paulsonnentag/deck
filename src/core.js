export class Obj {
  constructor(props) {
    this.props = props;
    this.prototype = null;
  }

  get(key) {
    if (this.props.hasOwnProperty(key)) {
      return this.props[key];
    }

    if (this.prototype) {
      return this.prototype.get(key);
    }

    return undefined;
  }

  set(key, value) {
    this.props[key] = value;
  }

  copy() {
    if (!this.prototype) {
      this.prototype = new Obj(this.props);
      this.props = {};
    }

    let obj = new Obj({});
    obj.prototype = this.prototype;
    return obj;
  }
}
