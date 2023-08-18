<script lang="ts">
  import { Svelvet, Node, Anchor } from 'svelvet';
  import type ValueNode from '$lib/microgard/ValueNode';
  import Table from './Table.svelte';

  export let expression: ValueNode;

  type ConnectionMap = {
    [nodeId: string]: {
      inputConnections: Array<string>;
      outputConnections: Array<string>;
      level: number;
    };
  };

  function getConnectionsMap(node: ValueNode): ConnectionMap {
    const map: ConnectionMap = {};
    const walk = (node: ValueNode, level: number) => {
      if (!map[node.id]) {
        map[node.id] = {
          inputConnections: [],
          outputConnections: [],
          level
        };
      }
      map[node.id].level = Math.max(map[node.id].level, level);

      if (node.children.length === 0) {
        return;
      }

      node.children.forEach((childNode) => {
        if (!map[childNode.id]) {
          map[childNode.id] = {
            inputConnections: [],
            outputConnections: [],
            level: level + 1
          };
        }
        map[node.id].inputConnections.push(childNode.id);
        map[childNode.id].outputConnections.push(node.id);
        map[childNode.id].level = Math.max(map[childNode.id].level, level + 1);
        walk(childNode, level + 1);
      });
    };
    walk(node, 0);
    return map;
  }

  function nodesByLevel(nodes: Array<ValueNode>, map: ConnectionMap): Array<Array<ValueNode>> {
    const levels: Array<Array<ValueNode>> = [];
    nodes.forEach((node) => {
      if (!levels[map[node.id].level]) {
        levels[map[node.id].level] = [];
      }
      levels[map[node.id].level].push(node);
    });
    return levels;
  }

  $: connectionsMap = getConnectionsMap(expression);
  $: levels = nodesByLevel(expression.nodes(), connectionsMap);
  $: maxLevel = levels.length;
</script>

<Svelvet>
  {#each levels as nodes, index}
    {#each nodes as node, yIndex}
      <Node
        useDefaults
        id={node.id}
        label={node.name}
        position={{ x: (maxLevel - index) * 300, y: yIndex * 150 }}
        connections={connectionsMap[node.id].outputConnections}
      >
        <div class="node-wrapper">
          {#if connectionsMap[node.id].inputConnections.length}
            <div class="input-anchor">
              <Anchor input direction="west" />
            </div>
          {/if}
          {#if connectionsMap[node.id].outputConnections.length}
            <div class="output-anchor">
              <Anchor output direction="east" />
            </div>
          {/if}
          <Table {node} attributes={['data', 'grad']} />
        </div>
      </Node>
    {/each}
  {/each}
</Svelvet>

<style>
  .node-wrapper {
    width: 200px;
    height: 100px;
    border-radius: 8px;
  }
  .input-anchor {
    position: absolute;
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
  }

  .output-anchor {
    position: absolute;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
  }
</style>
