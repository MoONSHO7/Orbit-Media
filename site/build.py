"""Build the static media gallery from the actual addon registrations."""
import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

import markdown
from lupa.lua51 import LuaRuntime
from PIL import Image

SITE = Path(__file__).resolve().parent
REPO = SITE.parent
FAMILIES = (
    "Raised", "Pillow", "Bevel", "Valley", "Horizon", "Cove", "Ribbon", "Oblique",
    "Saddle", "Lens", "Enamel", "Twin Light", "Underlight", "Edge Light", "Veil",
)
NAMES = {
    "arcs4": "Four Arcs", "comet2": "Twin Comets", "cometdual": "Dual Comet",
    "cometrays": "Comet Rays", "comettail": "Comet Tail", "cometwave": "Comet Wave",
    "dashwave": "Dash Wave", "halobreathe": "Halo Breathe", "orbittail": "Orbit Tail",
    "pinarc": "Pin Arc", "pinchase": "Pin Chase", "pincomet": "Pin Comet", "pinneon": "Pin Neon",
    "pinstrobe": "Pin Strobe", "pinswirl": "Pin Swirl", "pinwave": "Pin Wave",
    "polyexpand": "Polygon Expand", "pulsewave": "Pulse Wave", "raywave": "Ray Wave",
    "rimchase": "Rim Chase", "ripplepair": "Ripple Pair", "ripplewave": "Ripple Wave",
    "slowswirl": "Slow Swirl", "spiral2": "Double Spiral", "sweepfast": "Fast Sweep",
    "thinpulse": "Thin Pulse", "twincomet": "Twin Comet",
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def lua_library():
    lua = LuaRuntime(unpack_returned_tuples=True)
    lua.execute(r'''
        captured = {}
        table.freeze = function(value) return value end
        lib = {glows = {}}
        function lib:RegisterGlow(name, definition) self.glows[name] = definition end
        media = {}
        function media:Register(kind, name, path)
            captured[#captured + 1] = {kind = kind, name = name, path = path}
        end
        LibStub = function(name)
            if name == 'LibSharedMedia-3.0' then return media end
            return lib
        end
        function issecretvalue() return false end
        function debugstack() return 'Interface\\AddOns\\LibOrbitGlow-1.0\\StatusBarGlows.lua:1' end
    ''')
    return lua


def build(library, output):
    addon = REPO / "Orbit-Media"
    output.mkdir(parents=True, exist_ok=True)
    for name in ("index.html", "style.css", "gallery.js"):
        shutil.copyfile(SITE / name, output / name)
    (output / ".nojekyll").write_text("", encoding="utf-8")
    shutil.copyfile(addon / "Orbit.png", output / "orbit.png")
    shutil.copyfile(REPO / "LICENSE", output / "MEDIA-LICENSE.txt")
    shutil.copyfile(library.parent / "LICENSE", output / "LIBRARY-LICENSE.txt")
    previous_catalog = output / "catalog.json"
    previous_assets = json.loads(previous_catalog.read_text(encoding="utf-8"))["assets"] if previous_catalog.is_file() else {}
    inputs = {}
    assets = {}

    def read(path):
        inputs[path.name] = digest(path)
        return path.read_text(encoding="utf-8")

    def export(source, owner):
        relative = f"assets/{owner}/{source.stem}.png"
        if relative not in assets:
            destination = output / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            source_hash = digest(source)
            previous = previous_assets.get(relative, {})
            if (previous.get("sha256") == source_hash and destination.is_file()
                    and previous.get("pngSha256") == digest(destination)):
                assets[relative] = previous
                return relative
            with Image.open(source) as original:
                original.convert("RGBA").save(destination, optimize=True)
                assets[relative] = {"width": original.width, "height": original.height,
                                    "sha256": source_hash, "pngSha256": digest(destination)}
        return relative

    def source_path(game_path, directory, root):
        name = game_path.replace("\\", "/").split(directory + "/", 1)[1]
        path = root / directory / name
        if path.resolve().parent != (root / directory).resolve():
            raise ValueError(f"Unexpected asset path: {game_path}")
        return path

    lua = lua_library()
    lua.execute(read(addon / "Register.lua"), "Orbit-Media")
    icons = []
    for key, definition in sorted(lua.globals().lib.glows.items()):
        shapes = {}
        for shape in sorted(definition.shapes.keys()):
            layers = []
            for suffix in ("", "-core"):
                source = source_path(definition.resolve("loop", shape, suffix), "Textures", addon)
                layers.append(export(source, "icons"))
            shapes[shape] = layers
        icons.append({"id": key, "name": NAMES.get(key, key.title()), "source": "Orbit-Media",
                      "shapes": shapes, "rows": definition.rows, "cols": definition.cols,
                      "frames": definition.frames, "duration": 1})

    lua.execute(read(addon / "RegisterStatusBars.lua"), "Orbit-Media")
    fills = []
    for _, definition in lua.globals().captured.items():
        if definition.kind != "statusbar":
            continue
        source = source_path(definition.path, "StatusBars", addon)
        label = definition.name.removeprefix("Orbit ")
        original = int(re.match(r"orbit-(\d+)-", source.name)[1]) < 200
        family = "Original favorites" if original else next(f for f in FAMILIES if label.startswith(f + " "))
        fills.append({"id": source.stem, "name": label, "registeredName": definition.name,
                      "family": family, "source": "Orbit-Media", "image": export(source, "fills")})

    lua.execute(read(addon / "Borders.lua"), "Orbit-Media")
    lua.execute(read(addon / "RegisterBorders.lua"), "Orbit-Media")
    registered_borders = {entry.name: entry.path for _, entry in lua.globals().captured.items()
                          if entry.kind == "border"}
    borders = []
    for _, definition in sorted(lua.globals().OrbitMedia.borders.items()):
        registered_path = registered_borders[definition.label]
        border = {"id": definition.key, "name": definition.label.removeprefix("Orbit "),
                  "registeredName": definition.label, "source": "Orbit-Media", "kind": definition.kind,
                  "image": export(source_path(registered_path, "Borders", addon), "borders"),
                  "cornerSize": definition.cornerSize or 16}
        if definition.kind == "slice":
            border.update(nativeImage=export(source_path(definition.edgeFile, "Borders", addon), "borders"),
                          sliceMargin=definition.sliceMargin, sourceSize=definition.sourceSize,
                          outset=definition.outset)
        borders.append(border)

    engine = read(library / "LibOrbitGlow-1.0.lua")
    version = int(re.search(r'MINOR_VERSION\s*=\s*(\d+)', engine)[1])
    lua.globals().lib.minorVersion = version
    lua.execute(read(library / "StatusBarGlows.lua"))
    dispels = []
    for key, definition in sorted(lua.globals().lib.statusBarGlows.items()):
        variants = []
        for _, variant in sorted(definition.variants.items()):
            shapes = {}
            for shape, suffix in sorted(definition.shapes.items()):
                source = source_path(variant.path + suffix + definition.ext, "Textures", library)
                shapes[shape] = export(source, "dispels")
            variants.append({"ratio": variant.ratio, "shapes": shapes})
        contours = {name: dict(geometry.items()) for name, geometry in definition.contours.items()}
        dispels.append({"id": key, "name": definition.label, "source": "LibOrbitGlow", "variants": variants,
                        "contours": contours, "rows": definition.rows, "cols": definition.cols,
                        "frames": definition.frames, "duration": definition.duration,
                        "overhang": definition.overhang, "coreAlpha": definition.coreAlpha})

    catalog = {"icons": icons, "dispels": dispels, "fills": fills, "borders": borders, "assets": assets, "inputs": inputs}
    (output / "catalog.json").write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
    build_docs(library, output)
    print(f"Built {len(icons)} icon glows, {len(dispels)} dispel glows, {len(fills)} status-bar fills, {len(borders)} borders.")
    print(f"{len(assets)} lossless PNG assets, {sum(p.stat().st_size for p in output.rglob('*') if p.is_file()) / 1024**2:.2f} MiB.")
    print(output)


def build_docs(library, output):
    directory = output / "docs"
    directory.mkdir(exist_ok=True)
    for filename, source in (("media", REPO / "README.md"),
                             ("glows", library.parent / "README.md"), ("gallery", SITE / "README.md")):
        renderer = markdown.Markdown(extensions=["fenced_code", "tables", "toc"])
        content = renderer.convert(source.read_text(encoding="utf-8"))
        for old, new in (("site/README.md", "gallery.html"), ("../README.md", "media.html"),
                         ("LICENSE", "../LIBRARY-LICENSE.txt")):
            content = content.replace(f'href="{old}"', f'href="{new}"')
        title = {"media": "Orbit: Media", "glows": "LibOrbitGlow", "gallery": "Gallery development"}[filename]
        document = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} — Documentation</title><link rel="stylesheet" href="../style.css"><link rel="icon" href="../orbit.png"></head>
<body><header class="masthead wrap"><a class="brand" href="../"><img src="../orbit.png" alt="" width="32" height="32">
<span>ORBIT<span class="brand-sub"> / MEDIA</span></span></a><nav aria-label="Documentation"><a href="media.html">Media</a>
<a href="glows.html">Glow API</a><a class="download" href="../">Back to gallery ↗</a></nav></header>
<main class="documentation wrap"><details class="contents"><summary>On this page</summary>{renderer.toc}</details>
<article>{content}</article></main><footer class="wrap"><span>© MoONSHO7</span><a href="../">Orbit: Media gallery ↗</a></footer></body></html>'''
        (directory / f"{filename}.html").write_text(document + "\n", encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--library", type=Path, default=REPO.parent / "LibOrbitGlow/LibOrbitGlow-1.0")
    parser.add_argument("--output", type=Path, default=SITE / "dist")
    args = parser.parse_args()
    build(args.library.resolve(), args.output.resolve())
