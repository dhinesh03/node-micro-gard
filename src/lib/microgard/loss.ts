import ValueNode from './ValueNode';

// Mean Squared Error Loss
export function mseLoss(predictions: Array<ValueNode>, targets: Array<ValueNode>): ValueNode {
  const losses = predictions.map((prediction, index) => {
    const target = targets[index];
    const loss = target.sub(prediction).pow(2);
    return loss;
  });
  return ValueNode.sum(losses).mul(1.0 / losses.length);
}

// Hinge loss is used for classification problems
export function hingeLoss(
  predictions: Array<ValueNode>,
  targets: Array<ValueNode>,
  trainableParams: Array<ValueNode>
): { totalLoss: ValueNode; accuracy: number } {
  // Hinge loss formula is max(0, 1 + -1 * yPred * yTraget)
  const losses = predictions.map((score, index) => {
    const target = targets[index];
    const loss = target.mul(score).mul(-1).add(1).relu();
    return loss;
  });
  const dataLoss = ValueNode.sum(losses).mul(1.0 / losses.length);

  // L2 regularization
  const alpha = 1e-4;
  const regLoss = ValueNode.sum(trainableParams.map((param) => param.pow(2))).mul(alpha);
  const totalLoss = dataLoss.add(regLoss);

  // also get accuracy
  const accuracy =
    predictions
      .map((score, index) => {
        const target = targets[index];
        return target.data > 0 === score.data > 0;
      })
      .reduce((acc, val) => acc + +val, 0) / predictions.length;

  return { totalLoss, accuracy };
}
