
// ============================================================
// chord_memory.js — data management + UI update
// ============================================================
// inlets:
//  0 = new chords from generator
//  1 = lock toggle (0/1)
//  2 = chord selection (1–5)
//  3 = add_spread toggle (0/1)
//
// outlets:
//  0 = bang + data for UI/read_chord_memory.js
// ============================================================

inlets = 4;
outlets = 1;

var chordMemory = new Dict("chord_memory");
var globalSettings = new Dict("global_settings");

var maxChords = 5;

// --- Save incoming chords when unlocked ---
function list() {
    if (inlet !== 0) return;

    var locked = globalSettings.get("lock_memory") === 1;
    if (locked) {
        return;
    }

    var chord = arrayfromargs(arguments);
    if (!chord || chord.length === 0) return;

    // Shift older chords down
    for (var i = maxChords; i > 1; i--) {
        var prev = chordMemory.get("chord" + (i - 1));
        if (prev) chordMemory.set("chord" + i, prev);
    }
    chordMemory.set("chord1", chord);

    // Notify UI/read_chord_memory.js of update
    outlet(0, ["update", "chord_memory"]);
}

// --- Lock toggle ---
function msg_int(v) {
    if (inlet === 1) {
        globalSettings.set("lock_memory", v);
        outlet(0, ["update", "global_settings"]);
    }
    else if (inlet === 2) {
        var selected = Math.max(1, Math.min(v, maxChords));
        globalSettings.set("selected_chord", selected);
        outlet(0, ["update", "global_settings"]);
    }
    else if (inlet === 3) {
        globalSettings.set("add_spread", v);
        outlet(0, ["update", "global_settings"]);
    }
}


