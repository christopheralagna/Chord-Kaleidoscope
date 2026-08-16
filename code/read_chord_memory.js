// ============================================================
// read_chord_memory.js
// Reads the last 5 chords from chord_memory.json
// and outputs them (one per outlet) when banged.
// ============================================================

inlets = 1;   // Inlet 0: bang to refresh
outlets = 5;  // Outlets 0–4 correspond to chord1–chord5

var chordMemory = new Dict("chord_memory");
var maxChords = 5;

function selected(slot) {
    // Optional: update a UI highlight for the selected chord

    // You can output this to an outlet if needed:
    outlet(1, ["highlight", slot]); 
}


// --- Helper: safely parse Dict entry into JS array ---
function getChord(key) {
    var val = chordMemory.get(key);
    if (!val) return [];
    if (val instanceof Dict) {
        try { return JSON.parse(val.stringify()); } 
        catch(e) { return []; }
    }
    return val;
}

// --- Refresh and output all 5 chords ---
function bang() {
    for (var i = 1; i <= maxChords; i++) {
        var key = "chord" + i;
        var chord = getChord(key);
        if (Array.isArray(chord) && chord.length > 0) {
            outlet(i - 1, chord); // send list to outlet
        } else {
            outlet(i - 1, []); // send empty list if none
        }
    }
}
