import Faderbox from "./faderbox";
import Synth from "./synth";
import Model from "./model";

export default class PosBox {
  posBoxEl: HTMLElement;
  posRect: DOMRect;
  posIndicator: HTMLElement;
  isTracking: boolean;
  mouseX: number;
  mouseY: number;
  model: Model;
  faderbox: Faderbox;
  synth: Synth;
  addDataButton: HTMLButtonElement;
  removeDataButton: HTMLButtonElement;
  trainButton: HTMLButtonElement;

  collectedData: HTMLElement;
  inputData: number[][] = [];
  outputData: number[][] = [];
  logging: any;

  constructor(model: Model, faderbox: Faderbox, synth: Synth) {
    this.addDataButton = document.getElementById(
      "add_data"
    ) as HTMLButtonElement;

    this.removeDataButton = document.getElementById(
      "remove_data"
    ) as HTMLButtonElement;

    this.trainButton = document.getElementById("train") as HTMLButtonElement;

    this.collectedData = document.getElementById(
      "collected_data"
    ) as HTMLButtonElement;

    this.posBoxEl = document.getElementById("pos_box") as HTMLElement;
    this.posRect = this.posBoxEl.getBoundingClientRect();
    this.posIndicator = document.getElementById("pos_indicator") as HTMLElement;
    this.isTracking = false;
    this.model = model;
    this.faderbox = faderbox;
    this.synth = synth;
    this.mouseX = Math.random();
    this.mouseY = Math.random();

    this.#addEventListeners();

    this.addDataButton.onclick = () => {
      this.collectData(this.mouseX, this.mouseY, this.faderbox);
    };

    this.removeDataButton.onclick = () => {
      this.removeData();
    };

    this.trainButton.onclick = () => {
      this.model.prepareTraining(this.inputData, this.outputData);
    };

    this.model.loadPretrainedModel(this.#trackMovement.bind(this));
  }

  #addEventListeners() {
    // touch events
    this.posBoxEl.ontouchstart = () => {
      this.isTracking = true;
    };

    this.posBoxEl.ontouchend = () => {
      this.isTracking = false;
    };

    this.posBoxEl.ontouchcancel = () => {
      this.posBoxEl.ontouchend;
    };

    this.posBoxEl.ontouchmove = (e: TouchEvent) => {
      e.preventDefault();
      if (!this.isTracking) return;
      this.mouseX =
        (e.touches[0].clientX - this.posRect.left) / this.posRect.width;
      this.mouseY =
        (e.touches[0].clientY - this.posRect.top) / this.posRect.height;
      this.#trackMovement();
    };

    // click events
    this.posBoxEl.onmousedown = () => {
      this.isTracking = true;
    };

    this.posBoxEl.onmouseup = () => {
      this.isTracking = false;
    };

    this.posBoxEl.onmousemove = (e: MouseEvent) => {
      e.preventDefault();
      if (!this.isTracking) return;
      this.mouseX = (e.clientX - this.posRect.left) / this.posRect.width;
      this.mouseY = (e.clientY - this.posRect.top) / this.posRect.height;
      this.#trackMovement();
    };
  }

  collectData(mouseX: number, mouseY: number, faderbox: Faderbox): void {
    this.outputData.push(faderbox.values);
    this.inputData.push([mouseX, mouseY]);
    this.collectedData.innerHTML = String(this.outputData.length);
  }

  removeData() {
    this.outputData = [];
    this.inputData = [];
    this.collectedData.innerHTML = String(this.outputData.length);
  }

  async #trackMovement() {
    if (
      this.mouseX >= 1 ||
      this.mouseX <= 0 ||
      this.mouseY >= 1 ||
      this.mouseY <= 0
    )
      return;

    this.posIndicator.style.left = `${this.mouseX * 100}%`;
    this.posIndicator.style.top = `${this.mouseY * 100}%`;

    if (!this.model.isTrained) return;

    const output = await this.model.predictValues(this.mouseX, this.mouseY);

    this.faderbox.styleBackground(output);
    this.faderbox.setValues(output);
  }
}
