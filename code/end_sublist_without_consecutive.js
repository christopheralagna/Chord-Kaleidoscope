//end_sublist_without_consecutive.js
outlets = 3;
inlets = 4;
var currentScale = []; // Store unique notes that don't break the rule
var lastNotes = []; // Store the last 20 notes played (with duplicates)
var maxHistory = 20; // Maximum number of notes to track

declareattribute("currentScale");
declareattribute("lastNotes");

var lastOutputScale = [];

// Compare arrays of numbers (sorted)
function scalesAreEqual(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

// Check if a list of unique notes contains 3+ consecutive numbers when sorted
function hasConsecutiveNumbers(noteList) {
    if (noteList.length < 3) {
        return false;
    }

    // Ensure all numbers are within the range 0-11
    if (noteList.some(function (x) { return x < 0 || x > 11; })) {
        throw new Error("All numbers in the list must be between 0 and 11.");
    }

    var sorted = noteList.slice().sort(function (a, b) { return a - b; });
    var consecutiveCount = 1;

    for (var i = 1; i < sorted.length; i++) {
        if (sorted[i] === sorted[i - 1] + 1) {
            consecutiveCount++;
            if (consecutiveCount >= 3) {
                return true;
            }
        } else if (sorted[i] !== sorted[i - 1]) { // Don't reset on duplicates
            consecutiveCount = 1;
        }
    }

    // Check wrap-around case: if we have both 11 and 0, and either 1 or 10
    if (sorted.indexOf(0) !== -1 && sorted.indexOf(11) !== -1) {
        if (sorted.indexOf(1) !== -1) {
            return true; // 11, 0, 1
        }
        if (sorted.indexOf(10) !== -1) {
            return true; // 10, 11, 0
        }
    }

    return false;
}

// Get unique notes from a list (preserving order of first appearance)
function getUniqueNotes(noteList) {
    var unique = [];
    for (var i = 0; i < noteList.length; i++) {
        if (unique.indexOf(noteList[i]) === -1) {
            unique.push(noteList[i]);
        }
    }
    return unique;
}

// Find the longest valid subset from the end of the last notes
function findValidSubsetFromEnd(notes) {
    // Start from the most recent note and work backwards
    for (var len = notes.length; len > 0; len--) {
        var subset = notes.slice(notes.length - len);
        var uniqueSubset = getUniqueNotes(subset);

        if (!hasConsecutiveNumbers(uniqueSubset)) {
            return uniqueSubset;
        }
    }

    // If no valid subset found, return empty
    return [];
}

var isFixed = 0; // Track the toggle state

// Left inlet (inlet 0) - always receives lists
function list() {
    if (inlet == 0) {
        var inputList = arrayfromargs(arguments);

        if (isFixed == 1) {
            // When fixed, just output the current scale without updating
            outlet(0, currentScale);
        } else {
            // Normal processing
            processInput(inputList);
        }
    }
}

// Handle single integers on inlet 0 (Max sends single-element lists as ints)
function msg_int(v) {
    if (inlet == 0) {
        // Treat single int as a single-element list
        if (isFixed == 1) {
            outlet(0, currentScale);
        } else {
            processInput([v]);
        }
    } else if (inlet == 1) {
        // Right inlet - toggle between 0 and 1
        isFixed = v; // Store the toggle state (0 or 1)
    }
}

function bang() {
    if (inlet == 2) {
        // Reset everything
        currentScale = [];
        lastNotes = [];
        outlet(0, "clear_notes"); // Output clear command
    }

    if (inlet == 3) {
        if (currentScale.length != 0) {
            outlet(0, currentScale);
        } else {
            outlet(0, "clear_notes");
        }

    }
}

function processInput(inputList) {
    // Add new notes to the rolling history
    for (var i = 0; i < inputList.length; i++) {
        lastNotes.push(inputList[i]);
    }

    // Trim to max history length
    if (lastNotes.length > maxHistory) {
        lastNotes = lastNotes.slice(lastNotes.length - maxHistory);
    }

    // Combine currentScale with new notes for testing potential update
    var testScale = getUniqueNotes(currentScale.concat(inputList));

    // Check if adding these notes breaks the rule
    if (hasConsecutiveNumbers(testScale)) {
        // Rule broken → fallback to valid subset from recent notes
        outlet(1, "bang");

        currentScale = findValidSubsetFromEnd(lastNotes);
    } else {
        // Rule not broken → update scale only if new notes expand it
        var beforeLength = currentScale.length;

        // Add new unique notes to the scale (merge)
        for (var i = 0; i < inputList.length; i++) {
            var note = inputList[i];
            if (currentScale.indexOf(note) === -1) {
                currentScale.push(note);
            }
        }

        // Only sort if something changed
        if (currentScale.length !== beforeLength) {
            currentScale.sort(function (a, b) { return a - b; });
        }
    }

    if (lastOutputScale.length > 0 && !scalesAreEqual(currentScale, lastOutputScale)) {
        outlet(2, "checkScaleSizeAvailabilityHandler", currentScale);
    }

    lastOutputScale = currentScale.slice(); // store a copy

    // Output the updated scale
    outlet(0, currentScale);
}

// handles messages from the jsui circle
function add(pc) {
    // only add if it won’t break the rule
    var test = getUniqueNotes(currentScale.concat([pc]));
    if (hasConsecutiveNumbers(test)) { return; }
    lastNotes.push(pc);
    if (lastNotes.length > maxHistory) lastNotes = lastNotes.slice(lastNotes.length - maxHistory);
    if (currentScale.indexOf(pc) === -1) currentScale.push(pc);
    currentScale.sort(function (a, b) { return a - b; });
    //outlet(0, currentScale);
}

function remove(pc) {
    // purge from lastNotes and currentScale
    var filtered = [];
    for (var i = 0; i < lastNotes.length; i++) if (lastNotes[i] !== pc) filtered.push(lastNotes[i]);
    lastNotes = filtered;
    var idx = currentScale.indexOf(pc);
    if (idx !== -1) currentScale.splice(idx, 1);
    //outlet(0, currentScale);
}

function resetTracked() {
    return; // deprecated
}

