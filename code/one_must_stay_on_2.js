// ============================================================
// one_must_stay_on_spreads_debug_v5.js
// Keeps at least one button ON in each group (ES3-safe)
// ============================================================

inlets = 1;
outlets = 0;

// --- Groups ---
var allSpreadButtons = ["inv0", "inv1", "inv2", "inv3", "no_drop", "drop2", "drop3"];
var allSpreadStates = [1, 0, 0, 0, 1, 0, 0]; // inv0 and no_drop are ON by default

var inversionButtons = ["inv0", "inv1", "inv2", "inv3"];
var dropButtons = ["no_drop", "drop2", "drop3"];

// --- Mapping tables ---
var inversionMap3Note = {
  "inv0": [0, 0, 0],
  "inv1": [12, 0, 0],
  "inv2": [12, 12, 0]
};

var inversionMap4Note = {
  "inv0": [0, 0, 0, 0],
  "inv1": [12, 0, 0, 0],
  "inv2": [12, 12, 0, 0],
  "inv3": [12, 12, 12, 0]
};

var dropMap3Note = {
  "no_drop": [0, 0, 0],
  "drop2": [0, -12, 0]
};

var dropMap4Note = {
  "no_drop": [0, 0, 0, 0],
  "drop2": [0, 0, -12, 0],
  "drop3": [0, -12, 0, 0]
};

var inversionMap2Note = {
  "inv0": [0, 0],
  "inv1": [12, 0]
};

var dropMap2Note = {
  "no_drop": [0, 0],
  "drop2": [-12, 0]
};

// ============================================================
// INIT
// ============================================================
function loadbang() {
  initGroup(allSpreadButtons, allSpreadStates);
  updateDictForAll();
}

function initGroup(buttons, states) {
  for (var i = 0; i < buttons.length; i++) {
    var o = this.patcher.getnamed(buttons[i]);
    var on = states[i];
    if (o) o.message("set", on);
  }
}

// ============================================================
// INPUT HANDLING
// ============================================================
function list() {
  var a = arrayfromargs(arguments);
  handleButton(a[0], parseInt(a[1]));
}

function anything() {
  handleButton(messagename, parseInt(arguments[0]));
}

// ============================================================
// CORE BEHAVIOR
// ============================================================
function handleButton(name, val) {
  var idx = allSpreadButtons.indexOf(name);
  if (idx == -1) return;

  var newVal = val ? 1 : 0;

  // Determine which group this button belongs to
  var isInv = (inversionButtons.indexOf(name) != -1);
  var groupButtons = isInv ? inversionButtons : dropButtons;

  // Count active buttons in this specific group
  var groupActive = 0;
  for (var i = 0; i < groupButtons.length; i++) {
    var bName = groupButtons[i];
    var bIdx = allSpreadButtons.indexOf(bName);
    if (bIdx != -1) {
      groupActive += allSpreadStates[bIdx];
    }
  }

  // Prevent turning off the last active button in its group
  if (groupActive === 1 && newVal === 0 && allSpreadStates[idx] === 1) {
    var o = this.patcher.getnamed(name);
    if (o) {
      o.message("ignoreclick", 1);
      o.message("set", 1);
      o.message("ignoreclick", 0);
    }
    return;
  }

  allSpreadStates[idx] = newVal;
  updateDictForAll();
}

// ============================================================
// DICT UPDATES
// ============================================================
function updateDictForAll() {
  var d = new Dict("active_options");
  ensurePath(d, "2NoteVoicing", "inversions");
  ensurePath(d, "3NoteVoicing", "inversions");
  ensurePath(d, "4NoteVoicing", "inversions");
  ensurePath(d, "2NoteVoicing", "dropVoicings");
  ensurePath(d, "3NoteVoicing", "dropVoicings");
  ensurePath(d, "4NoteVoicing", "dropVoicings");

  // Clear all existing keys for the managed buttons
  for (var i = 0; i < allSpreadButtons.length; i++) {
    var n = allSpreadButtons[i];
    var category = inversionButtons.indexOf(n) != -1 ? "inversions" : "dropVoicings";
    if (d.contains("2NoteVoicing::" + category + "::" + n)) d.remove("2NoteVoicing::" + category + "::" + n);
    if (d.contains("3NoteVoicing::" + category + "::" + n)) d.remove("3NoteVoicing::" + category + "::" + n);
    if (d.contains("4NoteVoicing::" + category + "::" + n)) d.remove("4NoteVoicing::" + category + "::" + n);
  }

  // Write all currently active states
  for (var i = 0; i < allSpreadButtons.length; i++) {
    if (allSpreadStates[i] === 1) {
      var n = allSpreadButtons[i];
      var category = inversionButtons.indexOf(n) != -1 ? "inversions" : "dropVoicings";

      var data2 = getMapData(n, category, 2);
      var data3 = getMapData(n, category, 3);
      var data4 = getMapData(n, category, 4);

      if (data2) d.replace("2NoteVoicing::" + category + "::" + n, data2);
      if (data3) d.replace("3NoteVoicing::" + category + "::" + n, data3);
      if (data4) d.replace("4NoteVoicing::" + category + "::" + n, data4);
    }
  }
}


function ensurePath(d, parent, child) {
  if (!d.contains(parent)) {
    d.setparse(parent, "{}");
  }
  if (!d.contains(parent + "::" + child)) {
    d.setparse(parent + "::" + child, "{}");
  }
}

function getMapData(name, category, noteCount) {
  if (category === "inversions") {
    if (noteCount === 2) return inversionMap2Note[name];
    else if (noteCount === 3) return inversionMap3Note[name];
    else return inversionMap4Note[name];
  } else {
    if (noteCount === 2) return dropMap2Note[name];
    else if (noteCount === 3) return dropMap3Note[name];
    else return dropMap4Note[name];
  }
}

/*
function getMapData(name, category, noteCount) {
  if (category === "inversions") {
    return (noteCount === 3) ? inversionMap3Note[name] : inversionMap4Note[name];
  } else {
    return (noteCount === 3) ? dropMap3Note[name] : dropMap4Note[name];
  }
}
  */
