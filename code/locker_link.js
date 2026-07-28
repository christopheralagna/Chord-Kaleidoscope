
// ============================================================
// lock_linker_ui.js
// Syncs lock_chords (lock_memory) ↔ lock_scale states
// Handles both dictionary updates and UI interlocks
// ============================================================

inlets = 2;
outlets = 2;
// outlet 0 → [lock_scale] toggle UI
// outlet 1 → [lock_chords] toggle UI

var globalSettings = new Dict("global_settings");
var prevLockScale = 0; // remembers user's original scale lock state

// ============================================================
// INIT
// ============================================================
function loadbang() {
    prevLockScale = globalSettings.get("lock_scale") || 0;
    post("[lock_linker_ui] Loaded | Initial lock_scale =", prevLockScale, "\n");
    syncUI();
}

// ============================================================
// HANDLE lock_chords TOGGLE (inlet 0)
// ============================================================
function msg_int(v) {
    if (inlet != 0) return; // only for lock_chords UI input

    var lockChords = v ? 1 : 0;
    var lockScale = globalSettings.get("lock_scale") || 0;

    globalSettings.set("lock_memory", lockChords);

    if (lockChords === 1) {
        // --- Chord lock ON ---
        prevLockScale = lockScale;
        if (lockScale === 0) {
            globalSettings.set("lock_scale", 1);
            outlet(0, 1); // force scale ON visually
        }
        post("[lock_linker_ui] lock_chords ON → forcing lock_scale ON\n");

        // Disable user interaction with scale UI
        var o = this.patcher.getnamed("lock_scale");
        if (o) {
            o.message("ignoreclick", 1);
            o.message("active", 0); // visually gray it out
        }

    } else {
        // --- Chord lock OFF ---
        globalSettings.set("lock_scale", prevLockScale);
        post("[lock_linker_ui] lock_chords OFF → restoring lock_scale =", prevLockScale, "\n");
        outlet(0, prevLockScale); // restore UI
        outlet(1, 0); // update chord UI

        // Re-enable scale UI interaction
        var o2 = this.patcher.getnamed("lock_scale");
        if (o2) {
            o2.message("ignoreclick", 0);
            o2.message("active", 1);
        }
    }

    // Update UI for chord toggle
    outlet(1, lockChords);
}

// ============================================================
// HANDLE DICTIONARY UPDATES (inlet 1 from [dict global_settings])
// ============================================================
function dictionary(d) {
    if (d.name !== "global_settings") return;
    syncUI();
}

// ============================================================
// SYNC UI WITH DICTIONARY
// ============================================================
function syncUI() {
    var lockMem = globalSettings.get("lock_memory") || 0;
    var lockScale = globalSettings.get("lock_scale") || 0;

    outlet(0, lockScale);
    outlet(1, lockMem);

    // Update scale button interactivity based on chord lock
    var o = this.patcher.getnamed("lock_scale");
    if (o) {
        if (lockMem === 1) {
            o.message("ignoreclick", 1);
            o.message("active", 0);
        } else {
            o.message("ignoreclick", 0);
            o.message("active", 1);
        }
    }

    post("[lock_linker_ui] Synced UI → lock_scale:", lockScale, "| lock_chords:", lockMem, "\n");
}


/*
// ============================================================
// lock_linker_ui.js
// Keeps lock_scale and lock_chords (lock_memory) synchronized
// with UI buttons and the global_settings Dict.
// ============================================================

inlets = 2;
outlets = 2;
// outlet 0 → send updates to [lock_scale] UI button
// outlet 1 → send updates to [lock_chords] UI button

// --- Dict reference ---
var globalSettings = new Dict("global_settings");

// --- Remember user’s original lock_scale state before chord lock was toggled ---
var prevLockScale = 0;

// --- Initialization ---
function loadbang() {
    prevLockScale = globalSettings.get("lock_scale") || 0;
    post("[lock_linker_ui] Loaded | Initial lock_scale =", prevLockScale, "\n");

    // Sync UI at load time
    syncUI();
}

// --- Called when lock_chords (UI) is toggled ---
function msg_int(v) {
    if (inlet != 0) return; // Only respond to first inlet for UI input
    var lockChords = v ? 1 : 0;
    var lockScale = globalSettings.get("lock_scale") || 0;

    globalSettings.set("lock_memory", lockChords);

    if (lockChords === 1) {
        prevLockScale = lockScale;
        if (lockScale === 0) {
            globalSettings.set("lock_scale", 1);
            post("[lock_linker_ui] lock_chords ON → forcing lock_scale ON\n");
            outlet(0, 1); // update UI for lock_scale
        } else {
            post("[lock_linker_ui] lock_chords ON → lock_scale already ON\n");
        }
    } else {
        globalSettings.set("lock_scale", prevLockScale);
        post("[lock_linker_ui] lock_chords OFF → restoring lock_scale =", prevLockScale, "\n");
        outlet(0, prevLockScale); // restore UI for lock_scale
    }

    // Reflect final states
    outlet(1, lockChords); // update UI for lock_chords (mirror)
}

// --- Called when the global_settings dict changes externally ---
function dictionary(d) {
    if (d.name !== "global_settings") return;
    syncUI();
}

// --- Helper: sync UI buttons to dictionary state ---
function syncUI() {
    var lockMem = globalSettings.get("lock_memory") || 0;
    var lockScale = globalSettings.get("lock_scale") || 0;

    outlet(0, lockScale);
    outlet(1, lockMem);
    post("[lock_linker_ui] Synced UI → lock_scale:", lockScale, "| lock_chords:", lockMem, "\n");
}
*/