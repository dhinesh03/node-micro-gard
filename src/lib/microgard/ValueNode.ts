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
      this.grad += other.data * out.grad;
      other.grad += this.data * out.grad;
    };
    out._backward = _backward;
    return out;
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
