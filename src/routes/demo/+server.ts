import { MLP } from '$lib/microgard/Neuron';
import ValueNode from '$lib/microgard/ValueNode';
import { hingeLoss } from '$lib/microgard/loss';
import type { DataPoint } from '$lib/types';
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

function generateSpiral(n_samples: number, noise = 0.05): DataSet {
  const data: DataPoint[] = [];
  const target: number[] = [];

  const n = n_samples / 2;
  for (let i = 0; i < n; i++) {
    /*s
    let angle = getRandom(0, 4 * Math.PI);
    let rad = angle + noise * getRandom(-1, 1);

    let x = rad * Math.sin(angle);
    let y_val = rad * Math.cos(angle);
    
    X.push([x, y_val]);
    y.push(0);

    x = -rad * Math.sin(angle);
    y_val = -rad * Math.cos(angle);
    
    X.push([x, y_val]);
    y.push(1); */

    const t = (1.25 * i) / n_samples + (Math.random() * noise * 2 - noise);
    const x = (1 + t) * Math.cos(t);
    const y = (1 + t) * Math.sin(t);

    data.push([x, y]);
    target.push(-1);

    data.push([-x, -y]);
    target.push(1);
  }

  return { data, target };
}

function generateCircle(n_samples: number, noise = 0.05, factor = 0.5): DataSet {
  const data: DataPoint[] = [];
  const target: number[] = [];

  for (let i = 0; i < n_samples / 2; i++) {
    const angle = getRandom(0, 2 * Math.PI);
    let rad = getRandom(0.3 * factor, 1.0);

    let x = rad * Math.cos(angle) + noise * getRandom(-1, 1);
    let y = rad * Math.sin(angle) + noise * getRandom(-1, 1);
    2;

    data.push([x, y]);
    target.push(-1);

    rad = getRandom(0, 0.3 * factor);
    x = rad * Math.cos(angle) + noise * getRandom(-1, 1);
    y = rad * Math.sin(angle) + noise * getRandom(-1, 1);
    data.push([x, y]);
    target.push(1);
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
  const ac = new AbortController();
  let interval: number;
  const stream = new ReadableStream({
    start(controller) {
      const model = new MLP({
        noOfInputs: 2,
        noOfOutputs: 1,
        hiddenLayers: [{ noOfNeurons: 16 }, { noOfNeurons: 16 }]
      });
      const moonData = generateMoon(100, 0.01);
      const data = moonData.data.map((point) => point.map((val) => new ValueNode(val, 'input')));
      const target = moonData.target.map((val) => new ValueNode(val, 'target'));
      const tp = model.getTrainableParams();

      let step = 0;
      interval = setInterval(() => {
        const predictions = data.map((point) => model.predict(point)).flat();
        const { totalLoss, accuracy } = hingeLoss(predictions, target, tp);
        controller.enqueue(`step ${step} loss ${totalLoss.data} accuracy ${accuracy * 100}%`);

        // backpropagate
        totalLoss.backpropagation();

        // update weights
        const learningRate = 1 - (0.9 * step) / 1000;
        for (const param of tp) {
          param.data -= learningRate * param.grad;
          param.grad = 0;
        }

        step++;
      }, 1000);
    },
    cancel() {
      console.log('cancel');
      interval && clearInterval(interval);
      ac.abort();
    }
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream'
    }
  });
}
