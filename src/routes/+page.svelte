<script lang="ts">
  import RenderExpression from '$lib/components/RenderExpression.svelte';
  import { MLP } from '$lib/microgard/Neuron';
  import ValueNode from '$lib/microgard/ValueNode';

  const network = new MLP({ noOfInputs: 3, noOfOutputs: 1, hiddenLayers: [{ noOfNeurons: 4 }, { noOfNeurons: 4 }] });
  const inputs = [3.0, -1, -2].map((x, i) => new ValueNode(x, `Input ${i + 1}`));
  const outputs = network.predict(inputs);
  const root = outputs[0];
  root.backpropagation();

  /* const e = a - b;
    const f = a / b; */
</script>

<RenderExpression expression={root} />
```
