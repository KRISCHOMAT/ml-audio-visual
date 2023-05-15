class SettingElement {
  label: string;
  value: number | string;

  constructor(label: string, value: number | string) {
    this.label = label;
    this.value = value;
  }
}

export interface ISettings {
  lfo: { min: SettingElement; max: SettingElement };
  osc: SettingElement;
  oscType: SettingElement;
  glideTime: SettingElement;
}

export default class Settings {
  wrapper: HTMLElement;
  element: HTMLDivElement;
  body: HTMLElement;
  openButton: HTMLButtonElement;
  closeButton: HTMLButtonElement;
  settings: ISettings;
  settingsArray: SettingElement[];

  onSave: (data: any) => void;

  constructor(onSave: (data: any) => void) {
    this.wrapper = document.getElementById("wrapper")! as HTMLElement;
    this.element = document.createElement("div");
    this.body = document.body;
    this.openButton = document.getElementById(
      "show_settings"
    )! as HTMLButtonElement;
    this.closeButton = document.createElement("button");

    this.settings = {
      lfo: {
        min: new SettingElement("LFO min", 1),
        max: new SettingElement("LFO max", 1000),
      },
      osc: new SettingElement("Base FQ", 440),
      oscType: new SettingElement("OSC Type", "sawtooth"),
      glideTime: new SettingElement("Glide Time", 0),
    };

    this.settingsArray = [
      this.settings.lfo.min,
      this.settings.lfo.max,
      this.settings.osc,
      this.settings.oscType,
      this.settings.glideTime,
    ];

    this.onSave = onSave;

    this.#createUI();
    this.onSave(this.settings);
  }

  openSettings() {
    this.element.style.display = "flex";
    this.wrapper.style.display = "none";
  }

  closeSettings() {
    this.element.style.display = "none";
    this.wrapper.style.display = "flex";
  }

  #createUI() {
    this.openButton.addEventListener("click", () => {
      this.element.style.display = "flex";
      this.wrapper.style.display = "none";
    });

    this.element.style.display = "none";
    this.element.classList.add("settings");

    this.closeButton.innerHTML = "save";
    this.closeButton.addEventListener("click", () => {
      this.closeSettings();
      this.onSave(this.settings);
    });

    this.settingsArray.forEach((setting) => {
      const formRow: HTMLDivElement = document.createElement("div");
      const label: HTMLParagraphElement = document.createElement("p");
      formRow.classList.add("form_row");
      label.innerHTML = setting.label;

      let inputValue: HTMLSelectElement | HTMLInputElement | null = null;

      if (typeof setting.value === "number") {
        inputValue = document.createElement("input") as HTMLInputElement;
        inputValue.type = "text";
        inputValue.value = setting.value.toString();
        inputValue.addEventListener("input", () => {
          setting.value = Number(inputValue!.value);
        });
      } else {
        inputValue = document.createElement("select") as HTMLSelectElement;
        const optionA = document.createElement("option");
        optionA.value = "square";
        optionA.innerHTML = "Square";
        const optionB = document.createElement("option");
        optionB.value = "triangle";
        optionB.innerHTML = "Triangle";
        const optionC = document.createElement("option");
        optionC.value = "sawtooth";
        optionC.innerHTML = "Sawtooth";
        inputValue.appendChild(optionA);
        inputValue.appendChild(optionB);
        inputValue.appendChild(optionC);

        inputValue.value = setting.value.toString();

        inputValue.addEventListener("input", () => {
          setting.value = inputValue!.value;
        });
      }

      formRow.appendChild(label);
      formRow.appendChild(inputValue);
      this.element.append(formRow);
    });
    const spacer: HTMLDivElement = document.createElement("div");
    spacer.classList.add("spacer");
    this.element.appendChild(spacer);
    this.element.appendChild(this.closeButton);
    document.body.prepend(this.element);
  }
}
