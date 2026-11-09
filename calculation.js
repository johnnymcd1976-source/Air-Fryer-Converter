/* Shared calculation helpers. Gas marks are a lookup, never a linear formula. */
(function (root) {
  "use strict";

  // Conventional-oven equivalents from a UK cooker chart. Half marks are
  // explicitly listed so the scale is never treated as a linear conversion.
  const GAS_MARKS = Object.freeze({
    0.5: 120, 1: 135, 1.5: 142.5, 2: 150, 2.5: 157.5,
    3: 165, 3.5: 172.5, 4: 180, 4.5: 185, 5: 190,
    5.5: 197.5, 6: 205, 6.5: 212.5, 7: 220, 7.5: 225,
    8: 230, 8.5: 237.5, 9: 245
  });
  const GAS_VALUES = Object.freeze(Object.keys(GAS_MARKS).map(Number).sort((a, b) => a - b));
  const CELSIUS_MIN = 50;
  const CELSIUS_MAX = 300;
  const MINUTES_MIN = 1;
  const MINUTES_MAX = 600;
  const AIR_FRY_MIN = 80;
  const AIR_FRY_MAX = 240;
  const EPSILON = 0.000001;

  const FOOD_TIPS = Object.freeze({
    chips: Object.freeze({ name: "chips and wedges", tips: Object.freeze(["Avoid overcrowding the basket.", "Shake halfway through.", "Check for even browning."]) }),
    chicken: Object.freeze({ name: "chicken pieces", tips: Object.freeze(["Turn halfway through where appropriate.", "Use a food thermometer; 75°C for 30 seconds is one recognised safe combination.", "Allow appropriate resting time."]) }),
    fish: Object.freeze({ name: "fish and fillets", tips: Object.freeze(["Check thicker portions carefully.", "Avoid overcrowding.", "Handle delicate fillets carefully when turning."]) }),
    vegetables: Object.freeze({ name: "roast vegetables", tips: Object.freeze(["Cut pieces to similar sizes.", "Shake or turn during cooking.", "Avoid overcrowding."]) }),
    frozen: Object.freeze({ name: "frozen oven food", tips: Object.freeze(["Check packaging for specific air fryer instructions.", "Cook from frozen only where appropriate.", "Check the centre is properly cooked."]) }),
    baking: Object.freeze({ name: "baking and cakes", tips: Object.freeze(["Use suitable air fryer-safe bakeware.", "Check the centre for doneness.", "Avoid overfilling."]) }),
    other: Object.freeze({ name: "this food", tips: Object.freeze(["Check food regularly.", "Turn or shake where appropriate.", "Confirm food is properly cooked."]) })
  });

  function strictNumber(value) {
    if (value === "" || value === null || value === undefined || (typeof value === "string" && value.trim() === "")) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  // Explicitly rounds positive .5 values upward, including when rounding to 10.
  function roundHalfUp(value) { return Math.floor(value + 0.5); }
  function roundToTen(value) { return roundHalfUp(value / 10) * 10; }

  function validateCelsius(value) {
    const celsius = strictNumber(value);
    if (celsius === null) return { error: "Enter an oven temperature." };
    if (!Number.isInteger(celsius)) return { error: "Enter a whole-number Celsius temperature." };
    if (celsius < CELSIUS_MIN || celsius > CELSIUS_MAX) return { error: `Enter a Celsius temperature from ${CELSIUS_MIN}°C to ${CELSIUS_MAX}°C.` };
    return { value: celsius };
  }

  function gasToCelsius(gasMark) {
    const mark = strictNumber(gasMark);
    if (mark === null) return null;
    return Object.entries(GAS_MARKS).find(([key]) => Math.abs(Number(key) - mark) < EPSILON)?.[1] ?? null;
  }

  function validateGasMark(value) {
    const celsius = gasToCelsius(value);
    return celsius === null
      ? { error: "That Gas Mark is not supported. Try a common whole or half mark from ½ to 9." }
      : { value: celsius };
  }

  function celsiusToNearestGas(celsius) {
    const target = strictNumber(celsius);
    if (target === null) return null;
    return Object.entries(GAS_MARKS).reduce((nearest, [mark, value]) => {
      const distance = Math.abs(value - target);
      // On a tie, choose the warmer mark: it is deterministic and avoids a
      // surprising downward change at exact midpoints.
      return distance < nearest.distance || (distance === nearest.distance && value > nearest.celsius)
        ? { mark: Number(mark), celsius: value, distance }
        : nearest;
    }, { mark: 0.5, celsius: GAS_MARKS[0.5], distance: Math.abs(GAS_MARKS[0.5] - target) });
  }

  function nextGasMark(current, direction) {
    const currentValue = strictNumber(current);
    const index = GAS_VALUES.findIndex((mark) => Math.abs(mark - currentValue) < EPSILON);
    if (index < 0) return null;
    const nextIndex = Math.max(0, Math.min(GAS_VALUES.length - 1, index + Number(direction)));
    return GAS_VALUES[nextIndex];
  }

  function toGasDisplay(celsius) {
    const valid = validateCelsius(celsius);
    if (valid.error) return null;
    return { mark: celsiusToNearestGas(valid.value).mark, savedCelsius: valid.value, gasWasEdited: false };
  }

  function fromGasDisplay({ savedCelsius, gasWasEdited, gasMark }) {
    if (!gasWasEdited && Number.isInteger(savedCelsius)) return savedCelsius;
    return gasToCelsius(gasMark);
  }

  function validateMinutes(value) {
    const minutes = strictNumber(value);
    if (minutes === null) return { error: "Enter a cooking time." };
    if (minutes < MINUTES_MIN || minutes > MINUTES_MAX) return { error: `Enter a cooking time from ${MINUTES_MIN} to ${MINUTES_MAX} minutes.` };
    return { value: minutes };
  }

  function convert({ ovenType, unit, temperature, minutes }) {
    const timeResult = validateMinutes(minutes);
    if (timeResult.error) return timeResult;
    const temperatureResult = unit === "gas" ? validateGasMark(temperature) : validateCelsius(temperature);
    if (temperatureResult.error) return temperatureResult;

    const celsius = temperatureResult.value;
    const temperatureAdjustment = ovenType === "fan" ? 20 : 40;
    const airFryerTemperature = roundToTen(celsius - temperatureAdjustment);
    const airFryerMinutes = roundHalfUp(timeResult.value * 0.8);
    const checkAfter = Math.max(1, roundHalfUp(airFryerMinutes * 0.75));
    const caution = airFryerTemperature < AIR_FRY_MIN || airFryerTemperature > AIR_FRY_MAX
      ? "This suggested temperature is outside the usual air-fry range. Check your recipe and appliance guidance before cooking."
      : "";
    return { celsius, airFryerTemperature, airFryerMinutes, checkAfter, caution };
  }

  const api = {
    GAS_MARKS, GAS_VALUES, FOOD_TIPS, CELSIUS_MIN, CELSIUS_MAX, MINUTES_MIN, MINUTES_MAX,
    gasToCelsius, celsiusToNearestGas, nextGasMark, toGasDisplay, fromGasDisplay, validateCelsius, validateGasMark,
    validateMinutes, roundHalfUp, roundToTen, convert
  };
  root.AirFryerCalc = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
