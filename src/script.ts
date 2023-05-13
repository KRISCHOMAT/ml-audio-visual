import Faderbox from "./classes/faderbox.js";
import Synth from "./classes/synth.js";
import * as tf from "@tensorflow/tfjs";

const audioStatus: HTMLElement = <HTMLElement>(
  document.getElementById("audio_status")
);
const startAudio: HTMLButtonElement = <HTMLButtonElement>(
  document.getElementById("start_audio")
);
const addData: HTMLButtonElement = <HTMLButtonElement>(
  document.getElementById("add_data")
);
const removeData: HTMLButtonElement = <HTMLButtonElement>(
  document.getElementById("remove_data")
);

/**
 * Synth
 */
const synth = new Synth();

startAudio.addEventListener("click", () => {
  if (!synth.isStarted) {
    synth.start();
    audioStatus.innerHTML = "on";
    return;
  }
  if (synth.isRunning) {
    audioStatus.innerHTML = "stop";
    synth.stop();
  } else {
    audioStatus.innerHTML = "on";
    synth.resume();
  }
});

/**
 * ML
 */

const faderboxEl: HTMLElement = <HTMLElement>(
  document.getElementById("faderbox_el")
);
const faderbox = new Faderbox(faderboxEl, synth);

let inputData: number[][] = [];
let outputData: number[][] = [];

let model: any = undefined;
let isTrained: boolean = false;

const posBox: HTMLElement = <HTMLElement>document.getElementById("pos_box");
const posRect: DOMRect = posBox.getBoundingClientRect();
const posIndicator: HTMLElement = <HTMLElement>(
  document.getElementById("pos_indicator")
);

let isTracking: boolean = false;
let mouseX: number = 0;
let mouseY: number = 0;

const collectedData: HTMLElement = <HTMLElement>(
  document.getElementById("collected_data")
);
const modelStatus: HTMLElement = <HTMLElement>(
  document.getElementById("model_status")
);

synth.setParams(faderbox.values);
faderbox.styleBackground(faderbox.values);
loadPretrainedModel();

async function loadPretrainedModel() {
  modelStatus.innerHTML = "loading...";
  model = await tf.loadLayersModel("/models/pretrainedModel.json");
  model.summary();
  isTrained = true;
  modelStatus.innerHTML = "loaded";
  mouseX = Math.random();
  mouseY = Math.random();
  trackMovement(mouseX, mouseY);
}

// touch events
posBox.addEventListener("touchstart", () => {
  isTracking = true;
});
posBox.addEventListener("touchend", () => {
  isTracking = false;
});
posBox.addEventListener("touchcancel", () => {
  isTracking = false;
});
posBox.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (!isTracking) return;
  mouseX = (e.touches[0].clientX - posRect.left) / posRect.width;
  mouseY = (e.touches[0].clientY - posRect.top) / posRect.height;
  trackMovement(mouseX, mouseY);
});

// click events
posBox.addEventListener("mousedown", () => {
  isTracking = true;
});

posBox.addEventListener("mouseup", () => {
  isTracking = false;
});

posBox.addEventListener("mousemove", (e) => {
  if (!isTracking) return;
  mouseX = (e.clientX - posRect.left) / posRect.width;
  mouseY = (e.clientY - posRect.top) / posRect.height;
  trackMovement(mouseX, mouseY);
});

function trackMovement(mouseX: number, mouseY: number) {
  if (mouseX >= 1 || mouseX <= 0 || mouseY >= 1 || mouseY <= 0) return;
  posIndicator.style.left = `${mouseX * 100}%`;
  posIndicator.style.top = `${mouseY * 100}%`;

  if (!isTrained) return;
  const inputTensor = tf.tensor2d([[mouseX, mouseY]]);

  const recentOutputs: number[] = [];

  model
    .predict(inputTensor)
    .data()
    .then((data: number[]) => {
      for (let i = 0; i < data.length; i++) {
        recentOutputs[i] = data[i];
      }
      faderbox.styleBackground(recentOutputs);
      synth.setParams(recentOutputs);
      faderbox.setValues(recentOutputs);
    });

  inputTensor.dispose();
}

addData.addEventListener("click", () => {
  const recentInputs: number[] = [mouseX, mouseY];

  outputData.push(faderbox.values);
  inputData.push(recentInputs);

  collectedData.innerHTML = String(outputData.length);

  console.log("Outputdata:");
  console.log(outputData);
  console.log("Inputdata:");
  console.log(inputData);
});

removeData.addEventListener("click", () => {
  outputData = [];
  inputData = [];
  collectedData.innerHTML = String(outputData.length);
});

const trainButton: HTMLButtonElement = <HTMLButtonElement>(
  document.getElementById("train")
);
trainButton.addEventListener("click", prepareTraining);

const trainProgress: HTMLElement = <HTMLElement>(
  document.getElementById("training_progress")
);
function prepareTraining() {
  trainProgress.innerHTML = "0%";
  if (outputData.length === 0) return;

  modelStatus.innerHTML = "preparing training";
  tf.util.shuffleCombo(inputData, outputData);

  const inputTensor = tf.tensor2d(inputData);
  const outputTensor = tf.tensor2d(outputData);

  model = tf.sequential();
  model.add(
    tf.layers.dense({ inputShape: [2], units: 16, activation: "relu" })
  );
  model.add(tf.layers.dense({ units: 32, activation: "relu" }));
  model.add(tf.layers.dense({ units: 32, activation: "relu" }));
  model.add(tf.layers.dense({ units: 7 }));

  model.summary();

  train(inputTensor, outputTensor);
}

let LEARNING_RATE = 0.1;
const OPTIMIZER = tf.train.sgd(LEARNING_RATE);

async function train(inputTensor: any, outputTensor: any) {
  modelStatus.innerHTML = "training...";

  model.compile({
    optimizer: OPTIMIZER,
    loss: "meanSquaredError",
  });

  const results = await model.fit(inputTensor, outputTensor, {
    callbacks: { onEpochEnd: logProgress },
    shuffle: true,
    batchSize: 1,
    epochs: 500,
  });

  console.log(
    "Average error loss: " +
      Math.sqrt(results.history.loss[results.history.loss.length - 1])
  );

  inputTensor.dispose();
  outputTensor.dispose();

  isTrained = true;
  modelStatus.innerHTML = "trained";
}

function logProgress(epoch: number, logs: any) {
  trainProgress.innerHTML = `${Math.round((epoch / 500) * 100)}%`;
  console.log("Data for epoch" + epoch, Math.sqrt(logs.loss));
  if (epoch == 100 || epoch === 300 || epoch === 400) {
    LEARNING_RATE -= 0.005;
    OPTIMIZER.setLearningRate(LEARNING_RATE);
  }
}
