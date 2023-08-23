import { MLP } from '$lib/microgard/Neuron';
import ValueNode from '$lib/microgard/ValueNode';
import { hingeLoss } from '$lib/microgard/loss';
import type { DataPoint, DataSet } from '$lib/types';
import { json } from '@sveltejs/kit';

function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function shuffle<I>(array: I[]): I[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function arange(x_min: number, x_max: number, h: number) {
  const n = Math.floor((x_max - x_min) / h) + 1;
  return Array.from({ length: n }, (_, i) => x_min + i * h);
}

function reshape<T>(arr: T[], cols: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += cols) {
    result.push(arr.slice(i, i + cols));
  }
  return result;
}

function meshgrid<T>(x: T[], y: T[]): [T[][], T[][]] {
  const X: T[][] = [];
  const Y: T[][] = [];

  for (let i = 0; i < y.length; i++) {
    const rowX: T[] = [];
    const rowY: T[] = [];
    for (let j = 0; j < x.length; j++) {
      rowX.push(x[j]);
      rowY.push(y[i]);
    }
    X.push(rowX);
    Y.push(rowY);
  }

  return [X, Y];
}

function generateMoon(n_samples: number, noise = 0.05): DataSet {
  const res: { data: DataPoint; target: number }[] = [];
  const data: DataPoint[] = [];
  const target: number[] = [];
  const n_samples_out = Math.floor(n_samples / 2);
  const n_samples_in = n_samples - n_samples_out;

  // Outer circle
  for (let i = 0; i < n_samples_out; i++) {
    const angle = (Math.PI * i) / n_samples_out + (Math.random() - 0.5) * noise;
    const x = Math.cos(angle) + (Math.random() - 0.5) * noise;
    const y = Math.sin(angle) + (Math.random() - 0.5) * noise;
    res.push({ data: [x, y], target: -1 });
  }

  // Inner circle
  for (let i = 0; i < n_samples_in; i++) {
    const angle = (Math.PI * i) / n_samples_in + Math.PI + (Math.random() - 0.5) * noise;
    const x = 1 + Math.cos(angle) + (Math.random() - 0.5) * noise;
    const y = Math.sin(angle) + (Math.random() - 0.5) * noise;
    res.push({ data: [x, y], target: 1 });
  }

  shuffle(res);

  res.forEach((point) => {
    data.push(point.data);
    target.push(point.target);
  });

  return { data, target };
}

function generateSpiral(n_samples: number, noise = 0.05, factor = 4): DataSet {
  const data: DataPoint[] = [];
  const target: number[] = [];

  for (let i = 0; i < n_samples / 2; i++) {
    const r = (i / n_samples) * factor;
    const t = ((1.75 * i) / n_samples) * 2 * Math.PI;

    // Spiral 1 (clockwise)
    let x = r * Math.sin(t) + (Math.random() * 2 - 1) * noise;
    let y = r * Math.cos(t) + (Math.random() * 2 - 1) * noise;

    data.push([x, y]);
    target.push(-1);

    // Spiral 2 (counterclockwise)
    x = -r * Math.sin(t) + (Math.random() * 2 - 1) * noise;
    y = -r * Math.cos(t) + (Math.random() * 2 - 1) * noise;

    data.push([x, y]);
    target.push(1);
  }

  return { data, target };
}

function generateCircle(n_samples: number, noise = 0.05, factor = 0.5): DataSet {
  const data: DataPoint[] = [];
  const target: number[] = [];

  for (let i = 0; i < n_samples; i++) {
    // Choose a random angle
    const t = 2 * Math.PI * Math.random();

    // Randomly choose the label (0 or 1)
    const label = i < n_samples / 2 ? 0 : 1;

    // Calculate radius - one circle has a smaller radius, the other a larger one
    const r = label === 0 ? 1 : 1 + factor;

    // Calculate coordinates with optional noise
    const x = r * Math.sin(t) + (Math.random() * 2 - 1) * noise;
    const y = r * Math.cos(t) + (Math.random() * 2 - 1) * noise;

    data.push([x, y]);
    target.push(label === 0 ? -1 : 1);
  }

  return { data, target };
}

export async function POST({ request }) {
  const { samples, noise, dataset } = await request.json();
  if (dataset === 'moon') {
    return json(generateMoon(samples, noise));
  } else if (dataset === 'spiral') {
    return json(generateSpiral(samples, noise));
  } else if (dataset === 'circle') {
    return json(generateCircle(samples, noise));
  } else {
    return json({ error: 'Invalid dataset' });
  }
}

export async function GET({ url }) {
  try {
    //const ac = new AbortController();
    let interval: number;
    const stream = new ReadableStream({
      start(controller) {
        const model = new MLP({
          noOfInputs: 2,
          noOfOutputs: 1,
          hiddenLayers: [{ noOfNeurons: 24 }, { noOfNeurons: 24 }]
        });
        const moonData = generateCircle(100, 0.1);
        const data = moonData.data.map((point) => point.map((val) => new ValueNode(val, 'input')));
        const target = moonData.target.map((val) => new ValueNode(val, 'target'));
        const tp = model.getTrainableParams();

        const xMin = moonData.data.reduce((min, point) => Math.min(min, point[0]), 0) - 1;
        const xMax = moonData.data.reduce((max, point) => Math.max(max, point[0]), 0) + 1;
        const yMin = moonData.data.reduce((min, point) => Math.min(min, point[1]), 0) - 1;
        const yMax = moonData.data.reduce((max, point) => Math.max(max, point[1]), 0) + 1;

        const xArrange = arange(xMin, xMax, 0.25);
        const yArrange = arange(yMin, yMax, 0.25);
        const [xSimulate, ySimulate] = meshgrid(xArrange, yArrange);
        const xMesh = xSimulate.flat();
        const yMesh = ySimulate.flat();
        const mesh = xMesh.map((x, i) => [x, yMesh[i]]);
        const simulatedData = mesh.map((point) => point.map((val) => new ValueNode(val, 'input')));

        let step = 0;
        interval = setInterval(() => {
          if (step === 0) {
            controller.enqueue(JSON.stringify({ type: 'init', data: moonData, simulatedData: [xArrange, yArrange] }));
          } else {
            const forward = data.map((point) => model.predict(point)).flat();
            const { totalLoss, accuracy } = hingeLoss(forward, target, tp);

            const predictions = reshape(
              simulatedData
                .map((point) => model.predict(point))
                .flat()
                .map((val) => (val.data > 0 ? 1 : 0)),
              xArrange.length
            );

            controller.enqueue(
              JSON.stringify({
                type: 'step',
                predictions,
                training: `Step ${step} loss ${totalLoss.data} accuracy ${accuracy * 100}%`
              })
            );

            // backpropagate
            totalLoss.backpropagation();

            // update weights
            const learningRate = 1 - (0.9 * step) / 1000;
            for (const param of tp) {
              param.data -= learningRate * param.grad;
            }
          }

          step++;
          if (step > 100) {
            interval && clearInterval(interval);
          }
        }, 100);
      },
      cancel() {
        console.log('cancel');
        interval && clearInterval(interval);
        //ac.abort();
      }
    });

    return new Response(stream, {
      headers: {
        'content-type': 'text/event-stream'
      }
    });
  } catch (e) {
    console.error(e);
    return json(e);
  }
}
