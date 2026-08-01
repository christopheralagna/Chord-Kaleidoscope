
// ============================================================
// apply_chord_options.js — Finalized Version with No-Repeats Logic
// ------------------------------------------------------------
// inlet 0: incoming generated chord candidate
// outlet 0: chord sent to send_chord.js
// outlet 1: chord sent to chord_memory.js (for updating storage)
// ============================================================

inlets = 1;
outlets = 2;

var activeOptionsDict = new Dict("active_options");
var chordHistoryDict = new Dict("chord_history");
var chordMemoryDict = new Dict("chord_memory");
var globalSettingsDict = new Dict("global_settings");
var generateModeDict = new Dict("generate_mode");

var lastChord = [];

// ------------------- UTILITIES -------------------
function getRandomKey(obj) {
    var keys = [];
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) keys.push(k);
    }
    if (keys.length === 0) return null;
    return keys[Math.floor(Math.random() * keys.length)];
}

function applyOptions(chord, inversions, drops) {
    var invKey = getRandomKey(inversions);
    var dropKey = getRandomKey(drops);
    if (invKey === null || dropKey === null) return chord;

    var invOffset = inversions[invKey];
    var dropOffset = drops[dropKey];

    // 1. Apply inversion
    var voiced = [];
    for (var i = 0; i < chord.length; i++) {
        var ai = (invOffset && invOffset[i] != null) ? invOffset[i] : 0;
        voiced.push(chord[i] + ai);
    }

    // 2. Sort numerically
    voiced.sort(function (a, b) { return a - b; });

    // 3. Apply drop
    for (var j = 0; j < voiced.length; j++) {
        var bj = (dropOffset && dropOffset[j] != null) ? dropOffset[j] : 0;
        voiced[j] += bj;
    }

    // 4. Sort numerically again
    voiced.sort(function (a, b) { return a - b; });

    return voiced;
}

function addToHistory(ch) {
    var s = chordHistoryDict.get("chords");
    var arr = [];
    if (s) {
        try {
            arr = JSON.parse(s);
        } catch (e) {
            arr = [];
        }
    }
    arr.unshift(ch.slice(0));
    if (arr.length > 20) arr = arr.slice(0, 20);
    chordHistoryDict.set("chords", JSON.stringify(arr));
}

// Helper: Compare two arrays of numbers
function chordsAreEqual(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

// ------------------- MAIN -------------------
function list() {
    var chord = arrayfromargs(arguments);
    if (chord.length < 2) return;

    var generateMode = generateModeDict.get("generateMode");
    var triggered = generateModeDict.get("triggered");
    var locked = globalSettingsDict.get("lock_memory") == 1;
    var addSpread = globalSettingsDict.get("add_spread") == 1;
    var selectedChord = globalSettingsDict.get("selected_chord") || 1;

    if (generateMode === "none" && triggered !== "true") {
        return;
    }

    var outputChord = [];

    // ---------------- LOCKED MODE ----------------
    if (locked) {
        var chordKey = "chord" + selectedChord;
        var baseChord = chordMemoryDict.get(chordKey);

        if (!baseChord) {
            return;
        }

        var chordCopy = baseChord.slice ? baseChord.slice(0) : baseChord;
        //var noteType = (chordCopy.length === 3) ? "3NoteVoicing" : "4NoteVoicing";
        var noteType =
            (chordCopy.length === 2) ? "2NoteVoicing" :
                (chordCopy.length === 3) ? "3NoteVoicing" :
                    "4NoteVoicing";
        var invKey = noteType + "::inversions";
        var dropKey = noteType + "::dropVoicings";
        var inversions = activeOptionsDict.get(invKey);
        var drops = activeOptionsDict.get(dropKey);

        if (addSpread && inversions && drops) {
            inversions = JSON.parse(inversions.stringify());
            drops = JSON.parse(drops.stringify());

            var attempts = 0;
            var newChord = chordCopy;
            do {
                newChord = applyOptions(chordCopy, inversions, drops);
                attempts++;
            } while (chordsAreEqual(newChord, lastChord) && attempts < 5);

            outputChord = newChord;
        } else {
            outputChord = chordCopy;
        }
    }

    // ---------------- UNLOCKED MODE ----------------
    else {

        //var noteType2 = (chord.length === 3) ? "3NoteVoicing" : "4NoteVoicing";
        var noteType2 =
            (chord.length === 2) ? "2NoteVoicing" :
                (chord.length === 3) ? "3NoteVoicing" :
                    "4NoteVoicing";
        var invKey2 = noteType2 + "::inversions";
        var dropKey2 = noteType2 + "::dropVoicings";
        var inversions2 = activeOptionsDict.get(invKey2);
        var drops2 = activeOptionsDict.get(dropKey2);
        if (!(inversions2 && drops2)) return;
        inversions2 = JSON.parse(inversions2.stringify());
        drops2 = JSON.parse(drops2.stringify());

        outputChord = applyOptions(chord, inversions2, drops2);



        if (addSpread) {
            var spread = [];
            for (var i = 0; i < outputChord.length; i++) {
                spread.push((i % 2 === 1) ? outputChord[i] - 12 : outputChord[i]);
            }
            outputChord = spread;
        }

        outlet(1, outputChord); // update memory when unlocked
    }

    // ---------------- OUTPUT ----------------
    addToHistory(outputChord);
    outlet(0, outputChord);

    lastChord = outputChord.slice(0);
    generateModeDict.set("triggered", "false");
}

