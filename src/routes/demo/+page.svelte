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
  let dataset = 'moon';
  let noise = 0.1;
  let samples = 100;
  let isTraining = false;

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

  async function handleSubmit() {
    try {
      if (streamAbortController) {
        streamAbortController.abort();
      }
      streamAbortController = new AbortController();
      const signal = streamAbortController.signal;
      const response = await fetch('/demo', {
        method: 'POST',
        body: JSON.stringify({ samples, noise, dataset }),
        signal
      });
      console.log('resp', response);
      const reader = response?.body?.pipeThrough(new TextDecoderStream()).getReader();
      if (reader) {
        isTraining = true;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            console.log('Stream complete');
            isTraining = false;
            break;
          }
          const res = JSON.parse(value);
          if (res.type === 'init') {
            data = res.data;
            simulatedData = res.simulatedData;
            drawChart(data.data, data.target);
          } else {
            predictions = res.predictions;
            result = [res.training, ...result];
            drawChart(data.data, data.target);
          }
        }
      }
    } catch (e) {
      console.log('error', e);
    } finally {
      isTraining = false;
    }
  }
</script>

<div>
  <div class="chart">
    <Plotly plotParams={chartData} />
  </div>
  <form on:submit|preventDefault={handleSubmit}>
    <div class="container">
      <select bind:value={dataset}>
        <option value="moon">Moon</option>
        <option value="spiral">Spiral</option>
        <option value="circle">Circle</option>
      </select>
      <input type="number" min={10} max={1000} bind:value={samples} />
      <input type="number" min={0} max={1} step={0.1} bind:value={noise} />

      {#if isTraining}
        <button on:click={() => streamAbortController.abort()}>Stop</button>
      {:else}
        <button type="submit">Train</button>
      {/if}
    </div>
  </form>

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
  .chart {
    width: 500px;
    height: 500px;
  }
  .container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: start;
    select {
      width: 100px;
    }
    input {
      width: 50px;
    }
  }
</style>
