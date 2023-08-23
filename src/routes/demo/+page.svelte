<script lang="ts">
  import Plotly from '$lib/components/Plotly.svelte';
  import type { DataPoint, DataSet, PlotlyData } from '$lib/types';
  type TwoArrayTuple = [number[], number[]];

  let result: string[] = [];
  let streamAbortController: AbortController;
  let data: DataSet;
  let simulatedData: TwoArrayTuple = [[], []];
  let predictions: Array<Array<number>> = [];
  let chartData: any;

  function drawChart(data: DataPoint[], target: number[]) {
    const actualTrace: PlotlyData = {
      x: data.map((d) => d[0]),
      y: data.map((d) => d[1]),
      type: 'scattergl',
      mode: 'markers',
      marker: {
        color: target,
        colorscale: 'Jet'
      }
    };
    const predictedTrace: PlotlyData = {
      x: simulatedData[0],
      y: simulatedData[1],
      z: predictions,
      type: 'contour',
      colorscale: 'Spectral',
      opacity: 0.8
    };
    chartData = {
      data: [predictedTrace, actualTrace],
      layout: {
        width: 500,
        height: 500
      }
    };
  }

  async function fetchDemoData() {
    const response = await fetch('/demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ samples: 100, noise: 0.5, dataset: 'moon' })
    });
    const { data, target } = await response.json();
    drawChart(data, target);
  }

  async function getStream() {
    if (streamAbortController) streamAbortController.abort();
    streamAbortController = new AbortController();
    const signal = streamAbortController.signal;
    const response = await fetch('/demo', {
      method: 'GET',
      signal
    });
    console.log('resp', response);
    const reader = response?.body?.pipeThrough(new TextDecoderStream()).getReader();
    if (reader) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const res = JSON.parse(value);
        if (res.type === 'init') {
          data = res.data;
          simulatedData = res.simulatedData;
          drawChart(data.data, data.target);
        } else {
          predictions = res.predictions;
          result = [res.training, ...result];
          drawChart(data.data, data.target);
          //updateChartColor();
        }
      }
    }
  }
</script>

<div>
  <div class="chart">
    <Plotly plotParams={chartData} />
  </div>
  <button on:click={fetchDemoData}>Fetch demo data</button>
  <button on:click={getStream}>Stream data</button>

  {#if result.length}
    <h2>Result</h2>
    <div class="training-result">
      {#each result as line}
        <span>{line}</span>
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .training-result {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    span {
      margin: 0.5rem;
    }
    height: 300px;
    overflow-y: scroll;
  }
</style>
