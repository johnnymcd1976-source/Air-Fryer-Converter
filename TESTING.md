# Testing record

## Automated checks run

`node tests.js` was run successfully on the release candidate. It contains 26 deterministic checks covering:

- Approved conventional and fan examples, including 175°C fan → 160°C and 220°C conventional / 40 minutes → 180°C / 32 minutes.
- 10°C suggested-temperature rounding, with exact halves rounded upward.
- Whole-number Celsius acceptance and fractional, empty, zero, negative and out-of-range Celsius rejection.
- UK whole and half Gas Mark lookups, invalid Gas Mark rejection and recognised half-mark button stepping.
- Celsius → Gas Mark → Celsius restoration, repeated unit changes without drift, and intentional Gas Mark edits becoming the new Celsius source.
- Whole-minute time rounding, short-duration handling, early-check calculation and time boundaries.
- Out-of-usual-range air-fry warnings without hidden clamping.
- All seven food-tip categories, the chicken-specific 75°C guidance, compact general safety text, local GitHub Pages asset paths, theme preference storage and immediate-update wiring.

Syntax checking also passed for `calculation.js` and `app.js`.

## Layout and accessibility review

The CSS has a dedicated narrow-screen layout for widths below 620px. It reduces spacing and padding while retaining 44px-or-larger touch controls, two-column result cards, safe-area padding, focus styles, reduced-motion support and no fixed-width content that could force horizontal scrolling from 320px upward.

The source was reviewed for semantic labels, keyboard-operable buttons and select controls, visible focus indicators, validation status text and local theme persistence.

## Remaining release checks

No device simulator or headless browser is available in this workspace, so physical-device visual checks at 320px, 360px, 375px, 390px, 430px, tablet and desktop widths remain for final publisher approval. Use the supplied release candidate ZIP or local project folder to make those checks before publishing.

## Known limits

- The 20°C/40°C and 80% rules are general planning estimates, not appliance-specific cooking instructions.
- Gas Mark charts vary slightly by publisher and oven calibration. The app uses a non-linear lookup and does not pretend unsupported values are valid.
- Suggested temperatures outside 80°C–240°C are shown with a warning, not silently changed.
