# Orbit: Media

## Description
SharedMedia status-bar textures, borders and animated LibOrbitGlow textures. Orbit is not required.
Previously Orbit-Glow-Pack; the CurseForge project ID and all glow keys are unchanged.

## Purpose
Supply optional artwork to any compatible addon without bundling a rendering engine or requiring Orbit.
Orbit retains Pixel, Soft, Softer, Round, Chamfer and their masks without this pack.

Install the pack and select its artwork in a compatible addon's glow, status-bar or border settings.
[Browse the interactive gallery](https://moonsho7.github.io/Orbit-Media/) for all 40 icon glows, 82 status-bar fills and
seven resizable nine-slice borders, plus LibOrbitGlow's two baseline dispel outlines. The dispel assets belong to LibOrbitGlow.

## Implementation
`Borders.lua` publishes the frozen `OrbitMedia` border catalog before registration runs.
`RegisterBorders.lua` registers seven names through LibSharedMedia-3.0: Orbit Steel, Notch, Ornate, Glow,
Bolt, Cross and Chamfer Shadow. It registers immediately when the library exists; otherwise an ADDON_LOADED
listener waits for any consumer to load SharedMedia, registers once and removes itself. No Orbit API is called.

`RegisterStatusBars.lua` registers 82 grayscale 256x64 status-bar fills from `StatusBars/` with the
same immediate/deferred SharedMedia pattern. Each of 15 styles keeps all five types, with one randomly
selected finish per type; seven original favourites also remain. In-game names omit review IDs and
finish labels, such as `Orbit Satin Valley` and `Orbit Raised Crown`; filenames retain their provenance.
Workspace `output/orbit-status-textures/orbit-media-selection.json` fixes the 75 choices for future
imports. Full authoring studies remain there; only the 82 selected TGA exports ship.

Six original edge files remain byte-for-byte unchanged. Chamfer Shadow ships a 1024x128 standard Backdrop
edge-file export for LSM and the approved 512x512 texture for integrations that read the optional catalog.
The latter declares source margin 96, destination corner size 12 and visual outset 4. Orbit instead bundles a
32px native-slice Chamfer adaptation with matched masks; old pack selections map to that built-in without a duplicate row.
Other addons continue using this standalone export and own their mask, edge size and offsets.
The two layouts are not interchangeable: a square texture-slice asset cannot be used as a Backdrop edge file.

`Register.lua` independently registers all 40 glow names immediately if LibOrbitGlow exists, or waits for
ADDON_LOADED in the same way. Existing glow textures and registry names remain unchanged.
Their BLEND body and ADD core share a 5-column, 6-row, 30-frame atlas with 128px cells and straight alpha.
36 perimeter designs supply square/soft/softer/round/chamfer; four radial designs supply square only.
Rounded outlines also ship soft-small, soft-large, softer-large, round-large and round-full at
6.25%, 18.75%, 30%, 43.75% and 50% radii. Consumers choose the nearest available contour for the icon size;
the last two keep small Round icons curved through the corners instead of using the 40-unit reference bake.
Chamfer follows straight 45-degree cuts at 5/40 of the icon side, retaining each design's timing and layers.
Workspace `.scripts/make-glow-pack.py` and `make-fine-edge-flipbooks.py` share `glow_chamfer.py` geometry;
`glow_rounded.py` owns their radius ladder. `GLOW_SHAPES` and `--glows-only --shapes` restrict regeneration.

`.pkgmeta` packages the inner addon as Orbit-Media. CurseForge project ID 1586459 remains attached to releases.
Only runtime Lua, the TOC, icon, eight border TGAs, 728 glow TGAs and 82 status-bar TGAs ship.
Border authoring scripts, selections and proof galleries remain in workspace `output/orbit-borders/`.
`site/` owns the separate GitHub Pages gallery. Its builder reads the current Lua registrations and exports browser PNGs
from this pack and the sibling LibOrbitGlow checkout; website files are excluded from the addon package.

## Gotchas
- Enable Orbit-Media and remove the obsolete Orbit-Glow-Pack installation when updating manually.
- Neither library is bundled or required as a hard dependency; compatible consumers supply the library they use.
- Status-bar fills are opaque grayscale and accept runtime tint; the consumer owns masks, borders and fill amount.
- Restart WoW fully after adding new loose textures; name changes only require a reload. Previously selected
  numbered or finish-labelled status-bar names must be reselected under their new names in the consuming addon.
- Disable the separate Orbit-StatusTextures preview addon if installed to avoid its old numbered entries.
- Old lsm:Orbit names and media: aliases remain supported in Orbit without rewriting saved choices.
- Original borders are unmasked; switching from Chamfer Shadow must clear the previous Soft mask.
- LSM stores a path, not preset geometry or masks. Chamfer's edge export reproduces its native proportions with
  edge size 12 and a 4-unit outward anchor; a consuming addon may expose different padding conventions.
- All rejected experimental designs and Silver/Bold/Forged/Groove remain removed.
- The pack has no mask assets and no references into Orbit's addon directory.

## References
[Repository](https://github.com/MoONSHO7/Orbit-Media), [Orbit](https://github.com/MoONSHO7/Orbit),
[LibOrbitGlow](https://github.com/MoONSHO7/LibOrbitGlow), [gallery build and deployment](site/README.md).
Workspace `output/orbit-borders/media-release/verify_shared.py` checks the real SharedMedia libraries with Orbit absent.
Workspace `output/orbit-status-textures/qa/media-check.py` verifies every status-bar file and real SharedMedia registration.
