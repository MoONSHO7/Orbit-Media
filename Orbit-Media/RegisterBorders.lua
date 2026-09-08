local function Register()
    local media = LibStub and LibStub("LibSharedMedia-3.0", true)
    if not media then
        return false
    end
    for _, border in ipairs(OrbitMedia.borders) do
        media:Register("border", border.label, border.lsmFile or border.edgeFile)
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
