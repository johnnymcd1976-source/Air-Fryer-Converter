const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  convert, gasToCelsius, celsiusToNearestGas, nextGasMark, toGasDisplay, fromGasDisplay,
  validateCelsius, validateGasMark, validateMinutes, roundToTen, FOOD_TIPS
} = require("./calculation.js");

let checks = 0;
function test(name, fn) { fn(); checks++; console.log(`✓ ${name}`); }

test("approved conventional 200°C / 30 min example", () => {
  assert.deepEqual(convert({ ovenType: "conventional", unit: "celsius", temperature: 200, minutes: 30 }), {
    celsius: 200, airFryerTemperature: 160, airFryerMinutes: 24, checkAfter: 18, caution: ""
  });
});
test("approved conventional 190°C / 30 min example", () => assert.equal(convert({ ovenType: "conventional", unit: "celsius", temperature: 190, minutes: 30 }).airFryerTemperature, 150));
test("approved fan 180°C / 30 min example", () => assert.equal(convert({ ovenType: "fan", unit: "celsius", temperature: 180, minutes: 30 }).airFryerTemperature, 160));
test("fan 175°C rounds 155°C upward to 160°C", () => assert.equal(convert({ ovenType: "fan", unit: "celsius", temperature: 175, minutes: 30 }).airFryerTemperature, 160));
test("approved conventional 220°C / 40 min example", () => {
  const result = convert({ ovenType: "conventional", unit: "celsius", temperature: 220, minutes: 40 });
  assert.equal(result.airFryerTemperature, 180); assert.equal(result.airFryerMinutes, 32);
});

test("temperature rounding uses 10°C steps and halfway rounds upward", () => {
  assert.equal(roundToTen(155), 160); assert.equal(roundToTen(154.9), 150); assert.equal(roundToTen(156), 160);
});
test("whole-number Celsius values are accepted", () => { assert.equal(validateCelsius(175).value, 175); assert.equal(validateCelsius("225").value, 225); });
test("fractional Celsius values are rejected without rounding", () => assert.match(validateCelsius("157.5").error, /whole-number/));
test("zero, negative and out-of-range Celsius values are rejected", () => {
  [0, -20, 49, 301, ""].forEach((value) => assert.ok(validateCelsius(value).error));
});
test("Gas Mark 4 maps through the non-linear lookup", () => {
  const result = convert({ ovenType: "conventional", unit: "gas", temperature: 4, minutes: 30 });
  assert.equal(gasToCelsius(4), 180); assert.equal(result.airFryerTemperature, 140);
});
test("half Gas Marks are supported", () => assert.equal(gasToCelsius(2.5), 157.5));
test("unsupported Gas Mark values are rejected", () => { assert.ok(validateGasMark(2.25).error); assert.ok(validateGasMark(10).error); });
test("Gas Mark steppers move only through recognised marks", () => {
  assert.equal(nextGasMark(4, 1), 4.5); assert.equal(nextGasMark(4, -1), 3.5);
  assert.equal(nextGasMark(0.5, -1), 0.5); assert.equal(nextGasMark(9, 1), 9); assert.equal(nextGasMark(2.25, 1), null);
});
test("Celsius to Gas to Celsius preserves a 175°C entry when Gas Mark is unedited", () => {
  const gasView = toGasDisplay(175);
  assert.equal(gasView.mark, 3.5);
  assert.equal(fromGasDisplay({ ...gasView, gasMark: gasView.mark }), 175);
});
test("repeated unit switching has no Celsius drift", () => {
  let celsius = 175;
  for (let count = 0; count < 10; count++) {
    const gasView = toGasDisplay(celsius);
    celsius = fromGasDisplay({ ...gasView, gasMark: gasView.mark });
  }
  assert.equal(celsius, 175);
});
test("an intentional Gas Mark edit becomes the new Celsius selection", () => {
  const gasView = toGasDisplay(175);
  assert.equal(fromGasDisplay({ ...gasView, gasWasEdited: true, gasMark: 4 }), 180);
});
test("nearest Gas Mark helper is deterministic", () => assert.deepEqual(celsiusToNearestGas(180), { mark: 4, celsius: 180, distance: 0 }));

test("cooking time rounds to whole minutes", () => assert.equal(convert({ ovenType: "fan", unit: "celsius", temperature: 180, minutes: 19.5 }).airFryerMinutes, 16));
test("very short usable duration has a one-minute early check", () => {
  const result = convert({ ovenType: "fan", unit: "celsius", temperature: 180, minutes: 1 });
  assert.equal(result.airFryerMinutes, 1); assert.equal(result.checkAfter, 1);
});
test("zero, negative and unexpectedly large times are rejected", () => {
  [0, -1, 600.1, ""].forEach((value) => assert.ok(validateMinutes(value).error));
});
test("out-of-usual-range suggested temperatures warn but are not clamped", () => {
  const result = convert({ ovenType: "fan", unit: "celsius", temperature: 300, minutes: 20 });
  assert.equal(result.airFryerTemperature, 280); assert.match(result.caution, /outside the usual/);
});
test("Gas Mark 4 / 10 min cannot retain old results", () => {
  const result = convert({ ovenType: "conventional", unit: "gas", temperature: 4, minutes: 10 });
  assert.equal(result.airFryerTemperature, 140); assert.equal(result.airFryerMinutes, 8); assert.equal(result.checkAfter, 6);
});
test("all seven food categories have concise contextual tips", () => {
  assert.deepEqual(Object.keys(FOOD_TIPS), ["chips", "chicken", "fish", "vegetables", "frozen", "baking", "other"]);
  Object.values(FOOD_TIPS).forEach((food) => { assert.ok(food.name); assert.equal(food.tips.length, 3); food.tips.forEach((tip) => assert.ok(tip.length > 8)); });
});
test("75°C guidance is kept in chicken tips, not repeated in the general safety notice", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  assert.match(FOOD_TIPS.chicken.tips.join(" "), /75°C for 30 seconds/);
  const safetyCopy = html.match(/<aside class="safety-notice"[\s\S]*?<\/aside>/)[0];
  assert.doesNotMatch(safetyCopy, /75°C/);
});
test("GitHub Pages entry point uses only local application assets", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  ["styles.css", "calculation.js", "app.js", "manifest.webmanifest", "assets/air-fryer.svg"].forEach((asset) => assert.match(html, new RegExp(asset.replace(".", "\\."))));
  assert.doesNotMatch(html, /https?:\/\//);
});
test("Home Screen icon references use local PNG files at the required sizes", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.webmanifest"), "utf8"));
  const dimensions = (file) => {
    const png = fs.readFileSync(path.join(__dirname, "assets", file));
    assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
    return [png.readUInt32BE(16), png.readUInt32BE(20)];
  };
  assert.match(html, /rel="apple-touch-icon" sizes="180x180" href="assets\/apple-touch-icon\.png"/);
  assert.match(html, /apple-mobile-web-app-title" content="Air Fryer Converter"/);
  assert.deepEqual(dimensions("apple-touch-icon.png"), [180, 180]);
  assert.deepEqual(dimensions("icon-192.png"), [192, 192]);
  assert.deepEqual(dimensions("icon-512.png"), [512, 512]);
  assert.deepEqual(manifest.icons.slice(0, 2).map((icon) => [icon.src, icon.sizes]), [["assets/icon-192.png", "192x192"], ["assets/icon-512.png", "512x512"]]);
});
test("the UI wires immediate updates, local theme persistence and stable unit state", () => {
  const source = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
  assert.match(source, /localStorage\.getItem\("airFryerTheme"\)/);
  assert.match(source, /localStorage\.setItem\("airFryerTheme"/);
  assert.match(source, /temperature\.addEventListener\("input"/);
  assert.match(source, /food\.addEventListener\("change", renderTips\)/);
  assert.match(source, /savedCelsius/);
});

console.log(`\n${checks} automated checks passed.`);
