# Orbit: Media

## Description
SharedMedia textures, HUD artwork, cast-completion sequences and animated LibOrbitGlow textures. Orbit is not required.
Previously Orbit-Glow-Pack; the CurseForge project ID and all glow keys are unchanged.

## Purpose
Supply optional artwork to compatible addons without a rendering engine or Orbit dependency. Orbit retains Pixel, Soft, Softer, Round, Chamfer and their masks without this pack.

Install the pack and select its artwork in a compatible addon's glow, status-bar, border, HUD or cast settings.
[Browse the interactive gallery](https://moonsho7.github.io/Orbit-Media/) for the glow, status-bar and border collection.
The pack has 40 icon glows, 102 status-bar fills and seven resizable borders; LibOrbitGlow owns two baseline dispel outlines.

## Implementation
`Catalog.lua` publishes the read-only `OrbitMedia.catalogApiVersion = 1` API with data-only `Get` and `Enumerate`
methods. It freezes copied records, rejects duplicate keys/cycles and builds deterministic snapshots during registration.
Consumer reads are immutable and allocation-free; consumers own rendering, masks, placement, lifecycle and settings.
Legacy `apiVersion = 1` and the frozen `borders` array remain unchanged.

Pack files register through Orbit-Media's private addon namespace during file load, before consumers snapshot a catalog.
Keys are unique within each media type and remain the saved-setting identity. `Get(mediaType, key)` returns one frozen
record; `Enumerate(mediaType)` returns a cached frozen array ordered by `order`, provider and key. HUD records carry
`leftPath`, `rightPath`, `aspectRatio` and `randomEligible`; cast records carry CAST/CHANNEL `frames`, `frameStarts`,
`holdDuration` and `fadeDuration`. Labels expose
an optional consumer localization key plus a plain fallback.

`Borders.lua` registers the seven border records in the general catalog and populates the legacy border array.
`RegisterBorders.lua` registers seven names through LibSharedMedia-3.0. It registers immediately when available;
otherwise an ADDON_LOADED listener waits for a consumer to load SharedMedia and registers once. No Orbit API is called.

`HUDArtwork.lua` registers 14 paired `hud-artwork` records. Thrall, Kael'thas and Gul'dan preserve their reversed filename mapping; consumers own slots and selection.

`CastCompletion.lua` registers four styles and 148 loose full-UV TGAs so consumers can retain stable masks while owning playback and presentation.

`RegisterStatusBars.lua` registers 102 grayscale 256x64 fills with the same SharedMedia pattern. Fifteen styles keep
five types with one selected finish per type; seven favourites remain. Published names omit review IDs and finishes.
`output/orbit-status-textures/orbit-media-selection.json` fixes the 75 choices. Twenty `Orbit Rustic ...` fills recreate
the unit-frame materials; sources live in `output/unit-frame-status-textures-20260922/`. Consumers own tint and masks.

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

`.pkgmeta` packages the inner addon under CurseForge project 1586459 with runtime Lua, the TOC, icon, eight border, 728
glow, 102 status-bar, 28 HUD and 148 cast TGAs. Authoring stays in `output/`; `site/` is excluded
from the addon.

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
- Old lsm:Orbit names and media: aliases remain supported in Orbit without rewriting saved choices.
- Original borders are unmasked; switching from Chamfer Shadow must clear the previous Soft mask.
- LSM stores a path, not preset geometry or masks. Chamfer's edge export reproduces its native proportions with
  edge size 12 and a 4-unit outward anchor; a consuming addon may expose different padding conventions.
- All rejected experimental designs and Silver/Bold/Forged/Groove remain removed.
- The pack has no mask assets and no references into Orbit's addon directory.

## References
[Repository](https://github.com/MoONSHO7/Orbit-Media), [Orbit](https://github.com/MoONSHO7/Orbit),
[LibOrbitGlow](https://github.com/MoONSHO7/Orbit-Libs/tree/LibOrbitGlow-1.8/LibOrbitGlow), [gallery](site/README.md).
Workspace `output/orbit-borders/media-release/verify_shared.py` checks the real SharedMedia libraries with Orbit absent.
Workspace `output/orbit-status-textures/qa/media-check.py` verifies every status-bar file, both artwork catalogs and real
SharedMedia registration.
