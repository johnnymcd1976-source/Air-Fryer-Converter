(function () {
  "use strict";
  const calc = window.AirFryerCalc;
  const foodTips = calc.FOOD_TIPS;
  const state = { ovenType: "conventional", unit: "celsius" };
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

  function formatNumber(value) { return Number.isInteger(value) ? String(value) : String(value).replace(/\.0$/, ""); }
  function renderTips() {
    const details = foodTips[food.value];
    foodName.textContent = details.name;
    tipsList.replaceChildren(...details.tips.map((tip) => { const item = document.createElement("li"); item.textContent = tip; return item; }));
  }
  function updateButtons(group, key, selected) {
    document.querySelectorAll(group).forEach((button) => {
      const active = button.dataset[key] === selected;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }
  function updateResults() {
    const outcome = calc.convert({ ovenType: state.ovenType, unit: state.unit, temperature: temperature.value, minutes: time.value });
    if (outcome.error) {
      message.textContent = outcome.error;
      resultGrid.setAttribute("aria-hidden", "true");
      checkReminder.setAttribute("aria-hidden", "true");
      return;
    }
    message.textContent = outcome.caution;
    resultGrid.removeAttribute("aria-hidden");
    checkReminder.removeAttribute("aria-hidden");
    resultTemperature.textContent = `${outcome.airFryerTemperature}°C`;
    resultTime.textContent = `${outcome.airFryerMinutes} min`;
    checkReminder.innerHTML = `Check after approximately <strong>${outcome.checkAfter} minute${outcome.checkAfter === 1 ? "" : "s"}</strong>.`;
  }
  function switchUnit(unit) {
    if (unit === state.unit) return;
    const current = Number(temperature.value);
    if (state.unit === "celsius" && Number.isFinite(current)) {
      const nearest = calc.celsiusToNearestGas(current);
      temperature.value = formatNumber(nearest.mark);
    } else if (state.unit === "gas") {
      const celsius = calc.gasToCelsius(current);
      if (celsius !== null) temperature.value = formatNumber(celsius);
    }
    state.unit = unit;
    const gas = unit === "gas";
    temperatureUnit.textContent = gas ? "Gas Mark" : "°C";
    temperature.step = gas ? "0.5" : "5";
    temperatureHelp.hidden = !gas;
    updateButtons("[data-unit]", "unit", unit);
    updateResults();
  }
  function stepInput(event) {
    const button = event.currentTarget;
    const target = button.dataset.step === "time" ? time : temperature;
    const step = button.dataset.step === "time" ? 1 : state.unit === "gas" ? 0.5 : 5;
    const value = Number(target.value);
    target.value = formatNumber((Number.isFinite(value) ? value : 0) + step * Number(button.dataset.direction));
    target.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function applyTheme(theme, persist) {
    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute("aria-pressed", String(theme === "light"));
    themeToggle.title = theme === "dark" ? "Use light theme" : "Use dark theme";
    if (persist) localStorage.setItem("airFryerTheme", theme);
  }
  document.querySelectorAll("[data-oven]").forEach((button) => button.addEventListener("click", () => { state.ovenType = button.dataset.oven; updateButtons("[data-oven]", "oven", state.ovenType); updateResults(); }));
  document.querySelectorAll("[data-unit]").forEach((button) => button.addEventListener("click", () => switchUnit(button.dataset.unit)));
  document.querySelectorAll("[data-step]").forEach((button) => button.addEventListener("click", stepInput));
  [temperature, time].forEach((input) => input.addEventListener("input", updateResults));
  food.addEventListener("change", renderTips);
  themeToggle.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true));
  const storedTheme = localStorage.getItem("airFryerTheme");
  applyTheme(storedTheme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"), false);
  renderTips(); updateResults();
})();
