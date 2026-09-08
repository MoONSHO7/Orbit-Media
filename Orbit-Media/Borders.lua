local addonName = ...
local BASE = "Interface\\AddOns\\" .. addonName .. "\\Borders\\"
local borders = {
    table.freeze({
        key = "media:steel",
        label = "Orbit Steel",
        kind = "edge",
        alias = "lsm:Orbit Steel",
        edgeFile = BASE .. "orbit-edge-steel.tga",
    }),
    table.freeze({
        key = "media:notch",
        label = "Orbit Notch",
        kind = "edge",
        alias = "lsm:Orbit Notch",
        edgeFile = BASE .. "orbit-edge-notch.tga",
    }),
    table.freeze({
        key = "media:ornate",
        label = "Orbit Ornate",
        kind = "edge",
        alias = "lsm:Orbit Ornate",
        edgeFile = BASE .. "orbit-edge-ornate.tga",
    }),
    table.freeze({
        key = "media:glow",
        label = "Orbit Glow",
        kind = "edge",
        alias = "lsm:Orbit Glow",
        edgeFile = BASE .. "orbit-edge-glow.tga",
    }),
    table.freeze({
        key = "media:bolt",
        label = "Orbit Bolt",
        kind = "edge",
        alias = "lsm:Orbit Bolt",
        edgeFile = BASE .. "orbit-edge-bolt.tga",
    }),
    table.freeze({
        key = "media:cross",
        label = "Orbit Cross",
        kind = "edge",
        alias = "lsm:Orbit Cross",
        edgeFile = BASE .. "orbit-edge-cross.tga",
    }),
    table.freeze({
        key = "media:chamfer-shadow",
        label = "Orbit Chamfer Shadow",
        kind = "slice",
        alias = "lsm:Orbit Chamfer Shadow",
        shape = "soft",
        sliceMargin = 96,
        sourceSize = 512,
        cornerSize = 12,
        outset = 4,
        edgeFile = BASE .. "orbit-chamfer-shadow.tga",
        lsmFile = BASE .. "orbit-edge-chamfer-shadow.tga",
    }),
}

OrbitMedia = table.freeze({ apiVersion = 1, borders = table.freeze(borders) })
