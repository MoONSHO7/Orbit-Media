local addonName, addon = ...
local Catalog = addon.Catalog
local BASE = "Interface\\AddOns\\" .. addonName .. "\\CastCompletion\\"
local FRAME_COUNT = 20
local CAST_HOLD_DURATION = 0.56
local CAST_FADE_DURATION = 0.2
local CHANNEL_HOLD_DURATION = 0.7
local CHANNEL_FADE_DURATION = 0.24
local STARLIGHT_CAST_STARTS = { 0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56 }
local STARLIGHT_CHANNEL_STARTS = {
    0,
    0.07,
    0.14,
    0.21,
    0.28,
    0.35,
    0.42,
    0.49,
    0.56,
    0.59,
    0.62,
    0.65,
    0.68,
    0.71,
    0.74,
    0.77,
    0.8,
    0.83,
    0.86,
    0.89,
}

local function BuildFrames(folder, prefix, count)
    local frames = {}
    for index = 1, count do
        frames[index] = BASE .. folder .. "\\" .. string.format("%s-%02d.tga", prefix, index)
    end
    return frames
end

local function BuildEvenStarts(finish)
    local starts = {}
    for index = 1, FRAME_COUNT do
        starts[index] = (index - 1) * finish / (FRAME_COUNT - 1)
    end
    return starts
end

local function BuildStyle(key, labelKey, label, order, folder, castStarts, channelStarts)
    return {
        key = key,
        labelKey = labelKey,
        label = label,
        order = order,
        modes = {
            CAST = {
                frames = BuildFrames(folder, "cast", #castStarts),
                frameStarts = castStarts,
                holdDuration = CAST_HOLD_DURATION,
                fadeDuration = CAST_FADE_DURATION,
            },
            CHANNEL = {
                frames = BuildFrames(folder, "channel", #channelStarts),
                frameStarts = channelStarts,
                holdDuration = CHANNEL_HOLD_DURATION,
                fadeDuration = CHANNEL_FADE_DURATION,
            },
        },
    }
end

local castStarts = BuildEvenStarts(STARLIGHT_CAST_STARTS[#STARLIGHT_CAST_STARTS])
local channelStarts = BuildEvenStarts(STARLIGHT_CHANNEL_STARTS[#STARLIGHT_CHANNEL_STARTS])
Catalog:Register("cast-completion", {
    BuildStyle(
        "starlight",
        "PLU_CAST_STYLE_STARLIGHT",
        "Starlight",
        1,
        "Starlight",
        STARLIGHT_CAST_STARTS,
        STARLIGHT_CHANNEL_STARTS
    ),
    BuildStyle("arcane", "PLU_CAST_STYLE_ARCANE", "Arcane", 2, "Arcane", castStarts, channelStarts),
    BuildStyle("surge", "PLU_CAST_STYLE_SURGE", "Surge", 3, "Surge", castStarts, channelStarts),
    BuildStyle("aurora", "PLU_CAST_STYLE_AURORA", "Aurora", 4, "Aurora", castStarts, channelStarts),
})
