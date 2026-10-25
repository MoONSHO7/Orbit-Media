# Orbit: Media

## Description
SharedMedia textures, HUD artwork, cast-completion sequences and animated LibOrbitGlow textures. Orbit is not required.
Previously Orbit-Glow-Pack; the CurseForge project ID and all glow keys are unchanged.

## Purpose
Supply optional artwork to compatible addons without a rendering engine or Orbit dependency. Orbit retains Pixel, Soft, Softer, Round, Chamfer, Notch, Blade and their masks without this pack.

Install the pack and select its artwork in a compatible addon's glow, status-bar, HUD or cast settings.
[Browse the interactive gallery](https://moonsho7.github.io/Orbit-Media/) for the glow and status-bar collection.
The pack has 40 icon glows and 102 status-bar fills; LibOrbitGlow owns two baseline dispel outlines.

## Implementation
`Catalog.lua` publishes the read-only `OrbitMedia.catalogApiVersion = 1` API with data-only `Get` and `Enumerate`
methods. It freezes copied records, rejects duplicate keys/cycles and builds deterministic snapshots during registration.
Consumer reads are immutable and allocation-free; consumers own rendering, masks, placement, lifecycle and settings.
Legacy `apiVersion = 1` remains; `borders` is a frozen empty array so older consumers can enumerate it safely.

Pack files register through Orbit-Media's private addon namespace during file load, before consumers snapshot a catalog.
Keys are unique within each media type and remain the saved-setting identity. `Get(mediaType, key)` returns one frozen
record; `Enumerate(mediaType)` returns a cached frozen array ordered by `order`, provider and key. HUD records carry
`leftPath`, `rightPath`, `aspectRatio` and `randomEligible`; cast records carry CAST/CHANNEL `frames`, `frameStarts`,
`holdDuration` and `fadeDuration`. Labels expose
an optional consumer localization key plus a plain fallback.

`HUDArtwork.lua` registers 15 paired `hud-artwork` records. Thrall, Kael'thas and Gul'dan preserve their reversed filename mapping; consumers own slots and selection.

`CastCompletion.lua` registers four styles and 148 loose full-UV TGAs so consumers can retain stable masks while owning playback and presentation.

`RegisterStatusBars.lua` registers 102 grayscale 256x64 fills with the same SharedMedia pattern. Fifteen styles keep
five types with one selected finish per type; seven favourites remain. Published names omit review IDs and finishes.
`output/orbit-status-textures/orbit-media-selection.json` fixes the 75 choices. Twenty `Orbit Rustic ...` fills recreate
the unit-frame materials; sources live in `output/unit-frame-status-textures-20260922/`. Consumers own tint and masks.

`Register.lua` independently registers all 40 glow names immediately if LibOrbitGlow exists, or waits for
ADDON_LOADED in the same way. Existing glow textures and registry names remain unchanged.
Their BLEND body and ADD core share a 5-column, 6-row, 30-frame atlas with 128px cells and straight alpha.
36 perimeter designs supply square/soft/softer/round/chamfer/notch/blade; four radial designs supply square only.
Rounded outlines also ship soft-small, soft-large, softer-large, round-large and round-full at
6.25%, 18.75%, 30%, 43.75% and 50% radii. Consumers choose the nearest available contour for the icon size;
the last two keep small Round icons curved through the corners instead of using the 40-unit reference bake.
Chamfer follows straight 45-degree cuts at 5/40 of the icon side, retaining each design's timing and layers. Notch
cuts concave quarter circles of 5/40 into every corner; Blade cuts only the top-left and bottom-right at 7/40.
Workspace `.scripts/make-glow-pack.py` and `make-fine-edge-flipbooks.py` share `glow_chamfer.py` and `glow_corners.py`
geometry; `glow_rounded.py` owns their radius ladder. `GLOW_SHAPES` and `--glows-only --shapes` restrict regeneration.

`.pkgmeta` packages the inner addon under CurseForge project 1586459 with runtime Lua, the TOC, icon, 872
glow, 102 status-bar, 30 HUD and 148 cast TGAs. Authoring stays in `output/`; `site/` is excluded
from the addon. Its manual Markdown changelog is the full repository `CHANGELOG.md`, used for CurseForge's file
changelog and GitHub's release body.

## Gotchas
- Enable Orbit-Media and remove the obsolete Orbit-Glow-Pack installation when updating manually.
- Neither library is bundled or required as a hard dependency; compatible consumers supply the library they use.
- Catalog records are immutable data. The registration door is addon-private; consumers cannot inject render callbacks
  or mutate another consumer's UI.
- Pack files must register before a consumer snapshots the catalog; there is no runtime UI invalidation. Snapshot
  construction stays in the private registration path because `Enumerate` runs in the consumer and must be read-only.
- Status-bar fills are opaque grayscale and accept runtime tint; the consumer owns masks, borders and fill amount.
- Restart WoW fully after adding new loose textures; name changes only require a reload. Previously selected
  numbered or finish-labelled status-bar names must be reselected under their new names in the consuming addon.
- Disable the separate Orbit-StatusTextures preview addon if installed to avoid its old numbered entries.
- The old SharedMedia border collection is removed, including its catalog records, textures and gallery. Consumers
  that saved those media names must choose another border; Orbit's built-in Soft/Softer/Round/Chamfer/Notch/Blade remain.
- The pack has no mask assets and no references into Orbit's addon directory.

## References
[Repository](https://github.com/MoONSHO7/Orbit-Media), [Orbit](https://github.com/MoONSHO7/Orbit),
[LibOrbitGlow](https://github.com/MoONSHO7/Orbit-Libs/tree/LibOrbitGlow-1.8/LibOrbitGlow), [gallery](site/README.md).
Workspace `output/orbit-status-textures/qa/media-check.py` verifies every status-bar file, both artwork catalogs and real
SharedMedia registration.
