import Faderbox from "./faderbox";
import Synth from "./synth";
import Model from "./model";

export default class PosBox {
  posBoxEl: HTMLElement;
  posRect: DOMRect;
  posIndicator: HTMLElement;
  isTracking: boolean;
  mouseX: number = Math.random();
  mouseY: number = Math.random();
  model: Model;
  faderbox: Faderbox;
  synth: Synth;
  addDataButton: HTMLButtonElement;
  removeDataButton: HTMLButtonElement;
  inputData: number[][] = [];
  outputData: number[][] = [];

  constructor(model: Model, faderbox: Faderbox, synth: Synth) {
    this.addDataButton = document.getElementById(
      "add_data"
    ) as HTMLButtonElement;
    this.removeDataButton = document.getElementById(
      "remove_data"
    ) as HTMLButtonElement;

    this.posBoxEl = document.getElementById("pos_box") as HTMLElement;
    this.posRect = this.posBoxEl.getBoundingClientRect();
    this.posIndicator = document.getElementById("pos_indicator") as HTMLElement;
    this.isTracking = false;
    this.model = model;
    this.faderbox = faderbox;
    this.synth = synth;

    this.#addEventListeners();
    this.addDataButton.onclick = () => {
      this.collectData(this.mouseX, this.mouseY, this.faderbox);
    };
    this.removeDataButton.onclick = () => {
      this.removeData();
    };
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
    };

    // click events
    this.posBoxEl.onmousedown = () => {
      this.posBoxEl.ontouchstart;
    };

    this.posBoxEl.onmouseup = () => {
      this.posBoxEl.ontouchend;
    };

    this.posBoxEl.onmousemove = (e: MouseEvent) => {
      e.preventDefault();
      if (!this.isTracking) return;
      this.mouseX = (e.clientX - this.posRect.left) / this.posRect.width;
      this.mouseY = (e.clientY - this.posRect.top) / this.posRect.height;
    };
  }

  collectData(mouseX: number, mouseY: number, faderbox: Faderbox): void {
    this.outputData.push(faderbox.values);
    this.inputData.push([mouseX, mouseY]);
  }

  removeData() {
    this.outputData = [];
    this.inputData = [];
  }

  //   #trackMovement() {
  //     if (
  //       this.mouseX >= 1 ||
  //       this.mouseX <= 0 ||
  //       this.mouseY >= 1 ||
  //       this.mouseY <= 0
  //     )
  //       return;
  //     this.posIndicator.style.left = `${this.mouseX * 100}%`;
  //     this.posIndicator.style.top = `${this.mouseY * 100}%`;

  //     if (!this.isTrained) return;
  //     const inputTensor = tf.tensor2d([[this.mouseX, this.mouseY]]);

  //     const recentOutputs: number[] = [];

  //     model
  //       .predict(inputTensor)
  //       .data()
  //       .then((data: number[]) => {
  //         for (let i = 0; i < data.length; i++) {
  //           recentOutputs[i] = data[i];
  //         }
  //         faderbox.styleBackground(recentOutputs);
  //         synth.setParams(recentOutputs);
  //         faderbox.setValues(recentOutputs);
  //       });

  //     inputTensor.dispose();
  //   }
}
