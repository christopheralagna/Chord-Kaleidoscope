
//handle_greyed_options.js
outlets = 2; // 0 = name/value updates, 1 = mode

var groups = {
    0: ["cluster1", "cluster2", "interval2", "interval3"],
    1: ["triad", "sus2", "sus4", "quartal", "cluster1", "cluster2", "triad+2", "triad+4", "7th", "7thsus4", "interval2", "interval3", "interval4"],
    2: ["triad", "sus2", "sus4", "cluster1", "cluster2", "triad+2", "triad+4", "interval2", "interval3", "interval4", "interval5"],
    3: ["triad", "sus2", "sus4", "quartal", "cluster1", "cluster2", "triad+2", "triad+4", "7th", "7thsus4", "interval2", "interval3", "interval4", "interval5", "interval6"],
    4: ["triad", "sus2", "sus4", "quartal", "cluster1", "cluster2", "triad+2", "triad+4", "7th", "7thsus4", "special1", "special2", "interval2", "interval3", "interval4", "interval5", "interval6", "interval7"]
};

var fallbackByMode = {
    0: "cluster1",
    1: "triad",
    2: "triad",
    3: "triad",
    4: "triad"
};

// collect unique names
var allButtons = [];
for (var k in groups) {
    var arr = groups[k];
    for (var i = 0; i < arr.length; i++) {
        if (allButtons.indexOf(arr[i]) === -1)
            allButtons.push(arr[i]);
    }
}

// for greying out scale sizes in live.menu
var menu = this.patcher.getnamed("scaleMenu"); // your [live.menu] object

// Mapping between scale size and live.menu index
// (index: 0=4-note, 1=5-note, 2=6-note, 3=7-note, 4=8-note)
var menuIndexBySize = {
    4: 0,
    5: 1,
    6: 2,
    7: 3,
    8: 4
};

// Message: "greyed_sizes 7 8" → disables 7-note & 8-note in the menu
function greyed_sizes() {
    var args = arrayfromargs(arguments);
    var unavailable = args.map(function (x) { return parseInt(x); });
    var allSizes = [4, 5, 6, 7, 8];

    allSizes.forEach(function (size) {
        var idx = menuIndexBySize[size];
        if (typeof idx !== "undefined") {
            if (unavailable.indexOf(size) !== -1) {
                // live.menu syntax
                menu.message("enableitem", idx, 0);
                // umenu syntax (1 = disabled)
                menu.message("disableitem", idx, 1);
            } else {
                // live.menu syntax
                menu.message("enableitem", idx, 1);
                // umenu syntax (0 = enabled)
                menu.message("disableitem", idx, 0);
            }
        }
    });

    post("Menu updated — disabled: " + unavailable.join(", ") + "\n");
}

function getActiveButtons() {
    var on = [];
    for (var i = 0; i < allButtons.length; i++) {
        var o = this.patcher.getnamed(allButtons[i]);
        if (o && o.getvalueof && o.getvalueof() == 1)
            on.push(allButtons[i]);
    }
    return on;
}

var isStartup = true;

function msg_int(mode) {
    if (mode < 0 || mode > 4) {
        post("Invalid mode:", mode, "\n");
        return;
    }

    outlet(1, mode);

    var allowed = groups[mode] || [];
    var currentOn = getActiveButtons();

    // Override Ableton's saved UI state explicitly on the first mode pass
    if (isStartup) {
        currentOn = ["triad"];
        isStartup = false;
    }

    // --- Determine which buttons to turn off/on ---
    var toTurnOff = [];
    var keepActive = [];

    for (var i = 0; i < currentOn.length; i++) {
        if (allowed.indexOf(currentOn[i]) === -1)
            toTurnOff.push(currentOn[i]);
        else
            keepActive.push(currentOn[i]);
    }

    // --- Fallback protection (for chord buttons only) ---
    if (keepActive.length === 0 && allowed.length) {
        // avoid choosing interval buttons as fallback
        var fb = fallbackByMode[mode] || allowed[0];
        if (fb.indexOf("interval") !== -1) {
            // if fallback is an interval, pick first non-interval allowed button
            for (var f = 0; f < allowed.length; f++) {
                if (allowed[f].indexOf("interval") === -1) {
                    fb = allowed[f];
                    break;
                }
            }
        }
        keepActive = [fb];
    }

    // --- OUTPUT CHANGES ---
    // turn off disallowed
    for (var t = 0; t < toTurnOff.length; t++) {
        var name0 = toTurnOff[t];
        outlet(0, name0, 0);
        var o0 = this.patcher.getnamed(name0);
        if (o0) o0.message(0);
    }

    // turn on allowed
    for (var a = 0; a < keepActive.length; a++) {
        var name1 = keepActive[a];
        outlet(0, name1, 1);
        var o1 = this.patcher.getnamed(name1);
        if (o1) o1.message(1);
    }

}

