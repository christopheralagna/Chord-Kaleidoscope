
// ============================================================
// end_sublist_without_consecutive.js
// ============================================================

outlets = 2;
inlets = 4;

var currentScale = [];  // valid scale notes
var lastNotes = [];     // last 20 played notes
var maxHistory = 20;
var isFixed = 0;

// --- Helpers ---
function hasConsecutiveNumbers(noteList) {
    if (noteList.length < 3) return false;
    var sorted = noteList.slice().sort(function(a,b){return a-b;});
    var consecutive = 1;
    for (var i=1;i<sorted.length;i++) {
        if (sorted[i] === sorted[i-1] + 1) consecutive++;
        else if (sorted[i] !== sorted[i-1]) consecutive = 1;
        if (consecutive >= 3) return true;
    }
    // Wrap-around cases (11-0-1 and 10-11-0)
    if (sorted.indexOf(0)!==-1 && sorted.indexOf(11)!==-1) {
        if (sorted.indexOf(1)!==-1 || sorted.indexOf(10)!==-1) return true;
    }
    return false;
}

function getUniqueNotes(list) {
    var out = [];
    for (var i=0;i<list.length;i++)
        if (out.indexOf(list[i])===-1) out.push(list[i]);
    return out;
}

function findValidSubsetFromEnd(notes) {
    for (var len=notes.length; len>0; len--) {
        var subset = notes.slice(notes.length - len);
        var unique = getUniqueNotes(subset);
        if (!hasConsecutiveNumbers(unique)) return unique;
    }
    return [];
}

// --- Inlets ---
function list() {
    if (inlet==0) {
        var inputList = arrayfromargs(arguments);
        if (isFixed==1) outlet(0,currentScale);
        else processInput(inputList);
    }
}

function msg_int(v) {
    if (inlet==0) processInput([v]);
    else if (inlet==1) {
        isFixed = v;
        post("Fixed mode:", isFixed, "\n");
    }
}

function bang() {
    if (inlet==2) { // reset
        currentScale = [];
        lastNotes = [];
        outlet(0, currentScale);
        post("Scale reset.\n");
    }
    if (inlet==3) { // resend
        outlet(0, currentScale);
    }
}

// --- Main logic ---
function processInput(inputList) {
    for (var i=0;i<inputList.length;i++) lastNotes.push(inputList[i]);
    if (lastNotes.length > maxHistory)
        lastNotes = lastNotes.slice(lastNotes.length - maxHistory);

    var testScale = getUniqueNotes(currentScale.concat(inputList));

    if (hasConsecutiveNumbers(testScale)) {
        post("⚠️ Rule broken. Rebuilding valid subset.\n");
        outlet(1, "bang");
        currentScale = findValidSubsetFromEnd(lastNotes);
    } else {
        for (var i=0;i<inputList.length;i++)
            if (currentScale.indexOf(inputList[i])===-1)
                currentScale.push(inputList[i]);
        currentScale.sort(function(a,b){return a-b;});
    }

    outlet(0, currentScale);
}
