local addonName, addon = ...
local catalogs = {}
local legacyBorders = {}
local EMPTY_SNAPSHOT = table.freeze({})

local function IsStableIdentifier(value)
    return type(value) == "string" and value:match("^[%w_][%w_.:%-]*$") ~= nil
end

local function CopyData(value, copies, active)
    local valueType = type(value)
    if valueType == "string" or valueType == "number" or valueType == "boolean" then
        return value
    end
    if valueType ~= "table" then
        error("OrbitMedia catalog records may contain only data values", 4)
    end
    if getmetatable(value) ~= nil then
        error("OrbitMedia catalog records may not contain metatables", 4)
    end
    if active[value] then
        error("OrbitMedia catalog records may not contain cycles", 4)
    end
    if copies[value] then
        return copies[value]
    end

    local copy = {}
    copies[value] = copy
    active[value] = true
    for key, child in pairs(value) do
        local keyType = type(key)
        if keyType ~= "string" and keyType ~= "number" then
            error("OrbitMedia catalog record keys must be strings or numbers", 4)
        end
        copy[key] = CopyData(child, copies, active)
    end
    active[value] = nil
    return table.freeze(copy)
end

local function CopyRecord(record, provider)
    if type(record) ~= "table" or getmetatable(record) ~= nil then
        error("OrbitMedia catalog entries must be plain tables", 4)
    end
    if record.provider ~= nil then
        error("OrbitMedia catalog entries may not define provider", 4)
    end

    local copy = {}
    local copies = { [record] = copy }
    local active = { [record] = true }
    for key, value in pairs(record) do
        local keyType = type(key)
        if keyType ~= "string" and keyType ~= "number" then
            error("OrbitMedia catalog record keys must be strings or numbers", 4)
        end
        copy[key] = CopyData(value, copies, active)
    end
    active[record] = nil
    copy.provider = provider
    return table.freeze(copy)
end

local function GetEntryCount(entries)
    if type(entries) ~= "table" or getmetatable(entries) ~= nil then
        error("OrbitMedia catalog entries must be a plain array", 4)
    end

    local count = 0
    local present = 0
    for index in pairs(entries) do
        if type(index) ~= "number" or index < 1 or index % 1 ~= 0 then
            error("OrbitMedia catalog entries must be a plain array", 4)
        end
        count = math.max(count, index)
        present = present + 1
    end
    if count ~= present then
        error("OrbitMedia catalog entries must be contiguous", 4)
    end
    if count == 0 then
        error("OrbitMedia catalog registration requires at least one entry", 4)
    end
    return count
end

local function BuildSnapshot(catalog, pending)
    local snapshot = {}
    for _, entry in ipairs(catalog and catalog.snapshot or EMPTY_SNAPSHOT) do
        snapshot[#snapshot + 1] = entry
    end
    for _, entry in ipairs(pending) do
        snapshot[#snapshot + 1] = entry
    end
    table.sort(snapshot, function(left, right)
        local leftOrder = type(left.order) == "number" and left.order or math.huge
        local rightOrder = type(right.order) == "number" and right.order or math.huge
        if leftOrder ~= rightOrder then
            return leftOrder < rightOrder
        end
        if left.provider ~= right.provider then
            return left.provider < right.provider
        end
        return left.key < right.key
    end)
    return table.freeze(snapshot)
end

local function Register(_, mediaType, entries)
    if not IsStableIdentifier(mediaType) then
        error("OrbitMedia catalog type must be a stable non-empty identifier", 2)
    end

    local count = GetEntryCount(entries)
    local catalog = catalogs[mediaType]
    local registered = catalog and catalog.byKey or {}
    local pending = {}
    local pendingKeys = {}
    for index = 1, count do
        local entry = entries[index]
        if type(entry) ~= "table" then
            error("OrbitMedia catalog entries must be plain tables", 2)
        end
        if not IsStableIdentifier(entry.key) then
            error("OrbitMedia catalog entry keys must be stable non-empty identifiers", 2)
        end
        if registered[entry.key] or pendingKeys[entry.key] then
            error("OrbitMedia catalog entry key is already registered: " .. entry.key, 2)
        end
        if
            entry.order ~= nil
            and (
                type(entry.order) ~= "number"
                or entry.order ~= entry.order
                or entry.order <= -math.huge
                or entry.order >= math.huge
            )
        then
            error("OrbitMedia catalog entry order must be a finite number", 2)
        end
        pending[index] = CopyRecord(entry, addonName)
        pendingKeys[entry.key] = true
    end
    local snapshot = BuildSnapshot(catalog, pending)

    if not catalog then
        catalog = { byKey = {} }
        catalogs[mediaType] = catalog
    end
    for index = 1, count do
        local entry = pending[index]
        catalog.byKey[entry.key] = entry
    end
    catalog.snapshot = snapshot
end

local function Get(_, mediaType, key)
    local catalog = catalogs[mediaType]
    return catalog and catalog.byKey[key] or nil
end

local function Enumerate(_, mediaType)
    local catalog = catalogs[mediaType]
    return catalog and catalog.snapshot or EMPTY_SNAPSHOT
end

if type(addon) ~= "table" or not IsStableIdentifier(addonName) then
    error("OrbitMedia catalog requires its addon-private namespace", 2)
end

addon.Catalog = table.freeze({
    Register = Register,
})

OrbitMedia = table.freeze({
    apiVersion = 1,
    catalogApiVersion = 1,
    borders = legacyBorders,
    Get = Get,
    Enumerate = Enumerate,
})
