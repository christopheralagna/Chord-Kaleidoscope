
inlets = 4;
outlets = 4;

// ------------------------------------------------------------
// GLOBAL VARIABLES
// ------------------------------------------------------------
var generateModeDict = new Dict("generate_mode"); // global settings
var cachedSets = null; // in-memory cache of parsed sets
var exactSetSize = 7;  // default number of notes per set
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
    checkScaleSizeAvailability(input, sets);

    // Fallback if no matches found
    if (result.length === 0 && input.length > 0) {
        var yLen = input.length;
        if (yLen < 4) yLen = 4;
        if (yLen > 8) yLen = 8;

        post("⚠️ No matches found for " + exactSetSize + "-note sets. Falling back to length " + yLen + "\n");
        exactSetSize = yLen;

        // Output the new scaleMenu index out of outlet 3 (menu index = exactSetSize - 4)
        outlet(3, exactSetSize - 4);

        var fallbackResult = sets.filter(function (set) {
            if (set.length !== exactSetSize) return false;

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

function checkScaleSizeAvailability(input, sets) {
    if (!Array.isArray(input)) return;
    sets = sets || loadSets();
    if (!sets || sets.length === 0) return;

    var sizes = [4, 5, 6, 7, 8];
    var unavailableSizes = [];

    sizes.forEach(function (size) {
        var matches = sets.filter(function (set) {
            if (set.length !== size) return false;
            var isSubset = input.every(function (num) {
                return set.indexOf(num) !== -1;
            });
            var isSuperset = set.every(function (num) {
                return input.indexOf(num) !== -1;
            });
            return isSubset || isSuperset;
        });
        if (matches.length === 0) unavailableSizes.push(size);
    });

    // Max JS outlet takes individual arguments, so we dynamically spread them
    if (unavailableSizes.length === 0) {
        outlet(2, "greyed_sizes");
    } else if (unavailableSizes.length === 1) {
        outlet(2, "greyed_sizes", unavailableSizes[0]);
    } else if (unavailableSizes.length === 2) {
        outlet(2, "greyed_sizes", unavailableSizes[0], unavailableSizes[1]);
    } else if (unavailableSizes.length === 3) {
        outlet(2, "greyed_sizes", unavailableSizes[0], unavailableSizes[1], unavailableSizes[2]);
    } else if (unavailableSizes.length === 4) {
        outlet(2, "greyed_sizes", unavailableSizes[0], unavailableSizes[1], unavailableSizes[2], unavailableSizes[3]);
    } else {
        outlet(2, "greyed_sizes", unavailableSizes[0], unavailableSizes[1], unavailableSizes[2], unavailableSizes[3], unavailableSizes[4]);
    }
}

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
    // Delay sending the mode change so the rest of the UI can finish loading cleanly first!
    var t = new Task(forceStartup, this);
    t.schedule(50); // wait 50ms
}

function forceStartup() {
    // Default to 7-note scale at startup
    exactSetSize = 7;
    // Force scaleMenu to switch to index 3 (7-note)
    outlet(3, 3);
}

function clear_notes() {
    processSets([], loadSets());
}
