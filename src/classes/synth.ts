import Settings, { ISettings } from "./settings";

class Osc {
  ctx: AudioContext;
  lfoFreq: number;
  scale: number[];
  oscillator: OscillatorNode;
  lpf: BiquadFilterNode;
  lfo: OscillatorNode;
  pitch: number;
  env: GainNode;
  gain: GainNode;
  pan: StereoPannerNode;
  values: ISettings;
  glideInterval: any = null;
  glideIntervalLFO: any = null;

  constructor(
    ctx: AudioContext,
    pan: number,
    LPF: BiquadFilterNode,
    values: ISettings
  ) {
    this.ctx = ctx;
    this.lfoFreq = 10;
    this.scale = [0, 2, 3, 5, 7, 8, 10, 12];
    this.values = values;
    this.pitch = this.values == null ? 200 : (this.values.osc.value as number);

    // oscillator
    this.oscillator = this.ctx.createOscillator();
    this.oscillator.type = "sawtooth";
    this.oscillator.frequency.setValueAtTime(this.pitch, this.ctx.currentTime);

    //lpf
    this.lpf = this.ctx.createBiquadFilter();
    this.lpf.type = "lowpass";
    this.lpf.frequency.value = 1000;

    //env
    this.lfo = this.ctx.createOscillator();
    this.env = this.ctx.createGain();
    this.lfo.type = "square";
    this.lfo.frequency.setValueAtTime(
      Math.random() * 5 + 1,
      this.ctx.currentTime
    );

    //gain
    this.gain = this.ctx.createGain();
    this.gain.gain.setValueAtTime(0.1, this.ctx.currentTime);

    // create stereo pan
    this.pan = this.ctx.createStereoPanner();
    this.pan.pan.setValueAtTime(pan - 1, this.ctx.currentTime);

    //connections
    this.oscillator.connect(this.env);

    this.lfo.connect(this.env.gain);
    this.env.connect(this.lpf);
    this.lpf.connect(this.gain);
    this.gain.connect(this.pan);
    this.pan.connect(LPF);
  }

  setValues(data: ISettings) {
    this.values = data;
    this.oscillator.type = data.oscType.value as OscillatorType;
  }

  start() {
    this.oscillator.start();
    this.lfo.start();
  }

  setPitch(data: number) {
    const index = Math.floor(data * (this.scale.length - 1));
    const newPitch = this.#calculateFrequency(this.scale[index]);

    if (this.glideInterval) {
      clearInterval(this.glideInterval);
    }

    let t = 0;
    this.glideInterval = setInterval(
      () => {
        this.pitch = this.#lerp(this.pitch, newPitch, t);
        this.oscillator.frequency.setValueAtTime(
          this.pitch,
          this.ctx.currentTime
        );
        t += 0.01;
        if (t >= 1) {
          clearInterval(this.glideInterval);
        }
      },
      this.values == null ? 10 : (this.values.glideTime.value as number)
    );
  }

  setLFO(data: number) {
    const newFQ =
      data * (this.values.lfo.max.value as number) +
      (this.values.lfo.min.value as number);

    if (this.glideIntervalLFO) {
      clearInterval(this.glideIntervalLFO);
    }

    let t = 0;
    this.glideIntervalLFO = setInterval(
      () => {
        this.lfoFreq = this.#lerp(this.lfoFreq, newFQ, t);
        this.lfo.frequency.setValueAtTime(this.lfoFreq, this.ctx.currentTime);
        t += 0.01;
        if (t >= 1) {
          clearInterval(this.glideInterval);
        }
      },
      this.values == null ? 10 : (this.values.glideTime.value as number)
    );
  }

  #lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  #calculateFrequency(semitone: number): number {
    if (this.values == null) return this.pitch;
    return (this.values.osc.value as number) * Math.pow(2, semitone / 12);
  }
}

export default class Synth {
  audioContext: AudioContext;
  masterGain: GainNode;
  LPF: BiquadFilterNode;
  isStarted: boolean = false;
  isRunning: boolean = false;
  isInit: boolean = false;
  oscs: Osc[] = [];
  settings: Settings;

  constructor() {
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);

    this.LPF = this.audioContext.createBiquadFilter();
    this.LPF.type = "lowpass";
    this.LPF.frequency.setValueAtTime(
      Math.random() * 500 + 100,
      this.audioContext.currentTime
    );

    this.LPF.connect(this.masterGain);
    this.settings = new Settings(this.saveSettings.bind(this));
  }

  saveSettings(data: ISettings) {
    if (!this.isInit) {
      for (let i = 0; i < 3; i++) {
        this.oscs.push(new Osc(this.audioContext, i, this.LPF, data));
      }
      this.isInit = true;
    } else {
      this.oscs.forEach((osc) => {
        osc.setValues(data);
      });
    }
  }

  start() {
    this.isStarted = true;
    this.isRunning = true;
    this.oscs.forEach((osc) => {
      osc.start();
    });
  }

  stop() {
    this.isRunning = false;
    this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
  }

  resume() {
    this.isRunning = true;
    this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);
  }

  setParams(params: number[]) {
    if (params.length <= 0) return;
    this.LPF.frequency.setValueAtTime(
      params[params.length - 1] * 300 + 100,
      this.audioContext.currentTime
    );
    for (let i = 0; i < this.oscs.length; i++) {
      this.oscs[i].setPitch(params[i]);
      this.oscs[i].setLFO(params[i + 3]);
    }
  }
}
