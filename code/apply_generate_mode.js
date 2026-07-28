


var generateModeDict = new Dict("generate_mode"); // global settings dict
var noteCounter = 0;
var targetNoteCount = 0;

var reactive_mode = false;

inlets = 5;
outlets = 3;

// Helper: parse nested Dicts safely
function getParsedDictValue(dict, key) {
    var value = dict.get(key);
    if (value && value.stringify) {
        return JSON.parse(value.stringify());
    }
    return value;
}

function getNewNoteCount() {
    var noteCountSettings = getParsedDictValue(generateModeDict, "noteCountSettings");
    if (!noteCountSettings) {
        return 0;
    }

    var mode = noteCountSettings["generationPerNoteCount"];
    if (mode === "fixed") {
        return noteCountSettings["fixedCount"] || 0;
    }

    if (mode === "variable") {
        var min = noteCountSettings["min"] || 0;
        var max = noteCountSettings["max"] || min;
        if (min >= max) {
            return min;
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    return 0;
}

// --- Per-note counting trigger ---
function msg_int(v) {
    if (inlet == 1) {
        targetNoteCount = v;
        noteCounter = targetNoteCount;
    }

    if (inlet == 4) {
        noteCounter = getNewNoteCount();
    }

    if (inlet == 0) {
        var generateMode = generateModeDict.get("generateMode");

        if (generateMode === "perNoteCount") {

            outlet(0, 0); // ensure Tempo Gate is closed

            noteCounter--;

            if (noteCounter <= 0) {
                outlet(1, "bang"); // chord generation
                noteCounter = getNewNoteCount();
            }

        }
        else if (generateMode === "fixedTimeInterval") {
            // time-based mode handled elsewhere
            outlet(0, 1);
        }
        else if (generateMode === "none") {
            outlet(0, 0); // ensure Tempo Gate is closed
            outlet(1, "bang"); //let every note through
        }
    }

    if (inlet == 3) {
        reactive_mode = (v != 0);
        post("Reactive mode set to:", reactive_mode, "\n");
    }
}

//receive and send rate to generate new chord if reactive_mode disabled
function bang() {
    var generateMode = generateModeDict.get("generateMode");
    if (inlet == 2 && generateMode === "fixedTimeInterval" && !reactive_mode) {
        outlet(2, "bang"); // send last note through again to trigger new chord at rate_of_chord
    }
}





