import Faderbox from "./classes/faderbox.js";
import Synth from "./classes/synth.js";
import PosBox from "./classes/posBox.js";
import Model from "./classes/model.js";

const audioStatus: HTMLElement = <HTMLElement>(
  document.getElementById("audio_status")
);
const startAudio: HTMLButtonElement = <HTMLButtonElement>(
  document.getElementById("start_audio")
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
const modelC = new Model();
const faderbox = new Faderbox(synth);
new PosBox(modelC, faderbox, synth);
