# Testing record

## Executed checks

`node tests.js` covers fourteen deterministic checks:

1. Approved conventional 200°C / 30-minute example → 160°C / 24 minutes / 18-minute check.
2. Fan conversion temperature adjustment.
3. Gas Mark 4 lookup conversion.
4. Half Gas Mark support.
5. Unsupported Gas Mark rejection.
6. Time rounding.
7. Very short duration early-check floor.
8. Missing/invalid temperature and zero time validation.
9. Unusually high temperatures: warning without hidden clamping.
10. Nearest Gas Mark helper used on a unit switch.
11. The reported Gas Mark 4 / 10-minute scenario → 140°C / 8 minutes / a 6-minute check, confirming those inputs cannot validly show 160°C / 24 minutes.
12. All seven food categories are present and each has three non-empty contextual tips.
13. The GitHub Pages entry point uses only local assets; no backend or external application dependency is referenced.
14. Theme preference persistence and immediate input/category update listeners are wired into the app.

## Manual browser review checklist

Before release, open `index.html` in a current desktop and mobile browser and check:

- Tab through segmented controls, steppers, select and theme button; focus rings must remain visible.
- Change every input and confirm the result updates without a Convert button.
- Switch Celsius ↔ Gas Mark and conventional ↔ fan mode; the expected Gas Mark 4 / 10-minute conventional result is 140°C / 8 minutes.
- Test an unsupported Gas Mark and an empty input.
- Check every food category, both colour themes and a narrow mobile viewport.
- Confirm the local theme choice survives a page reload.

## Known limits

- The 20°C/40°C and 80% rules are intentionally general estimates, not a scientific prediction for every food or appliance.
- Gas Mark charts vary slightly by publisher and oven calibration; this tool uses a documented lookup and flags unsupported values rather than pretending the scale is linear.
- A browser accessibility audit and physical-device test should be completed by the publisher before public launch.
