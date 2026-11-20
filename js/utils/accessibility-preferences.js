(function () {
    const STORAGE_KEY = "littleLearners.accessibility";
    const SCHEMA_VERSION = 1;
    const DEFAULTS = Object.freeze({
        schemaVersion: SCHEMA_VERSION,
        textSize: "default",
        highContrast: false,
        reduceMotion: false
    });
    const TEXT_SIZES = ["default", "larger", "largest"];
    let preferences = Object.assign({}, DEFAULTS);

    function isValid(value) {
        return Boolean(value && typeof value === "object" && !Array.isArray(value) &&
            Object.keys(value).length === 4 &&
            value.schemaVersion === SCHEMA_VERSION && TEXT_SIZES.includes(value.textSize) &&
            typeof value.highContrast === "boolean" && typeof value.reduceMotion === "boolean");
    }

    function getStorage() {
        try {
            return window.localStorage;
        } catch (error) {
            return null;
        }
    }

    function apply(value) {
        const root = document.documentElement;
        root.dataset.textSize = value.textSize;
        root.dataset.highContrast = String(value.highContrast);
        root.dataset.reduceMotion = String(value.reduceMotion);
    }

    function load() {
        const storage = getStorage();
        if (!storage) return { preferences: Object.assign({}, DEFAULTS), status: "unavailable", writable: false };

        let raw;
        try {
            raw = storage.getItem(STORAGE_KEY);
        } catch (error) {
            return { preferences: Object.assign({}, DEFAULTS), status: "unavailable", writable: false };
        }

        if (raw === null) return { preferences: Object.assign({}, DEFAULTS), status: "missing", writable: true };

        let stored;
        try {
            stored = JSON.parse(raw);
        } catch (error) {
            return { preferences: Object.assign({}, DEFAULTS), status: "corrupt", writable: false };
        }
        if (!stored || typeof stored !== "object" || Array.isArray(stored) || !Number.isInteger(stored.schemaVersion)) {
            return { preferences: Object.assign({}, DEFAULTS), status: "invalid", writable: false };
        }
        if (stored.schemaVersion > SCHEMA_VERSION) {
            return { preferences: Object.assign({}, DEFAULTS), status: "unsupported-version", writable: false };
        }
        if (!isValid(stored)) return { preferences: Object.assign({}, DEFAULTS), status: "invalid", writable: false };
        return { preferences: Object.assign({}, stored), status: "ready", writable: true };
    }

    function save(value) {
        if (!isValid(value)) return { ok: false, status: "invalid-preferences" };
        const current = load();
        if (!current.writable) return { ok: false, status: current.status };
        const storage = getStorage();
        if (!storage) return { ok: false, status: "unavailable" };
        try {
            storage.setItem(STORAGE_KEY, JSON.stringify(value));
            return { ok: true, status: "saved", preferences: Object.assign({}, value) };
        } catch (error) {
            return { ok: false, status: "unavailable" };
        }
    }

    function update(changes) {
        const next = Object.assign({}, preferences, changes);
        if (!isValid(next)) return { ok: false, status: "invalid-preferences", preferences: get() };
        preferences = next;
        apply(preferences);
        const result = save(preferences);
        return { ok: result.ok, status: result.status, preferences: get() };
    }

    function get() {
        return Object.assign({}, preferences);
    }

    const initial = load();
    preferences = Object.assign({}, initial.preferences);
    apply(preferences);

    window.LittleLearnersAccessibilityPreferences = {
        key: STORAGE_KEY,
        schemaVersion: SCHEMA_VERSION,
        defaults: Object.assign({}, DEFAULTS),
        isValid: isValid,
        load: load,
        get: get,
        save: save,
        update: update,
        initialStatus: initial.status
    };
})();
