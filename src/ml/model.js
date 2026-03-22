// src/ml/model.js
import * as tf from "@tensorflow/tfjs";
import { TRAINING_DATA, tokenize, VOCAB_LENGTH } from "./dataset";

let model = null;

export const createModel = () => {
  model = tf.sequential();

  model.add(tf.layers.dense({
    inputShape: [VOCAB_LENGTH],
    units: 16,
    activation: "relu"
  }));

  model.add(tf.layers.dense({
    units: 8,
    activation: "relu"
  }));

  model.add(tf.layers.dense({
    units: 1,
    activation: "sigmoid"
  }));

  model.compile({
    optimizer: tf.train.adam(0.05),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"]
  });

  return model;
};

export const trainModel = async () => {
  const xs = tf.tensor2d(TRAINING_DATA.map(d => tokenize(d.text)));
  const ys = tf.tensor2d(TRAINING_DATA.map(d => d.label), [TRAINING_DATA.length, 1]);

  await model.fit(xs, ys, { epochs: 50, verbose: 0 });

  tf.dispose([xs, ys]);
  console.log("🧠 ML model trained");
};


export const predictScam = (text) => {
  if (!model) return 0;

  const input = tf.tensor2d([tokenize(text)]);
  const output = model.predict(input);
  const score = output.dataSync()[0];

  tf.dispose([input, output]);
  return score;
};
