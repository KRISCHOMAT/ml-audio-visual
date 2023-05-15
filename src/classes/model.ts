import * as tf from "@tensorflow/tfjs";

export default class Model {
  model: any | undefined = undefined;
  isTrained: boolean = false;
  modelStatus: HTMLElement;
  trainProgress: HTMLElement;
  learningRate: number = 0.1;
  optimizer: any = undefined;
  logProgress: any;

  constructor() {
    this.modelStatus = document.getElementById("model_status") as HTMLElement;

    this.trainProgress = document.getElementById(
      "training_progress"
    ) as HTMLElement;

    this.logProgress = (epoch: any, logs: any) => {
      this.trainProgress.innerHTML = `${Math.round((epoch / 500) * 100)}%`;
      console.log("Data for epoch" + epoch, Math.sqrt(logs.loss));
      if (epoch == 100 || epoch === 300 || epoch === 400) {
        this.learningRate -= 0.005;
        this.optimizer.setLearningRate(this.learningRate);
      }
    };
  }

  async loadPretrainedModel(trackMovement?: () => {}) {
    this.modelStatus.innerHTML = "loading... ";
    this.model = (await tf.loadLayersModel(
      "/models/pretrainedModel.json"
    )) as tf.LayersModel;
    this.model.summary();
    this.modelStatus.innerHTML = "loaded";
    this.isTrained = true;
    if (trackMovement) {
      trackMovement();
    }
  }

  async predictValues(mouseX: number, mouseY: number): Promise<number[]> {
    const inputTensor = tf.tensor2d([[mouseX, mouseY]]);
    const outputData: number[] = [];

    const data = await this.model.predict(inputTensor).data();

    for (let i = 0; i < data.length; i++) {
      outputData.push(data[i]);
    }
    inputTensor.dispose();

    return outputData;
  }

  prepareTraining(inputData: number[][], outputData: number[][]) {
    if (inputData.length === 0) return;
    this.isTrained = false;
    this.trainProgress.innerHTML = "0%";
    this.modelStatus.innerHTML = "preparing training";

    tf.util.shuffleCombo(inputData, outputData);

    const inputTensor = tf.tensor2d(inputData);
    const outputTensor = tf.tensor2d(outputData);

    this.model = tf.sequential();
    this.model.add(
      tf.layers.dense({ inputShape: [2], units: 16, activation: "relu" })
    );
    this.model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    this.model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    this.model.add(tf.layers.dense({ units: 7 }));

    this.model.summary();
    this.#train(inputTensor, outputTensor);
  }

  async #train(inputTensor: any, outputTensor: any) {
    this.optimizer = tf.train.sgd(this.learningRate);
    this.modelStatus.innerHTML = "training...";
    this.model.compile({
      optimizer: this.optimizer,
      loss: "meanSquaredError",
    });

    const results = await this.model.fit(inputTensor, outputTensor, {
      callbacks: { onEpochEnd: this.logProgress },
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

    this.isTrained = true;
    this.modelStatus.innerHTML = "trained";
  }
}
