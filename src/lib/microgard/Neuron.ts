import { generateRandomString } from '$lib/utils/helper';
import ValueNode from './ValueNode';

const random = (): number => 2 * Math.random() - 1;

export class Neuron {
  id: string = generateRandomString(5);
  weights: Array<ValueNode>;
  bias: ValueNode;
  activation: ValueNode | null = null;
  num: number;

  constructor(noOfInputs: number, num = 1) {
    this.num = num;
    this.weights = Array.from(Array(noOfInputs).keys(), (i) => new ValueNode(random(), `W-${i + 1}`));
    this.bias = new ValueNode(random(), 'bias');
  }

  computeActivation(inputs: Array<ValueNode>, isOutputLayer: boolean): ValueNode {
    const sum = ValueNode.sum([...inputs.map((input, index) => input.mul(this.weights[index])), this.bias]);
    if (isOutputLayer) {
      this.activation = sum;
    } else {
      this.activation = sum.relu(`A-${this.num}`);
    }
    return this.activation;
  }
}

type LayerType = 'hidden' | 'output';

export class Layer {
  id: string = generateRandomString(5);
  type: 'hidden' | 'output';
  neurons: Array<Neuron>;
  constructor(noOfNeurons: number, noOfInputs: number, type: LayerType) {
    this.type = type;
    this.neurons = Array.from(Array(noOfNeurons).keys(), (i) => new Neuron(noOfInputs, i + 1));
  }

  forward(inputs: Array<ValueNode>): Array<ValueNode> {
    return this.neurons.map((neuron) => neuron.computeActivation(inputs, this.type === 'output'));
  }
}

export class MLP {
  layers: Array<Layer>;
  constructor({
    noOfInputs,
    hiddenLayers,
    noOfOutputs
  }: {
    noOfInputs: number;
    hiddenLayers: Array<{ noOfNeurons: number }>;
    noOfOutputs: number;
  }) {
    this.layers = hiddenLayers.map(({ noOfNeurons }, index) => {
      if (index === 0) {
        return new Layer(noOfNeurons, noOfInputs, 'hidden');
      } else {
        return new Layer(noOfNeurons, hiddenLayers[index - 1].noOfNeurons, 'hidden');
      }
    });
    this.layers.push(new Layer(noOfOutputs, hiddenLayers[hiddenLayers.length - 1].noOfNeurons, 'output'));
  }

  predict(inputs: Array<ValueNode>): Array<ValueNode> {
    let outputs = inputs;
    for (const layer of this.layers) {
      outputs = layer.forward(outputs);
    }
    return outputs;
  }

  getTrainableParams(): Array<ValueNode> {
    const params: Array<ValueNode> = [];
    for (const layer of this.layers) {
      for (const neuron of layer.neurons) {
        params.push(neuron.bias);
        params.push(...neuron.weights);
      }
    }
    return params;
  }
}
