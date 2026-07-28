/*
inlets = 2;
var generateModeDict = new Dict("generate_mode"); // Load the dictionary
var numberOfNotesBeforeGenerate = 0;
var chord;

// Helper to safely retrieve and parse values from a Dict
function getParsedDictValue(dict, key) {
    var value = dict.get(key);
    if (value && value.stringify) {
        return JSON.parse(value.stringify());
    }
    return value; // Return raw value if not a nested Dict
}

function getNewNoteCount() {
    // Safely parse noteCountSettings
    var noteCountSettings = getParsedDictValue(generateModeDict, "noteCountSettings");
    if (!noteCountSettings) {
        post("Error: noteCountSettings is missing or invalid\n");
        return 0; // Default to 0 if settings are not found
    }
    
    var generationPerNoteCount = noteCountSettings["generationPerNoteCount"];
    
    if (generationPerNoteCount === "fixed") {
        return noteCountSettings["fixedCount"] || 0; // Default to 0 if fixedCount is undefined
    }
    
    if (generationPerNoteCount === "variable") {
        var min = noteCountSettings["min"] || 0;
        var max = noteCountSettings["max"] || min;
        
        if (min >= max) {
            post("Warning: min is greater than or equal to max in variable count\n");
            return min; // Return min if range is invalid
        }
        
        return Math.floor(Math.random() * (max - min + 1)) + min; // Inclusive range
    }
    
    post("Warning: generationPerNoteCount has an unrecognized value\n");
    return 0; // Default fallback
}

function list() {
    try {
        chord = arrayfromargs(arguments); // Receive MIDI chord as an array [57, 61, 64]
        var generateMode = getParsedDictValue(generateModeDict, "generateMode");
        
        if (!generateMode) {
            post("Error: generateMode is missing or invalid\n");
            return;
        }
        
        if (generateMode === "fixedTimeInterval") {
            outlet(0, chord); // Pass the chord through
            return;
        }
        
        if (generateMode === "perNoteCount") {
            numberOfNotesBeforeGenerate--; // Decrement first
            
            if (numberOfNotesBeforeGenerate <= 0) {
                numberOfNotesBeforeGenerate = getNewNoteCount(); // Get new note count
                outlet(0, chord); // Pass the chord through
            }
        }
    } catch (err) {
        post("Error: " + err.message + "\n"); // Log errors for debugging
    }
}

function bang() {
	if (inlet = 1) {
		outlet(0, chord); // pass chord through for manually triggered
	}
}

*/