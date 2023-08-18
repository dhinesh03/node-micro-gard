import { generateRandomString } from '$lib/utils/helper';

export default class ValueNode {
  id: string = generateRandomString(5);
  data: number;
  grad = 0.0;
  name = '';
  children: Array<ValueNode>;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private _backward = () => {};

  constructor({ data, name = '', children = [] }: { data: number; name?: string; children?: Array<ValueNode> }) {
    this.data = data;
    this.children = children;
    this.name = name;
  }

  add(other: ValueNode) {
    const out = new ValueNode({
      data: this.data + other.data,
      name: `(${this.name} + ${other.name})`,
      children: [this, other]
    });
    const _backward = () => {
      this.grad += 1.0 * out.grad;
      other.grad += 1.0 * out.grad;
    };
    out._backward = _backward;
    return out;
  }

  mul(other: ValueNode) {
    const out = new ValueNode({
      data: this.data * other.data,
      name: `(${this.name} * ${other.name})`,
      children: [this, other]
    });
    const _backward = () => {
      /**
       * if c = a * b
       * calculate the gradient
       * Formula: limit h-->0 then f(x+h) - f(x) / h
       * here h = 0.0001
       * gradient of c with respect to a
       * dc/da = limit h-->0 then f(a+h, b) - f(a, b) / h
       * expanding the function
       * dc/da = (a+h) * b - a * b / h
       * dc/da = ((a*b) + (h*b) - (a*b)) / h
       * dc/da = (h*b) / h
       * dc/da = b
       *
       * gradient of c with respect to b
       * dc/db = limit h-->0 then f(a, b+h) - f(a, b) / h
       * expanding the function
       * dc/db = a * (b+h) - a * b / h
       * dc/db = (a*b) + (a*h) - (a*b) / h
       * dc/db = (a*h) / h
       * dc/db = a
       *
       * As per chain rule, we need to multiply the local gradient with the gradient of the next node to calculate the gradient with respect to the final output node
       *
       */

      this.grad += other.data * out.grad;
      other.grad += this.data * out.grad;
    };
    out._backward = _backward;
    return out;
  }

  pow(other: ValueNode) {
    // other should be a constant
    const out = new ValueNode({
      data: Math.pow(this.data, other.data),
      name: `(${this.name} ^ ${other.name})`,
      children: [this, other]
    });
    const _backward = () => {
      /**
       * where n is a constant exponent.
       * if f(x) = x ^ n
       * calculate the gradient
       *Power Rule: d/dx(x^n) = n * x^(n-1)
       */
      this.grad += other.data * Math.pow(this.data, other.data - 1) * out.grad;
    };
    out._backward = _backward;
    return out;
  }

  relu() {
    const out = new ValueNode({
      data: Math.max(0, this.data),
      name: `relu(${this.name})`,
      children: [this]
    });
    const _backward = () => {
      /**
       * if f(x) = max(0, x)
       * calculate the gradient
       * f'(x) = 0 if x < 0
       * f'(x) = 1 if x > 0
       */
      this.grad += (this.data > 0 ? 1 : 0) * out.grad;
    };
    out._backward = _backward;
    return out;
  }

  sub(other: ValueNode) {
    return this.add(other.mul(new ValueNode({ data: -1.0, name: 'const' })));
  }

  div(other: ValueNode) {
    return this.mul(other.pow(new ValueNode({ data: -1.0, name: 'const' })));
  }

  nodes() {
    const nodes: Array<ValueNode> = [];
    const visited: Set<ValueNode> = new Set();
    const buildNodes = (node: ValueNode) => {
      if (!visited.has(node)) {
        visited.add(node);
        node.children.forEach((child) => buildNodes(child));
        nodes.push(node);
      }
    };
    buildNodes(this);
    return nodes;
  }

  backpropagation() {
    // build topological order
    const topo: Array<ValueNode> = this.nodes();

    topo.reverse();
    // backpropagation
    this.grad = 1.0;
    topo.forEach((node) => node._backward());
  }
}
