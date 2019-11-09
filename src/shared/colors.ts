import {
  WHITE,
  BLUE,
  BLACK,
  RED,
  GREEN,
  MULTI,
  COLORLESS
} from "./constants";

class Colors {
  /**
   * Creates a new colors object
   * Colors can be set by properties matching the colors (w, u, b, r, g)
   **/
  private _w: number;
  private _u: number;
  private _b: number;
  private _r: number;
  private _g: number;

  constructor() {
    this._w = 0;
    this._u = 0;
    this._b = 0;
    this._r = 0;
    this._g = 0;

    return this;
  }

  set w(number) {
    this._w = number;
  }

  set u(number) {
    this._u = number;
  }

  set b(number) {
    this._b = number;
  }

  set r(number) {
    this._r = number;
  }

  set g(number) {
    this._g = number;
  }

  /**
   * Returns an array containing the colors as non-repeating constants
   * inside an array.
   */
  get() {
    let _arr = [];
    if (this._w) _arr.push(WHITE);
    if (this._u) _arr.push(BLUE);
    if (this._b) _arr.push(BLACK);
    if (this._r) _arr.push(RED);
    if (this._g) _arr.push(GREEN);

    return _arr;
  }

  /**
   * Return the color, multicolor or colorless.
   */
  getBaseColor() {
    if (this.length > 1) {
      return MULTI;
    } else if (this.length == 0) {
      return COLORLESS;
    }
    return this.get()[0];
  }

  /**
   * Returns the number of colors
   */
  get length() {
    let ret = 0;
    if (this._w > 0) ret += 1;
    if (this._u > 0) ret += 1;
    if (this._b > 0) ret += 1;
    if (this._r > 0) ret += 1;
    if (this._g > 0) ret += 1;

    return ret;
  }

  /**
   * Adds a string mana cost to this class.
   */
  addFromCost(cost: string[]) {
    for (var c of cost) {
      if (c == "w") {
        this._w += 1;
      } else if (c == "u") {
        this._u += 1;
      } else if (c == "b") {
        this._b += 1;
      } else if (c == "r") {
        this._r += 1;
      } else if (c == "g") {
        this._g += 1;
      }
    };

    return this;
  }

  /**
   * Adds an array mana cost to this one.
   */
  addFromArray(cost: number[]) {
    cost.forEach(color => {
      if (color === WHITE) {
        this._w += 1;
      } else if (color === BLUE) {
        this._u += 1;
      } else if (color === BLACK) {
        this._b += 1;
      } else if (color === RED) {
        this._r += 1;
      } else if (color === GREEN) {
        this._g += 1;
      }
    });

    return this;
  }

  /**
   * Merges another instance of Colors into this one.
   */
  addFromColor(color: Colors) {
    this._w += color.w;
    this._u += color.u;
    this._b += color.b;
    this._r += color.r;
    this._g += color.g;

    return this;
  }

  /**
   * Checks if this color is equal to another
   */
  equalTo(color: Colors) {
    if (
      this._w == color.w &&
      this._u == color.u &&
      this._b == color.b &&
      this._r == color.r &&
      this._g == color.g
    )
      return true;

    return false;
  }

  get w() {
    return this._w;
  }

  get u() {
    return this._u;
  }

  get b() {
    return this._b;
  }

  get r() {
    return this._r;
  }

  get g() {
    return this._g;
  }
}

export default Colors;