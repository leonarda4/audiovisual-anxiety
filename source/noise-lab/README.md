# Echo gradient source

Imported from [leonarda4/The-noise-lab](https://github.com/leonarda4/The-noise-lab/tree/ee4ca05515b26a4c7c89a41203764beacebec679), commit `ee4ca05515b26a4c7c89a41203764beacebec679`.

`config.ts`, `types.ts`, and `shaders/visualShader.ts` are unchanged upstream files. `renderer.js` adapts the uniform and phase setup from upstream `src/components/VisualCanvas.tsx` to draw all tiles in one WebGL context. The runtime shader adds a viewport origin only to keep film grain local to each tile. Recipe parameters, palette precedence, color bias, and phase rates are preserved; missing parameters use upstream defaults.

`recipes.json` contains 30 saved recipes arranged as five studies per emotion, following the supplied reference. The selection includes the 12 clear visual matches and 18 similar saved recipes, as requested. `referenceRow` records each study's row in the five-row reference; `match` records `clear` or `similar`. `id`, `name`, `noise`, `gradient`, and `color` are copied from `data/presets.json` without changes. `preview` points to the original embedded PNG, extracted into `public/assets/echo-gradients/` for loading and WebGL fallback.

| Emotion | Reference rows | Upstream preset indices (zero-based) |
| --- | --- | --- |
| Sadness | 1–5 | 9, 6, 60, 7, 5 |
| Serenity | 1–5 | 61, 67, 11, 12, 27 |
| Happiness | 1–5 | 18, 73, 38, 3, 72 |
| Anger | 1–5 | 17, 58, 28, 0, 115 |
| Fear | 1–5 | 13, 52, 22, 16, 19 |
| Determination | 1–5 | 59, 10, 63, 71, 15 |

Happiness index 3 is the latest of two similar saved variants (3 and 4). Animated frames naturally change from the saved thumbnails. All five historical preset-file revisions were inspected; none provided further clear matches.

Similar matches prioritize the reference's composition, texture, palette, and movement without recoloring or inventing recipes. The largest differences are Sadness row 3 (monochrome radial curves instead of sag bands), Anger rows 1–2 (radial forms with multicolor/orange cores), Anger row 3 (darker red looping contours), and Determination row 5 (rising stripes in a warmer palette). The `clear` matches remain Sadness rows 1, 2, 4, 5; Serenity row 5; Happiness row 4; Anger rows 4, 5; Fear rows 4, 5; and Determination rows 1, 2.

The gallery is lazy loaded, compiles its shader when near the viewport, caps animation at 24 fps and resolution at one drawing pixel per CSS pixel, and pauses while offscreen or in a hidden tab. Reduced motion starts paused. Opening a study pauses the gallery and creates one enlarged renderer. Each surface falls back to its saved images if WebGL is unavailable or its context is lost, and restores rendering after context recovery.
