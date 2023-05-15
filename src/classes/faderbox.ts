import Synth from "./synth";

class Fader {
  id: number;
  container: HTMLElement;
  getValue: (v: number, id: number) => void;

  wrapper: HTMLDivElement;
  position: HTMLDivElement;
  line: HTMLDivElement;
  rect: DOMRect;
  isTracking: boolean;
  value: number;

  constructor(
    id: number,
    container: HTMLElement,
    getValue: (v: number, id: number) => void
  ) {
    this.container = container;

    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("fader-wrapper");
    this.id = id;
    this.wrapper.id = `fader_${this.id}`;

    this.position = document.createElement("div");
    this.position.classList.add("fader-position");

    this.line = document.createElement("div");
    this.line.classList.add("fader-line");

    this.wrapper.appendChild(this.position);
    this.wrapper.appendChild(this.line);
    this.container.appendChild(this.wrapper);

    this.rect = this.wrapper.getBoundingClientRect();

    this.isTracking = false;

    this.value = 0.5;
    this.getValue = getValue;

    this.#addEventListeners();
  }

  setValue(v: number) {
    this.value = v;
    const position = Math.round(this.value * 100);
    if (position >= 100 || position <= 0) return;
    this.position.style.top = `${position}%`;
  }

  #addEventListeners() {
    this.wrapper.onmousedown = (e: MouseEvent | TouchEvent) => {
      this.isTracking = true;
      const { clientY } = e as MouseEvent;
      const position = Math.round(
        ((clientY - this.rect.top) / this.rect.height) * 100
      );
      if (position >= 100 || position <= 0) return;
      this.value = 1 - position / 100;
      this.getValue(this.value, this.id);
      requestAnimationFrame(() => {
        this.position.style.top = `${position}%`;
      });
    };

    this.wrapper.onmousemove = (e: MouseEvent) => {
      if (!this.isTracking) return;
      this.wrapper.onmousedown?.(e as MouseEvent);
    };

    this.wrapper.onmouseup = () => {
      this.isTracking = false;
    };

    this.wrapper.onmouseleave = () => {
      this.isTracking = false;
    };

    this.wrapper.ontouchstart = (e: TouchEvent) => {
      const event: any = e.touches[0];
      this.wrapper.onmousedown?.(event);
    };

    this.wrapper.ontouchmove = (e: TouchEvent) => {
      e.preventDefault();
      const event = e.touches[0] as any;
      this.wrapper.onmousemove?.(event);
    };

    this.wrapper.ontouchend = () => {
      this.isTracking = false;
    };

    this.wrapper.ontouchcancel = () => {
      this.isTracking = false;
    };
  }
}

export default class Faderbox {
  box: HTMLElement;
  faders: Fader[] = [];
  values: number[] = [];
  synth: Synth;
  outputBox: HTMLElement;

  constructor(synth: any) {
    this.box = document.getElementById("faderbox_el") as HTMLElement;
    this.box.classList.add("faderbox");
    this.synth = synth;
    this.outputBox = document.getElementsByTagName("BODY")[0] as HTMLElement;

    for (let i = 0; i < 7; i++) {
      const fader = new Fader(i, this.box, this.getValue.bind(this));
      this.faders.push(fader);
      this.values.push(fader.value);
    }
  }

  getValue(v: number, id: number): void {
    this.values[id] = v;
    this.synth.setParams(this.values);
    this.styleBackground(this.values);
  }

  setValues(values: number[]): void {
    for (let i = 0; i < values.length; i++) {
      this.faders[i].setValue(1 - values[i]);
      this.values[i] = values[i];
      this.synth.setParams(this.values);
    }
  }

  styleBackground(values: number[]) {
    this.outputBox.style.backgroundImage = `
        linear-gradient(
          ${values[0] * 360}deg,
          rgb(${values[1] * 255},${values[2] * 255},${values[3] * 255}),
          rgb(${values[4] * 255},${values[5] * 255},${values[6] * 255})
        )`;
  }
}
