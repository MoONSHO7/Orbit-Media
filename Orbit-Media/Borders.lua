local addonName, addon = ...
local Catalog = addon.Catalog
local BASE = "Interface\\AddOns\\" .. addonName .. "\\Borders\\"
local borders = {
    {
        key = "media:steel",
        label = "Orbit Steel",
        kind = "edge",
        alias = "lsm:Orbit Steel",
        edgeFile = BASE .. "orbit-edge-steel.tga",
    },
    {
        key = "media:notch",
        label = "Orbit Notch",
        kind = "edge",
        alias = "lsm:Orbit Notch",
        edgeFile = BASE .. "orbit-edge-notch.tga",
    },
    {
        key = "media:ornate",
        label = "Orbit Ornate",
        kind = "edge",
        alias = "lsm:Orbit Ornate",
        edgeFile = BASE .. "orbit-edge-ornate.tga",
    },
    {
        key = "media:glow",
        label = "Orbit Glow",
        kind = "edge",
        alias = "lsm:Orbit Glow",
        edgeFile = BASE .. "orbit-edge-glow.tga",
    },
    {
        key = "media:bolt",
        label = "Orbit Bolt",
        kind = "edge",
        alias = "lsm:Orbit Bolt",
        edgeFile = BASE .. "orbit-edge-bolt.tga",
    },
    {
        key = "media:cross",
        label = "Orbit Cross",
        kind = "edge",
        alias = "lsm:Orbit Cross",
        edgeFile = BASE .. "orbit-edge-cross.tga",
    },
    {
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
    },
}

Catalog:Register("border", borders)
for index, border in ipairs(borders) do
    OrbitMedia.borders[index] = OrbitMedia:Get("border", border.key)
end
table.freeze(OrbitMedia.borders)
