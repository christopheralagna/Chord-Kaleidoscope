
inlets = 4;
outlets = 4;

// ------------------------------------------------------------
// GLOBAL VARIABLES
// ------------------------------------------------------------
var generateModeDict = new Dict("generate_mode"); // global settings
var cachedSets = null; // in-memory cache of parsed sets
var exactSetSize = 4;  // default number of notes per set
var numberOfEntries = 0;
var currentScale = [];
var lastScale = [];

// ------------------------------------------------------------
// LOAD AND CACHE ALL SETS FROM FILE
// ------------------------------------------------------------
function loadSets() {
    if (cachedSets) {
        return cachedSets;
    }

    var filename = "filtered_powerset_list.txt";
    var file = new File(filename, "read");
    var sets = [];

    if (file.isopen) {
        var fileContent = "";
        var line;
        while ((line = file.readline()) !== null) fileContent += line + "\n";
        file.close();

        sets = fileContent
            .split("\n")
            .map(function (line) { return line.trim(); })
            .filter(function (line) {
                return line.indexOf("(") === 0 && line.indexOf(")") === line.length - 1;
            })
            .map(function (line) {
                return line.slice(1, -1)
                    .split(",")
                    .map(function (num) { return parseInt(num, 10); })
                    .filter(function (num) { return !isNaN(num); });
            });

        cachedSets = sets;

    } else {

    }

    return sets;
}

// ------------------------------------------------------------
// MAIN PROCESSING FUNCTION
// ------------------------------------------------------------
function processSets(input, sets) {
    // Normalize input
    if (typeof input === "number") {
        input = [input];
    } else if (!Array.isArray(input)) {
        try {
            input = Array.prototype.slice.call(input);
        } catch (e) {
            post("⚠️ Invalid input, using empty array\n");
            input = [];
        }
    }

    // Load sets automatically if missing or invalid
    if (!sets || !Array.isArray(sets) || sets.length === 0) {
        post("ℹ️ Loading sets internally...\n");
        sets = loadSets();
    }

    currentScale = input.slice();

    if (!Array.isArray(sets) || !Array.isArray(sets[0])) {
        post("❌ Invalid sets data; aborting process.\n");
        return;
    }

    post("🔍 Processing input:", input, "with target size:", exactSetSize, "\n");

    // Filter sets normally
    var result = sets.filter(function (set) {
        if (set.length !== exactSetSize) return false;

        var isSubset = input.every(function (num) {
            return set.indexOf(num) !== -1;
        });

        var isSuperset = set.every(function (num) {
            return input.indexOf(num) !== -1;
        });

        return isSubset || isSuperset;
    });

    // Fallback if no matches found
    if (result.length === 0 && input.length > 0) {
        post("⚠️ No matches found for " + exactSetSize + "-note sets. Falling back to 6-note sets.\n");
        outlet(1, "bang");
        exactSetSize = 4;

        var fallbackResult = sets.filter(function (set) {
            if (set.length !== 6) return false;

            var isSubset = input.every(function (num) {
                return set.indexOf(num) !== -1;
            });

            var isSuperset = set.every(function (num) {
                return input.indexOf(num) !== -1;
            });

            return isSubset || isSuperset;
        });

        storeAndOutput(fallbackResult);
        return;
    }

    storeAndOutput(result);
}

var WHOLE_TONE_A = "[0,2,4,6,8,10]";
var WHOLE_TONE_B = "[1,3,5,7,9,11]";
var lastScaleKey = "";

function toKey(arr) {
    return Array.isArray(arr) ? JSON.stringify(arr.slice()) : "";
}

function isWholeTone(key) {
    return key === WHOLE_TONE_A || key === WHOLE_TONE_B;
}

function checkScaleSizeAvailability(input) {
    if (!Array.isArray(input)) return;

    var inputKey = toKey(input);
    var currentKey = toKey(currentScale);
    var prevKey = lastScaleKey || toKey(lastScale);

    var isWholeToneInput = input.length >= 6 && isWholeTone(inputKey);
    var currentWholeTone = isWholeTone(currentKey);
    var previousWholeTone = isWholeTone(prevKey);

    var inputUnfit8 = checkForUnfit8NoteScale(input);
    var currentUnfit8 = checkForUnfit8NoteScale(currentScale);
    var prevUnfit8 = checkForUnfit8NoteScale(lastScale);


    if (isWholeToneInput) {

        if (exactSetSize == 7 || exactSetSize == 8) {
            outlet(3, 0); // notify to change exactSetSize if needed
        }
        outlet(1, 0); // disable 7-note option
        outlet(2, 0); // disable 8-note option
    } else if (!currentWholeTone && previousWholeTone) {
        outlet(1, 1);
        outlet(2, 1);
    }

    if (inputUnfit8) {
        if (exactSetSize == 8) {
            outlet(3, 0); // notify to change exactSetSize if needed
        }
        outlet(2, 0); // disable 8-note option
    } else if (!currentUnfit8 && prevUnfit8) {
        outlet(2, 1);
    }

    lastScale = input.slice();
    lastScaleKey = inputKey;
}

var FIT_8_NOTE_SETS = [
    [0, 1, 3, 4, 6, 7, 9, 10],
    [1, 2, 4, 5, 7, 8, 10, 11],
    [0, 2, 3, 5, 6, 8, 9, 11]
];

function checkForUnfit8NoteScale(input) {
    if (!Array.isArray(input) || input.length === 0) return false;

    var normalized = input.slice().sort(function (a, b) { return a - b; });

    var fitsAny = FIT_8_NOTE_SETS.some(function (candidate) {
        return normalized.every(function (num) {
            return candidate.indexOf(num) !== -1;
        });
    });

    return !fitsAny;
}


/*

var WHOLE_TONE_A = "[0,2,4,6,8,10]";
var WHOLE_TONE_B = "[1,3,5,7,9,11]";
var lastScaleKey = "";

function toKey(arr) {
    return Array.isArray(arr) ? JSON.stringify(arr.slice()) : "";
}

function isWholeTone(key) {
    return key === WHOLE_TONE_A || key === WHOLE_TONE_B;
}

function checkScaleSizeAvailability(input) {
    if (!Array.isArray(input)) return;

    var inputKey   = toKey(input);
    var currentKey = toKey(currentScale);
    var prevKey    = lastScaleKey || toKey(lastScale);

    var isWholeToneInput   = input.length >= 6 && isWholeTone(inputKey);
    var currentWholeTone   = isWholeTone(currentKey);
    var previousWholeTone  = isWholeTone(prevKey);

    var inputUnfit7   = input.length === 7 && checkForUnfit7NoteScale(input);
    var currentUnfit7 = checkForUnfit7NoteScale(currentScale);
    var prevUnfit7    = checkForUnfit7NoteScale(lastScale);

    if (isWholeToneInput) {
        outlet(1, 0);
        outlet(2, 0);
    } else if (!currentWholeTone && previousWholeTone) {
        outlet(1, 1);
        outlet(2, 1);
    }

    if (inputUnfit7) {
        outlet(2, 0);
    } else if (!currentUnfit7 && prevUnfit7) {
        outlet(2, 1);
    }

    lastScale    = input.slice(); // keep a copy to avoid aliasing
    lastScaleKey = inputKey;
}

var FIT_8_NOTE_SETS = [
    [0,1,3,4,6,7,9,10],
    [1,2,4,5,7,8,10,11],
    [0,2,3,5,6,8,9,11]
];

function checkForUnfit7NoteScale(input) {
    if (!Array.isArray(input) || input.length === 0) return false;

    // Normalise values in case duplicates sneak in
    var normalized = input.slice().sort(function(a,b){ return a-b; });

    var fitsAny = FIT_8_NOTE_SETS.some(function(candidate) {
        return normalized.every(function(num) {
            return candidate.indexOf(num) !== -1;
        });
    });

    return !fitsAny; // true only when input is NOT a subset of any candidate
}
*/

function checkScaleSizeAvailabilityHandler() {
    var inputList = arrayfromargs(arguments);
    post("✅ Received inputList:", inputList, "\n");
    checkScaleSizeAvailability(inputList, loadSets());
}

// ------------------------------------------------------------
// HELPER: STORE AND OUTPUT RESULT
// ------------------------------------------------------------
function storeAndOutput(result) {
    outlet(0, "clear");
    for (var i = 0; i < result.length; i++) {
        outlet(0, "store", i, result[i]);
    }

    numberOfEntries = result.length;

    if (numberOfEntries > 0) {
        var randomValue = getRandomChoiceValue();
        outlet(0, randomValue);
        post("✅ Found " + numberOfEntries + " sets (exact size: " + exactSetSize + ")\n");
    } else {
        post("⚠️ No sets found even after fallback.\n");
    }
}

function getRandomChoiceValue() {
    return Math.floor(Math.random() * numberOfEntries);
}

// ------------------------------------------------------------
// INLET HANDLERS
// ------------------------------------------------------------

// Left inlet: receives list of notes
function list() {
    if (inlet == 0) {
        var inputList = arrayfromargs(arguments);
        processSets(inputList, loadSets());
    }

    if (inlet == 3) {
        var inputList = arrayfromargs(arguments);
        currentScale = inputList.slice();
        checkScaleSizeAvailability(inputList);
    }
}

// Left inlet: receives single int (first note)
function msg_int(v) {
    if (inlet == 1) {
        exactSetSize = v;
        post("Exact set size set to: " + exactSetSize + "\n");
        return;
    }

    if (inlet == 0) {
        processSets(v, loadSets());
    }
}

// Second inlet: manually set exact set size
function reset() {
    var sets = loadSets();
    var result = sets.filter(function (set) { return set.length === exactSetSize; });

    outlet(0, "clear");
    for (var i = 0; i < result.length; i++) {
        outlet(0, "store", i, result[i]);
    }

    numberOfEntries = result.length;
    var randomValue = getRandomChoiceValue();
    outlet(0, randomValue);
    post("🎲 Reset: chose random scale of size " + exactSetSize + " (" + numberOfEntries + " total)\n");
}

// Third inlet: trigger new random selection
function bang() {
    if (inlet == 2) {
        generateModeDict.set("triggered", "true");
        processSets(currentScale, loadSets());
    }
}

// Preload cache when patch loads
function loadbang() {
    loadSets();
}


/*
inlets = 3;
outlets = 3;

var generateModeDict = new Dict("generate_mode"); // global settings dict
var numberOfEntries = 0;
var exactSetSize = 5; // Default exact size (can be changed via right inlet)

var cachedSets = null;

function loadSets() {
    if (cachedSets) return cachedSets; // reuse

    var filename = "filtered_powerset_list.txt";
    var file = new File(filename, "read");
    var sets = [];

    if (file.isopen) {
        var fileContent = "";
        var line;
        while ((line = file.readline()) !== null) fileContent += line + "\n";
        file.close();

        sets = fileContent
            .split('\n')
            .map(function(line){ return line.trim(); })
            .filter(function(line){ return line.indexOf('(')===0 && line.indexOf(')')===line.length-1; })
            .map(function(line){
                return line.slice(1,-1)
                    .split(',')
                    .map(function(num){ return parseInt(num,10); })
                    .filter(function(num){ return !isNaN(num); });
            });

        cachedSets = sets;
        post("✅ Loaded " + sets.length + " sets from cache.\n");
    } else {
        post("⚠️ Error opening " + filename + "\n");
    }


    return sets;
}

var lastInput = [];

function processSets(input, sets) {
    post("🔍 Processing sets for input:", input, "with exact size:", exactSetSize, "\n");
    // 🟢 Normalize input
    if (typeof input === "number") {
        input = [input]; // wrap single number in array
    } else if (!Array.isArray(input)) {
        // Max sometimes passes weird list-like objects; try to coerce safely
        try {
            input = Array.prototype.slice.call(input);
        } catch (e) {
            post("⚠️ Invalid input type, defaulting to empty array\n");
            input = [];
        }
    }

    if (!Array.isArray(sets)) {
        post("⚠️ Invalid sets input to processSets()\n");
        return;
    }

    lastInput = input;

    // 🟢 Filter sets normally
    var result = sets.filter(function(set) {
        if (set.length !== exactSetSize) return false;

        var isSubset = input.every(function(num) {
            return set.indexOf(num) !== -1;
        });

        var isSuperset = set.every(function(num) {
            return input.indexOf(num) !== -1;
        });

        return isSubset || isSuperset;
    });

    // 🟠 Fallback if no matches
    if (result.length === 0 && input.length > 0) {
        post("⚠️ No matches found for " + exactSetSize + "-note sets. Falling back to 6-note sets.\n");

        outlet(1, "bang");
        exactSetSize = 5;

        var fallbackResult = sets.filter(function(set) {
            if (set.length !== 6) return false;

            var isSubset = input.every(function(num) {
                return set.indexOf(num) !== -1;
            });

            var isSuperset = set.every(function(num) {
                return input.indexOf(num) !== -1;
            });

            return isSubset || isSuperset;
        });

        storeAndOutput(fallbackResult);
        return;
    }

    storeAndOutput(result);
}

var lastUnavailable = [];

function checkScaleSizeAvailability(input, fileContent) {
    // Accept both cached array or raw string input
    var sets;

    if (Array.isArray(fileContent)) {
        sets = fileContent; // Already parsed/cached
    } else if (typeof fileContent === "string") {
        // Parse the text into sets
        sets = fileContent
            .split('\n')
            .map(function(line) { return line.trim(); })
            .filter(function(line) {
                return line.indexOf('(') === 0 && line.indexOf(')') === line.length - 1;
            })
            .map(function(line) {
                return line.slice(1, -1)
                    .split(',')
                    .map(function(num) { return parseInt(num, 10); })
                    .filter(function(num) { return !isNaN(num); });
            });
    } else {
        post("❌ fileContent invalid type — expected string or array.\n");
        return;
    }

    // ✅ At this point, sets is always an array of arrays
    post("✅ Parsed", sets.length, "sets.\n");

    var sizes = [7, 8];
    var unavailableSizes = [];

    sizes.forEach(function(size) {
        var matches = sets.filter(function(set) {
            if (set.length !== size) return false;
            var isSubset = input.every(function(num) {
                return set.indexOf(num) !== -1;
            });
            var isSuperset = set.every(function(num) {
                return input.indexOf(num) !== -1;
            });
            return isSubset || isSuperset;
        });
        if (matches.length === 0) unavailableSizes.push(size);
    });

    outlet(2, ["greyed_sizes"].concat(unavailableSizes));

    if (unavailableSizes.length > 0) {
        post("⚠️ No matches for sizes: " + unavailableSizes.join(", ") + " — disabling in menu.\n");
    } else {
        post("✅ All scale sizes available.\n");
    }
}

function checkScaleSizeAvailabilityHandler() {
    var inputList = arrayfromargs(arguments);
    post("✅ Received inputList:", inputList, "\n");
    checkScaleSizeAvailability(inputList, loadSets());
}


// Helper to clear, store, and output a random scale
function storeAndOutput(result) {
    outlet(0, "clear");
    for (var i = 0; i < result.length; i++) {
        outlet(0, "store", i, result[i]);
    }
    numberOfEntries = result.length;

    if (numberOfEntries > 0) {
        var randomValue = getRandomChoiceValue();
        outlet(0, randomValue);
        post("✅ Found " + numberOfEntries + " sets (exact size: " + exactSetSize + ")\n");
    } else {
        post("⚠️ No sets found even after fallback.\n");
    }
}

//generate random value of length of numberOfEntries
function getRandomChoiceValue() {
    return Math.floor(Math.random() * numberOfEntries);
}

// Left inlet - receives the input list
function list() {
    if (inlet == 0) {
        var inputList = arrayfromargs(arguments);
        
        var filename = "filtered_powerset_list.txt";
        var file = new File(filename, "read");
        
        if (file.isopen) {
            var fileContent = "";
            var line;
            while ((line = file.readline()) !== null) {
                fileContent += line + "\n";
            }
            file.close();
            processSets(inputList, fileContent);
        } else {
            post("Error opening file: " + filename + "\n");
        }

        var randomValue = getRandomChoiceValue();
        outlet(0, randomValue);
    }
}

// Right inlet - sets the exact set size
function msg_int(v) {
    if (inlet == 1) {
        exactSetSize = v;
        post("Exact set size set to: " + exactSetSize + "\n");
    }
    
    //handle single int as first note to be processed
    if (inlet == 0) {
        processSets(v, loadSets());
       
    }
        
}

// Handle "reset" message → choose random scale of the specified size (no filtering)
function reset() {
    var filename = "filtered_powerset_list.txt";
    var file = new File(filename, "read");
    
    if (file.isopen) {
        var fileContent = "";
        var line;
        while ((line = file.readline()) !== null) {
            fileContent += line + "\n";
        }
        file.close();

        // Parse all sets from file
        var sets = fileContent
            .split('\n')
            .map(function(line) { return line.trim(); })
            .filter(function(line) { return line.indexOf('(') === 0 && line.indexOf(')') === line.length - 1; })
            .map(function(line) {
                return line.slice(1, -1)
                    .split(',')
                    .map(function(num) { return parseInt(num, 10); })
                    .filter(function(num) { return !isNaN(num); });
            });

        // Filter to only those with the exact desired size
        var result = sets.filter(function(set) {
            return set.length === exactSetSize;
        });

        // Clear and repopulate coll
        outlet(0, "clear");
        for (var i = 0; i < result.length; i++) {
            outlet(0, "store", i, result[i]);
        }

        numberOfEntries = result.length;

        // Choose a random one
        var randomValue = getRandomChoiceValue();
        outlet(0, randomValue);
        post("🎲 Reset: chose random scale of size " + exactSetSize + " (" + numberOfEntries + " total options)\n");

    } else {
        post("Error opening file during reset: " + filename + "\n");
    }
}


// Third inlet - manual trigger for new random selection
function bang() {
    if (inlet == 2) {
        generateModeDict.set("triggered", "true");
        var randomValue = getRandomChoiceValue();
        outlet(0, randomValue);
    }
}
*/
