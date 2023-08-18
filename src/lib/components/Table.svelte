<script lang="ts">
  import type ValueNode from '$lib/microgard/ValueNode';

  export let node: ValueNode;
  export let attributes: Array<keyof ValueNode>;
</script>

<div class="heading"><span>{node.name}</span></div>
<div class="node-details">
  {#each attributes as attribute}
    {#if node[attribute] !== undefined}
      <div class="row">
        <div class="col">{attribute}</div>
        <div class="col">{node[attribute]}</div>
      </div>
    {/if}
  {/each}
</div>

<style>
  .heading {
    background-color: lightblue;
    padding: 10px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
  }
  .heading span {
    font-size: 12px;
    font-weight: 600;
  }

  .node-details {
    width: 100%;
    height: calc(100%-50px);
  }
  .row {
    display: flex;
    width: 100%;
    height: 25px;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    border-bottom: 1px solid lightgray;
  }
  .col {
    font-size: 12px;
    font-weight: 600;
  }
</style>
