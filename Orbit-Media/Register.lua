local addonName = ...
local BASE = "Interface\\AddOns\\" .. addonName .. "\\Textures\\orbit-glow-"

local function Resolver(name)
    return function(phase, shape, suffix)
        if phase ~= "loop" then
            return nil
        end
        return BASE .. name .. "-loop-" .. shape .. suffix .. ".tga"
    end
end

-- Radial emanation designs have no border ring, so one square bake fits every corner style
-- and the library's shape fallback keeps them on -square.
local SQUARE_ONLY = { embers = true, polyexpand = true, reticle = true, ripplewave = true }
local ALL_SHAPES = {
    square = true,
    ["soft-small"] = true,
    soft = true,
    ["soft-large"] = true,
    softer = true,
    ["softer-large"] = true,
    round = true,
    ["round-large"] = true,
    ["round-full"] = true,
    chamfer = true,
}
local SQUARE = { square = true }

local GLOWS = {
    "arcs4",
    "beacon",
    "chase",
    "comet2",
    "cometdual",
    "cometrays",
    "comettail",
    "cometwave",
    "dashwave",
    "dual",
    "embers",
    "halo",
    "halobreathe",
    "neon",
    "orbittail",
    "pinarc",
    "pinchase",
    "pincomet",
    "pinneon",
    "pinstrobe",
    "pinswirl",
    "pinwave",
    "polyexpand",
    "pulse",
    "pulsewave",
    "radar",
    "raywave",
    "reticle",
    "rimchase",
    "ripplepair",
    "ripplewave",
    "slowswirl",
    "spin",
    "spiral2",
    "strobe",
    "sweepfast",
    "swirl",
    "thinpulse",
    "tracer",
    "twincomet",
}

local function Register()
    local LCG = LibStub and LibStub("LibOrbitGlow-1.0", true)
    if not (LCG and LCG.RegisterGlow) then
        return false
    end
    for _, name in ipairs(GLOWS) do
        LCG:RegisterGlow(name, {
            layered = true,
            loopOnly = true,
            resolve = Resolver(name),
            rows = 6,
            cols = 5,
            frames = 30,
            shapes = SQUARE_ONLY[name] and SQUARE or ALL_SHAPES,
            source = "Orbit-Media",
        })
    end
    return true
end

if not Register() then
    local loader = CreateFrame("Frame")
    loader:RegisterEvent("ADDON_LOADED")
    loader:SetScript("OnEvent", function(self)
        if Register() then
            self:UnregisterEvent("ADDON_LOADED")
            self:SetScript("OnEvent", nil)
        end
    end)
end
