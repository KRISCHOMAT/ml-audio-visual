import * as tf from "@tensorflow/tfjs";
import PosBox from "./posBox";

export default class Model {
  model: tf.LayersModel | tf.Sequential | undefined = undefined;
  isTrained: boolean = false;
  modelStatus: HTMLElement;
  collectedData: HTMLElement;
  trainButton: HTMLButtonElement;
  trainProgress: HTMLElement;
  posBox: PosBox;

  constructor(posBox: PosBox) {
    this.modelStatus = document.getElementById("collected_data") as HTMLElement;
    this.collectedData = document.getElementById("model_status") as HTMLElement;
    this.trainButton = document.getElementById(
      "train_button"
    ) as HTMLButtonElement;
    this.trainProgress = document.getElementById(
      "training_progress"
    ) as HTMLElement;

    this.posBox = posBox;

    this.loadPretrainedModel();
  }

  async loadPretrainedModel() {
    this.modelStatus.innerHTML = "loading... ";
    this.model = (await tf.loadLayersModel(
      "/models/pretrainedModel.json"
    )) as tf.LayersModel;
    this.model.summary();
  }

  prepareTraining() {
    if ((this.posBox.outputData.length = 0)) return;
    this.trainProgress.innerHTML = "0%";
    this.modelStatus.innerHTML = "preparing training";

    const { inputData, outputData } = this.posBox;
    tf.util.shuffleCombo(inputData, outputData);

    const inputTensor = tf.tensor2d(inputData);
    const outpuTensor = tf.tensor2d(outputData);

    this.model = tf.sequential() as tf.Sequential;
  }
  train() {}
}
