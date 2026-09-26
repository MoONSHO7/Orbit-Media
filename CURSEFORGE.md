# Orbit: Media

Optional artwork for World of Warcraft addons: **40 animated icon glows, 102 status-bar textures, seven border styles,
14 paired HUD ornaments and four cast-completion styles**. Orbit is optional. Library-backed
consumers supply LibOrbitGlow or LibSharedMedia; catalog-aware consumers read the immutable artwork descriptors directly.

**[Browse the interactive gallery](https://moonsho7.github.io/Orbit-Media/)** to try the glow, status-bar and border
collection with colors, corners, animation speeds and fill levels.

## What's included

- **Icon glows:** 40 looping designs, including Tracer, Pin Neon, Halo, Comet and radial effects. Perimeter designs include
  Square, Soft, Softer, Round and Chamfered variants. The four radial designs work with every corner style.
- **Status-bar artwork:** 102 grayscale fills across 15 collections and seven original favorites. Tint them to match your UI;
  your addon controls the fill amount, border and mask.
- **Borders:** Orbit Steel, Notch, Ornate, Glow, Bolt, Cross and Chamfer Shadow, registered through LibSharedMedia.
- **HUD artwork:** 14 Warcraft character ornaments with paired left/right textures and stable catalog keys.
- **Cast completion:** Starlight, Arcane, Surge and Aurora cast/channel sequences with provider-owned timing descriptors.

The gallery also previews **Tracer and Pin Neon dispel outlines from LibOrbitGlow**. Those rectangular effects are included
with the library itself and are separate from this pack's icon glows and status-bar fills.

## Using the pack

Install Orbit: Media, enable a compatible addon, and choose the artwork in that addon's media or glow settings.
The pack registers library-backed artwork when those libraries become available and exposes HUD/cast records through
`OrbitMedia.catalogApiVersion = 1`; it does not bundle a rendering engine.

Previously **Orbit-Glow-Pack**. Existing glow keys are preserved. When updating manually, remove the old Orbit-Glow-Pack
folder and enable Orbit-Media. Previously numbered status-bar preview entries use clean names in this pack and may need
to be reselected. Disable the separate Orbit-StatusTextures preview addon if installed.

Retail 12.1 and Forever 1.60.1. Media copyright MoONSHO7; redistribution requires permission.

**[Documentation and integration details](https://github.com/MoONSHO7/Orbit-Media#readme)** ·
**[LibOrbitGlow API](https://github.com/MoONSHO7/Orbit-Libs/tree/LibOrbitGlow-1.8/LibOrbitGlow#readme)**
