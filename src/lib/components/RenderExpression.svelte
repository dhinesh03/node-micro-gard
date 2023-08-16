<script lang="ts">
  import type ValueNode from '$lib/microgard/ValueNode';
  import { Node, type Connections } from 'svelvet';
  export let node: ValueNode;

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
</script>

{#if node}
  <Node />
{/if}
