# Air Fryer Converter

A lightweight, single-page, static calculator that turns conventional or fan-oven instructions into a cautious air fryer estimate. It needs no build step, account, API, analytics or backend, and is ready for GitHub Pages.

## Use

Open `index.html` in a modern browser. Enter an oven temperature and cooking time; results refresh immediately. The calculator provides:

- Conventional and fan oven modes.
- Celsius and common UK whole/half Gas Mark inputs.
- Editable numeric fields plus large increment/decrement controls.
- Seven food-tip categories that change guidance only, never the conversion formula.
- A remembered light/dark setting (device preference is used initially).
- A visible food-safety reminder.

## Calculation rules

- Conventional: input temperature − 40°C.
- Fan oven: input temperature − 20°C.
- Time: input time × 0.8.
- Temperature and time are rounded to the nearest whole degree/minute; the early check reminder is 75% of the rounded time, again rounded to the nearest minute.
- Gas Mark is translated by lookup, rather than treated as a linear scale. Inputs outside the supported common marks (½–9 in half-mark increments) show a clear message.

These are planning estimates, not guaranteed cooking instructions. Air fryers differ by capacity, airflow and load. Follow the food packaging and appliance guidance, and check food is safely cooked before serving.

## Food-safety basis

The safety note is based on the UK Food Standards Agency’s advice: for foods needing thorough cooking, use a clean food thermometer in the centre/thickest part; 75°C for 30 seconds is one listed safe time-temperature combination. See [FSA: Cooking your food](https://www.food.gov.uk/safety-hygiene/cooking-your-food?ContensisTextOnly=true). This source supports safe-cooking checks, not the app’s convenience estimate.

Gas Mark values are approximate conventional-oven equivalents. The lookup is aligned with an appliance maker’s UK chart, including its non-linear values; see [Electrolux UK Gas Mark guidance](https://support.electrolux.co.uk/support-articles/article/what-do-the-gas-mark-numbers-mean-relate-to-temperatures).

## Test

With Node.js installed, run:

```sh
node tests.js
```

This runs calculation and validation boundary tests with no dependencies.

## GitHub Pages deployment

1. Create a new GitHub repository and upload the contents of this folder (not the containing folder, unless you prefer it as the repository root).
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**, then choose `main` and `/(root)`.
4. Save. GitHub will provide the public site address after deployment completes.

All paths are relative, so the app works whether Pages is deployed at a user site or project site. Do not publish until you have reviewed the files and chosen a licence. For a broadly reusable public project, consider MIT; obtain advice if you need a different licence or have third-party material to include.
