<script lang="ts">
  import RenderExpression from '$lib/components/RenderExpression.svelte';
  import ValueNode from '$lib/microgard/ValueNode';

  const a = new ValueNode({ data: 42, name: 'a' });
  const b = new ValueNode({ data: 42, name: 'b' });
  const x = b.mul(b);
  const c = a.mul(b);

  const root = a.add(b).mul(c).add(x);
  /* const e = a - b;
    const f = a / b; */
</script>

<RenderExpression expression={root} />
```
