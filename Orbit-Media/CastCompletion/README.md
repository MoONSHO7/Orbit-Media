# Cast Completion Artwork

## Description
Four paired grayscale cast-success styles: Starlight, Arcane, Surge and Aurora.

## Purpose
Keep optional animation bytes outside Orbit while allowing a compatible cast-bar renderer to preserve its own geometry,
masks, tint, lifecycle and settings.

## Implementation
`../CastCompletion.lua` publishes immutable `cast-completion` descriptors. Each mode carries its frame paths, frame-start
times, hold duration and fade duration; no descriptor creates frames or runs animation code. Starlight has eight opaque
512 x 64 cast frames and twenty transparent 128 x 64 channel frames. Arcane, Surge and Aurora each have twenty 512 x 64
frames per mode. Cast frames contain the calm filled body; channel frames remain transparent outside the compact effect.

Starlight uses 80 ms cast steps and a 70 ms channel build followed by a 30 ms release. The alternative styles distribute
twenty frames evenly through 560 ms for casts or 890 ms for channels. Casts hold/fade from 560-760 ms; channels from
700-940 ms.

## Gotchas
- Keep loose files and full UVs. Sprite-sheet coordinates distort masks attached in texture UV space.
- Preserve opaque cast bodies and transparent channel endings; the final alternative channel frames are empty by design.
- Sequence order comes from the approved source sheets, not inferred emitter positions.
- New loose files require a full client restart before WoW can discover them; descriptor-only changes need a reload.

## References
Orbit `Core/Skinning/README.md` owns rendering and playback. Workspace `develop/cast-completion/README.md` documents
the authoring sources, builders and visual review evidence.
