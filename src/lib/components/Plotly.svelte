<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  export let plotParams: any;
  let lastPlotParams: any = null;

  const browser = typeof window === 'object';
  let libPlotly: typeof import('plotly.js-dist') | null | undefined = undefined;
  let element: HTMLDivElement | null = null;

  async function loadPlotly() {
    if (!browser) return;

    if (libPlotly === undefined) {
      if (window.Plotly) {
        libPlotly = window.Plotly;
      } else {
        const p = await import('plotly.js-dist');
        if (libPlotly === undefined) libPlotly = 'default' in p ? p.default : p;
      }
    }
  }

  function drawChart(configs: any) {
    if (!element || !libPlotly) return;
    libPlotly.newPlot(element, configs);
  }

  $: {
    if (plotParams && plotParams !== lastPlotParams) {
      drawChart(plotParams);
      lastPlotParams = plotParams;
    }
  }

  onMount(async () => {
    //(window as any).global = window;
    await loadPlotly();
    plotParams && drawChart(plotParams);
  });

  onDestroy(() => element && libPlotly?.purge(element));
</script>

<div id="plot" bind:this={element} />

<style lang="scss">
</style>
