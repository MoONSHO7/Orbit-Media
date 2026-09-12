# Media gallery

## Description
Static GitHub Pages gallery for Orbit: Media artwork and LibOrbitGlow's baseline dispel glows.

## Purpose
Preview the current registered artwork with consumer-style tint, corner, fill and frame-size controls.
The website is separate from the addon and from LibOrbitGlow's removed in-game demo.
Open directly on the category tabs. Keep labels factual and focus on artwork, controls and integration details.

## Implementation
`build.py` reads the actual Lua registrations in an isolated Lua 5.1 runtime and converts their TGA assets to lossless PNG.
`index.html`, `style.css` and `gallery.js` consume the resulting `catalog.json`; visible cards load their selected assets
and animate the native 30-frame loops. Icon size selects the closest registered rounded sheet for the 5/10/14-unit
border radii, including near-circular and circular outlines on small icons. The magnified preview uses LibOrbitGlow's
1.4 scale. Chamfered retains straight 12.5% cuts; radial designs reuse square. Dispels use registered contour geometry.
The browser preserves source alpha and multiplies source RGB by tint before BLEND/ADD composition.
Border previews read `Borders.lua` plus real SharedMedia registration: six original edge strips and both Chamfer Shadow
exports. The edge renderer follows Blizzard's `Backdrop.lua` UV guards, piece order, rotation and repeat coordinates;
the native Chamfer renderer uses the catalog's source margin and corner size. Resizing leaves corner sizes fixed.
The same build renders the current media, library and gallery READMEs into `dist/docs`, so website documentation travels
with the artwork snapshot. Cached PNGs are reused only while both source and export hashes match.

From the repository root, run `python -m pip install -r site/requirements.txt`, then `python site/build.py`.
The default library input is `../Orbit-Libs/LibOrbitGlow/LibOrbitGlow-1.0`; override it with `--library PATH`.
Serve `site/dist` with `python -m http.server 8766 --bind 127.0.0.1 --directory site/dist`.
`node site/check.cjs` runs the optional Playwright browser checks against that server (requires Playwright and a browser).
`python site/publish.py` reviews the generated file list; `--publish` creates and pushes a website-only commit to the existing
`gh-pages` branch. It checks the remote parent and uses Git objects directly, without touching the index or active checkout.
Never switch the live addon checkout or push `main` to deploy the site. `dist` includes `.nojekyll` and library attribution.

## Gotchas
- The gallery mirrors the local source inputs, including unreleased artwork. Rebuild before deployment; do not hand-edit PNGs
  or the generated catalog. The source hashes in `catalog.json` identify the exact inputs used.
- Orbit-Media supplies icon glows, status-bar fills and borders; LibOrbitGlow supplies dispel outlines. Fills are not glows.
- Border dimensions describe the full artwork box. Scale multiplies 16-unit edge corners or Chamfer's 12-unit corners;
  consumer padding and masks are intentionally absent. Native-slice sources and SharedMedia edge strips need distinct renderers.
- Browser previews approximate native WoW rendering. Consumers own masks, frame geometry and integration.
- Animation pauses offscreen and respects reduced-motion preferences. Search and controls apply to the selected category.
- The addon packager excludes this directory. The gallery does not alter or redistribute library runtime code.

## References
[Orbit-Media](../README.md), [LibOrbitGlow](https://github.com/MoONSHO7/Orbit-Libs/tree/LibOrbitGlow-1.8/LibOrbitGlow), [live gallery](https://moonsho7.github.io/Orbit-Media/).
