(function () {
  "use strict";

  const calc = window.AirFryerCalc;
  const foodTips = calc.FOOD_TIPS;
  const state = {
    ovenType: "conventional",
    unit: "celsius",
    // Keep the exact Celsius entry while a nearest Gas Mark is only being displayed.
    // This prevents Celsius → Gas → Celsius drift.
    savedCelsius: 200,
    gasWasEdited: false
  };
  const temperature = document.querySelector("#temperature");
  const time = document.querySelector("#time");
  const food = document.querySelector("#food");
  const temperatureUnit = document.querySelector("#temperature-unit");
  const temperatureHelp = document.querySelector("#temperature-help");
  const message = document.querySelector("#validation-message");
  const resultGrid = document.querySelector("#result-grid");
  const checkReminder = document.querySelector("#check-reminder");
  const resultTemperature = document.querySelector("#result-temperature");
  const resultTime = document.querySelector("#result-time");
  const foodName = document.querySelector("#food-name");
  const tipsList = document.querySelector("#tips-list");
  const themeToggle = document.querySelector("#theme-toggle");
  const temperatureDecrease = document.querySelector('[data-step="temperature"][data-direction="-1"]');
  const temperatureIncrease = document.querySelector('[data-step="temperature"][data-direction="1"]');
  const timeDecrease = document.querySelector('[data-step="time"][data-direction="-1"]');
  const timeIncrease = document.querySelector('[data-step="time"][data-direction="1"]');

  function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : String(value).replace(/\.0$/, "");
  }

  function renderTips() {
    const details = foodTips[food.value];
    foodName.textContent = details.name;
    tipsList.replaceChildren(...details.tips.map((tip) => {
      const item = document.createElement("li");
      item.textContent = tip;
      return item;
    }));
  }

  function updateButtons(group, key, selected) {
    document.querySelectorAll(group).forEach((button) => {
      const active = button.dataset[key] === selected;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function updateStepperAvailability() {
    const tempValue = Number(temperature.value);
    const timeValue = Number(time.value);
    if (state.unit === "gas") {
      const position = calc.GAS_VALUES.findIndex((mark) => mark === tempValue);
      temperatureDecrease.disabled = position <= 0;
      temperatureIncrease.disabled = position < 0 || position >= calc.GAS_VALUES.length - 1;
    } else {
      temperatureDecrease.disabled = !Number.isInteger(tempValue) || tempValue <= calc.CELSIUS_MIN;
      temperatureIncrease.disabled = !Number.isInteger(tempValue) || tempValue >= calc.CELSIUS_MAX;
    }
    timeDecrease.disabled = !Number.isFinite(timeValue) || timeValue <= calc.MINUTES_MIN;
    timeIncrease.disabled = !Number.isFinite(timeValue) || timeValue >= calc.MINUTES_MAX;
  }

  function updateSavedCelsiusFromInput() {
    if (state.unit === "celsius") {
      const valid = calc.validateCelsius(temperature.value);
      if (!valid.error) state.savedCelsius = valid.value;
    } else {
      state.gasWasEdited = true;
    }
  }

  function updateResults() {
    const outcome = calc.convert({
      ovenType: state.ovenType,
      unit: state.unit,
      temperature: temperature.value,
      minutes: time.value
    });
    updateStepperAvailability();
    if (outcome.error) {
      message.textContent = outcome.error;
      resultGrid.hidden = true;
      checkReminder.hidden = true;
      return;
    }
    message.textContent = outcome.caution;
    resultGrid.hidden = false;
    checkReminder.hidden = false;
    resultTemperature.textContent = `${outcome.airFryerTemperature}°C`;
    resultTime.textContent = `${outcome.airFryerMinutes} min`;
    checkReminder.innerHTML = `Check after approximately <strong>${outcome.checkAfter} minute${outcome.checkAfter === 1 ? "" : "s"}</strong> to assess progress; this does not confirm that food is cooked.`;
  }

  function configureTemperatureInput() {
    const gas = state.unit === "gas";
    temperatureUnit.textContent = gas ? "Gas Mark" : "°C";
    temperature.inputMode = gas ? "decimal" : "numeric";
    temperature.step = gas ? "0.5" : "1";
    temperature.min = gas ? "0.5" : String(calc.CELSIUS_MIN);
    temperature.max = gas ? "9" : String(calc.CELSIUS_MAX);
    temperatureHelp.hidden = !gas;
  }

  function switchUnit(unit) {
    if (unit === state.unit) return;

    if (unit === "gas") {
      const gasDisplay = calc.toGasDisplay(temperature.value);
      if (gasDisplay) {
        state.savedCelsius = gasDisplay.savedCelsius;
        temperature.value = formatNumber(gasDisplay.mark);
        state.gasWasEdited = gasDisplay.gasWasEdited;
      }
    } else {
      const celsius = calc.fromGasDisplay({ savedCelsius: state.savedCelsius, gasWasEdited: state.gasWasEdited, gasMark: temperature.value });
      if (celsius !== null) {
        temperature.value = formatNumber(celsius);
        state.savedCelsius = celsius;
      }
    }

    state.unit = unit;
    configureTemperatureInput();
    updateButtons("[data-unit]", "unit", unit);
    updateResults();
  }

  function stepInput(event) {
    const button = event.currentTarget;
    const direction = Number(button.dataset.direction);
    if (button.dataset.step === "temperature") {
      if (state.unit === "gas") {
        const nextMark = calc.nextGasMark(temperature.value, direction);
        if (nextMark === null) return;
        temperature.value = formatNumber(nextMark);
        state.gasWasEdited = true;
      } else {
        const current = Number(temperature.value);
        if (!Number.isInteger(current)) return;
        const next = Math.max(calc.CELSIUS_MIN, Math.min(calc.CELSIUS_MAX, current + (direction * 10)));
        temperature.value = String(next);
        state.savedCelsius = next;
      }
    } else {
      const current = Number(time.value);
      if (!Number.isFinite(current)) return;
      time.value = String(Math.max(calc.MINUTES_MIN, Math.min(calc.MINUTES_MAX, current + direction)));
    }
    updateResults();
  }

  function applyTheme(theme, persist) {
    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute("aria-pressed", String(theme === "light"));
    themeToggle.title = theme === "dark" ? "Use light theme" : "Use dark theme";
    if (persist) localStorage.setItem("airFryerTheme", theme);
  }

  document.querySelectorAll("[data-oven]").forEach((button) => button.addEventListener("click", () => {
    state.ovenType = button.dataset.oven;
    updateButtons("[data-oven]", "oven", state.ovenType);
    updateResults();
  }));
  document.querySelectorAll("[data-unit]").forEach((button) => button.addEventListener("click", () => switchUnit(button.dataset.unit)));
  document.querySelectorAll("[data-step]").forEach((button) => button.addEventListener("click", stepInput));
  temperature.addEventListener("input", () => {
    updateSavedCelsiusFromInput();
    updateResults();
  });
  time.addEventListener("input", updateResults);
  food.addEventListener("change", renderTips);
  themeToggle.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true));

  const storedTheme = localStorage.getItem("airFryerTheme");
  applyTheme(storedTheme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"), false);
  configureTemperatureInput();
  renderTips();
  updateResults();
})();
