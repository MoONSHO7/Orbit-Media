local addonName = ...
local BASE = "Interface\\AddOns\\" .. addonName .. "\\StatusBars\\"
local TEXTURES = {
    { "Orbit Satin Valley", "orbit-003-satin-valley.tga" },
    { "Orbit Satin Horizon", "orbit-005-satin-horizon.tga" },
    { "Orbit Satin Cove", "orbit-008-satin-cove.tga" },
    { "Orbit Glass Ribbon", "orbit-012-glass-ribbon.tga" },
    { "Orbit Glass Oblique", "orbit-016-glass-oblique.tga" },
    { "Orbit Ceramic Saddle", "orbit-037-ceramic-saddle.tga" },
    { "Orbit Celestial Aurora Veil", "orbit-188-celestial-aurora-veil.tga" },
    { "Orbit Raised Crown", "orbit-201-raised-crown-soft.tga" },
    { "Orbit Raised High Crown", "orbit-206-raised-high-crown-studio.tga" },
    { "Orbit Raised Broad Crown", "orbit-211-raised-broad-crown-polished.tga" },
    { "Orbit Raised Low Crown", "orbit-216-raised-low-crown-sculpted.tga" },
    { "Orbit Raised Offset Crown", "orbit-217-raised-offset-crown-soft.tga" },
    { "Orbit Pillow Soft Shoulder", "orbit-221-pillow-soft-shoulder-soft.tga" },
    { "Orbit Pillow Square Shoulder", "orbit-227-pillow-square-shoulder-polished.tga" },
    { "Orbit Pillow Broad Pillow", "orbit-232-pillow-broad-pillow-sculpted.tga" },
    { "Orbit Pillow Low Pillow", "orbit-234-pillow-low-pillow-studio.tga" },
    { "Orbit Pillow Satin Pillow", "orbit-240-pillow-satin-pillow-sculpted.tga" },
    { "Orbit Bevel Fine Bevel", "orbit-244-bevel-fine-bevel-sculpted.tga" },
    { "Orbit Bevel Wide Bevel", "orbit-245-bevel-wide-bevel-soft.tga" },
    { "Orbit Bevel Upper Bevel", "orbit-252-bevel-upper-bevel-sculpted.tga" },
    { "Orbit Bevel Lower Bevel", "orbit-256-bevel-lower-bevel-sculpted.tga" },
    { "Orbit Bevel Double Bevel", "orbit-259-bevel-double-bevel-polished.tga" },
    { "Orbit Valley Shallow Valley", "orbit-261-valley-shallow-valley-soft.tga" },
    { "Orbit Valley Deep Valley", "orbit-267-valley-deep-valley-polished.tga" },
    { "Orbit Valley Upper Valley", "orbit-270-valley-upper-valley-studio.tga" },
    { "Orbit Valley Lower Valley", "orbit-275-valley-lower-valley-polished.tga" },
    { "Orbit Valley Wide Valley", "orbit-278-valley-wide-valley-studio.tga" },
    { "Orbit Horizon High Horizon", "orbit-283-horizon-high-horizon-polished.tga" },
    { "Orbit Horizon Mid Horizon", "orbit-286-horizon-mid-horizon-studio.tga" },
    { "Orbit Horizon Low Horizon", "orbit-292-horizon-low-horizon-sculpted.tga" },
    { "Orbit Horizon Soft Horizon", "orbit-294-horizon-soft-horizon-studio.tga" },
    { "Orbit Horizon Offset Horizon", "orbit-300-horizon-offset-horizon-sculpted.tga" },
    { "Orbit Cove Shallow Cove", "orbit-301-cove-shallow-cove-soft.tga" },
    { "Orbit Cove Deep Cove", "orbit-307-cove-deep-cove-polished.tga" },
    { "Orbit Cove Wide Cove", "orbit-312-cove-wide-cove-sculpted.tga" },
    { "Orbit Cove Upper Cove", "orbit-315-cove-upper-cove-polished.tga" },
    { "Orbit Cove Asymmetric Cove", "orbit-317-cove-asymmetric-cove-soft.tga" },
    { "Orbit Ribbon High Ribbon", "orbit-322-ribbon-high-ribbon-studio.tga" },
    { "Orbit Ribbon Upper Ribbon", "orbit-325-ribbon-upper-ribbon-soft.tga" },
    { "Orbit Ribbon Mid Ribbon", "orbit-330-ribbon-mid-ribbon-studio.tga" },
    { "Orbit Ribbon Low Ribbon", "orbit-334-ribbon-low-ribbon-studio.tga" },
    { "Orbit Ribbon Lower Ribbon", "orbit-337-ribbon-lower-ribbon-soft.tga" },
    { "Orbit Oblique Rising Light", "orbit-344-oblique-rising-light-sculpted.tga" },
    { "Orbit Oblique Falling Light", "orbit-347-oblique-falling-light-polished.tga" },
    { "Orbit Oblique Gentle Slant", "orbit-350-oblique-gentle-slant-studio.tga" },
    { "Orbit Oblique Steep Slant", "orbit-354-oblique-steep-slant-studio.tga" },
    { "Orbit Oblique Crossed Shoulder", "orbit-357-oblique-crossed-shoulder-soft.tga" },
    { "Orbit Saddle Shallow Saddle", "orbit-361-saddle-shallow-saddle-soft.tga" },
    { "Orbit Saddle Deep Saddle", "orbit-366-saddle-deep-saddle-studio.tga" },
    { "Orbit Saddle High Saddle", "orbit-372-saddle-high-saddle-sculpted.tga" },
    { "Orbit Saddle Low Saddle", "orbit-375-saddle-low-saddle-polished.tga" },
    { "Orbit Saddle Offset Saddle", "orbit-379-saddle-offset-saddle-polished.tga" },
    { "Orbit Lens Round Lens", "orbit-384-lens-round-lens-sculpted.tga" },
    { "Orbit Lens Flat Lens", "orbit-387-lens-flat-lens-polished.tga" },
    { "Orbit Lens Upper Lens", "orbit-389-lens-upper-lens-soft.tga" },
    { "Orbit Lens Lower Lens", "orbit-393-lens-lower-lens-soft.tga" },
    { "Orbit Lens Long Lens", "orbit-397-lens-long-lens-soft.tga" },
    { "Orbit Enamel Fine Glaze", "orbit-402-enamel-fine-glaze-studio.tga" },
    { "Orbit Enamel Broad Glaze", "orbit-408-enamel-broad-glaze-sculpted.tga" },
    { "Orbit Enamel Upper Glaze", "orbit-411-enamel-upper-glaze-polished.tga" },
    { "Orbit Enamel Low Glaze", "orbit-415-enamel-low-glaze-polished.tga" },
    { "Orbit Enamel Pearl Glaze", "orbit-420-enamel-pearl-glaze-sculpted.tga" },
    { "Orbit Twin Light Close Lights", "orbit-424-twin-light-close-lights-sculpted.tga" },
    { "Orbit Twin Light Wide Lights", "orbit-426-twin-light-wide-lights-studio.tga" },
    { "Orbit Twin Light Upper Lights", "orbit-432-twin-light-upper-lights-sculpted.tga" },
    { "Orbit Twin Light Lower Lights", "orbit-433-twin-light-lower-lights-soft.tga" },
    { "Orbit Twin Light Unequal Lights", "orbit-438-twin-light-unequal-lights-studio.tga" },
    { "Orbit Underlight Low Glow", "orbit-443-underlight-low-glow-polished.tga" },
    { "Orbit Underlight Wide Glow", "orbit-448-underlight-wide-glow-sculpted.tga" },
    { "Orbit Underlight Raised Glow", "orbit-449-underlight-raised-glow-soft.tga" },
    { "Orbit Underlight Sharp Glow", "orbit-456-underlight-sharp-glow-sculpted.tga" },
    { "Orbit Underlight Soft Glow", "orbit-458-underlight-soft-glow-studio.tga" },
    { "Orbit Edge Light Fine Rim", "orbit-464-edge-light-fine-rim-sculpted.tga" },
    { "Orbit Edge Light Wide Rim", "orbit-466-edge-light-wide-rim-studio.tga" },
    { "Orbit Edge Light Top Rim", "orbit-471-edge-light-top-rim-polished.tga" },
    { "Orbit Edge Light Bottom Rim", "orbit-474-edge-light-bottom-rim-studio.tga" },
    { "Orbit Edge Light Balanced Rim", "orbit-477-edge-light-balanced-rim-soft.tga" },
    { "Orbit Veil Quiet Veil", "orbit-483-veil-quiet-veil-polished.tga" },
    { "Orbit Veil Rising Veil", "orbit-485-veil-rising-veil-soft.tga" },
    { "Orbit Veil Falling Veil", "orbit-490-veil-falling-veil-studio.tga" },
    { "Orbit Veil Wide Veil", "orbit-495-veil-wide-veil-polished.tga" },
    { "Orbit Veil Layered Veil", "orbit-497-veil-layered-veil-soft.tga" },
}

local function Register()
    local media = LibStub and LibStub("LibSharedMedia-3.0", true)
    if not media then
        return false
    end
    for _, texture in ipairs(TEXTURES) do
        media:Register("statusbar", texture[1], BASE .. texture[2])
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
