# HUD Artwork

## Description
Sculpted satin-pewter Warcraft character ornaments published through Orbit-Media's optional artwork catalog.

## Purpose
Keep large decorative assets outside Orbit while allowing compatible HUD hosts to offer stable left/right choices.

## Implementation
`../HUDArtwork.lua` publishes one immutable `hud-artwork` record per character. Each record owns its stable key,
localized Orbit label key, aspect ratio, random-selection eligibility and both external-addon paths. Consumers own frame
creation, placement, scaling, masks, menus and saved settings; the provider never creates or mutates their UI.

The twenty-eight uncompressed 1024-square RGBA TGAs cover Xal'atath, Arator, Sylvanas, Arthas as the Lich King,
Thrall, Jaina, Illidan, Kael'thas, Gul'dan, Alexstrasza and the cinematic Night Elf, Dwarf Hunter, Forsaken Warlock and
Tauren. Their 1254-square masters fit proportionally inside a 16px export margin with straight alpha and edge bleed.
Each left-facing texture is an exact horizontal mirror of its right-facing counterpart.

## Gotchas
- Catalog keys describe visible facing. Thrall, Kael'thas and Gul'dan retain historical filename suffixes reversed from
  that facing, so their descriptor paths deliberately cross left and right.
- Preserve the approved pixels and transparent RGB bleed. Black RGB behind transparent pixels can create filtered seams.
- Texture dimensions do not establish character scale; composition and head/torso prominence must stay matched.
- Tyrande remains retired. Saved keys not present in the catalog are consumer-owned and should remain dormant.
- New loose files require a full client restart before WoW can discover them; catalog-only changes need a reload.

## References
Orbit `Plugins/Datatexts/README.md` owns the HUD placement and settings contract. Authoring sources and review proofs:

- `output/midnight-actionbar-ornaments-20260912/`
- `output/warcraft-hud-characters-20260912/`
- `output/hud-artwork-rebuild-20260912/`
- `output/illidan-restart-20260913/`
- `output/hud-character-review-20260914/`
- `output/vanilla-cinematic-hud-20260919/`
- `output/hud-main-characters-20260923/`
- `output/jaina-hud-lighting-20260923/`
- `output/hud-sculpted-set-20260923/`
