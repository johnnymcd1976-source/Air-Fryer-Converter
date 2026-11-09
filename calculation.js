/* Shared calculation helpers. Gas marks are a lookup, never a linear formula. */
(function (root) {
  "use strict";

  // Conventional-oven equivalents. Values follow the familiar UK cooker chart;
  // half marks are interpolated only between the listed recipe increments.
  const GAS_MARKS = Object.freeze({
    0.5: 120, 1: 135, 1.5: 142.5, 2: 150, 2.5: 157.5,
    3: 165, 3.5: 172.5, 4: 180, 4.5: 185, 5: 190,
    5.5: 197.5, 6: 205, 6.5: 212.5, 7: 220, 7.5: 225,
    8: 230, 8.5: 237.5, 9: 245
  });
  const FOOD_TIPS = Object.freeze({
    chips: Object.freeze({ name: "chips and wedges", tips: Object.freeze(["Avoid overcrowding the basket.", "Shake halfway through.", "Check for even browning."]) }),
    chicken: Object.freeze({ name: "chicken pieces", tips: Object.freeze(["Turn halfway through where appropriate.", "Use a food thermometer to check safe cooking.", "Allow appropriate resting time."]) }),
    fish: Object.freeze({ name: "fish and fillets", tips: Object.freeze(["Check thicker portions carefully.", "Avoid overcrowding.", "Handle delicate fillets carefully when turning."]) }),
    vegetables: Object.freeze({ name: "roast vegetables", tips: Object.freeze(["Cut pieces to similar sizes.", "Shake or turn during cooking.", "Avoid overcrowding."]) }),
    frozen: Object.freeze({ name: "frozen oven food", tips: Object.freeze(["Check packaging for specific air fryer instructions.", "Cook from frozen only where appropriate.", "Check the centre is properly cooked."]) }),
    baking: Object.freeze({ name: "baking and cakes", tips: Object.freeze(["Use suitable air fryer-safe bakeware.", "Check the centre for doneness.", "Avoid overfilling."]) }),
    other: Object.freeze({ name: "this food", tips: Object.freeze(["Check food regularly.", "Turn or shake where appropriate.", "Confirm food is properly cooked."]) })
  });

  const EPSILON = 0.000001;
  const rounded = (value) => Math.round(value);
  const isFiniteNumber = (value) => Number.isFinite(value);

  function gasToCelsius(gasMark) {
    const mark = Number(gasMark);
    if (!isFiniteNumber(mark)) return null;
    return Object.entries(GAS_MARKS).find(([key]) => Math.abs(Number(key) - mark) < EPSILON)?.[1] ?? null;
  }

  function celsiusToNearestGas(celsius) {
    const target = Number(celsius);
    if (!isFiniteNumber(target)) return null;
    return Object.entries(GAS_MARKS).reduce((nearest, [mark, value]) =>
      Math.abs(value - target) < Math.abs(nearest.celsius - target)
        ? { mark: Number(mark), celsius: value }
        : nearest,
      { mark: 0.5, celsius: GAS_MARKS[0.5] }
    );
  }

  function convert({ ovenType, unit, temperature, minutes }) {
    const time = Number(minutes);
    const inputTemp = Number(temperature);
    if (!isFiniteNumber(time) || time <= 0) return { error: "Enter a cooking time greater than zero." };
    if (!isFiniteNumber(inputTemp)) return { error: "Enter an oven temperature." };

    const celsius = unit === "gas" ? gasToCelsius(inputTemp) : inputTemp;
    if (celsius === null) return { error: "That Gas Mark is not supported. Try a common whole or half mark from ½ to 9." };
    if (celsius <= 0) return { error: "Enter an oven temperature above 0°C." };

    const temperatureAdjustment = ovenType === "fan" ? 20 : 40;
    const airFryerTemperature = rounded(celsius - temperatureAdjustment);
    const airFryerMinutes = rounded(time * 0.8);
    const checkAfter = Math.max(1, rounded(airFryerMinutes * 0.75));
    const caution = celsius < 80 || celsius > 260
      ? "This is an unusual oven setting. Check your recipe and appliance guidance before cooking."
      : "";
    return { celsius, airFryerTemperature, airFryerMinutes, checkAfter, caution };
  }

  const api = { GAS_MARKS, FOOD_TIPS, gasToCelsius, celsiusToNearestGas, convert };
  root.AirFryerCalc = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
