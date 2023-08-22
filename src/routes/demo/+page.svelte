<script lang="ts">
  import type { DataPoint } from '$lib/types';
  let result: string[] = [];
  let streamAbortController: AbortController;

  let data: DataPoint;
  async function fetchDemoData() {
    const response = await fetch('/demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ samples: 1000, noise: 0.1, dataset: 'moon' })
    });
    data = await response.json();
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
        result = [...result, value];
      }
    }
  }
</script>

<div>
  <button on:click={fetchDemoData}>Fetch demo data</button>
  <button on:click={getStream}>Stream data</button>
  {#if data}
    <h2>Data</h2>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  {/if}
  {#if result.length}
    <h2>Result</h2>
    {#each result as line}
      <div>{line}</div>
    {/each}
  {/if}
</div>
