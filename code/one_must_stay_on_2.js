// ============================================================
// one_must_stay_on_spreads_debug_v5.js
// Keeps at least one button ON in each group (ES3-safe)
// ============================================================

inlets = 1;
outlets = 0;

// --- Groups ---
var inversionButtons = ["inv0", "inv1", "inv2", "inv3"];
var dropButtons = ["no_drop", "drop2", "drop3"];

// --- States ---
var invStates = [1, 0, 0, 0];
var dropStates = [1, 0, 0];

// --- Mapping tables ---
var inversionMap3Note = {
  "inv0": [0, 0, 0],
  "inv1": [0, 0, -12],
  "inv2": [0, -12, -12]
};

var inversionMap4Note = {
  "inv0": [0, 0, 0, 0],
  "inv1": [0, 0, 0, -12],
  "inv2": [0, 0, -12, -12],
  "inv3": [0, -12, -12, -12]
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
  "inv1": [0, -12]
};

var dropMap2Note = {
  "no_drop": [0, 0],
  "drop2": [-12, 0]
};

// ============================================================
// INIT
// ============================================================
function loadbang() {
  post("\n==== one_must_stay_on_spreads_debug_v5.js LOADED ====\n");
  initGroup(inversionButtons, invStates, "inversions");
  initGroup(dropButtons, dropStates, "dropVoicings");
  post("Initial invStates:", JSON.stringify(invStates), "\n");
  post("Initial dropStates:", JSON.stringify(dropStates), "\n");
  updateDict("inv0", "inversions");
  updateDict("no_drop", "dropVoicings");
}

function initGroup(buttons, states, label) {
  for (var i = 0; i < buttons.length; i++) {
    var o = this.patcher.getnamed(buttons[i]);
    var on = (i === 0) ? 1 : 0;
    states[i] = on;
    if (o) o.message("set", on);
    post("Init", label + ":", buttons[i], "=", on, "\n");
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
  post("\n\n--- handleButton ---\n");
  post("Button:", name, "| Value:", val, "\n");

  if (inversionButtons.indexOf(name) != -1)
    updateGroup(name, val, inversionButtons, invStates, "inversions");
  else if (dropButtons.indexOf(name) != -1)
    updateGroup(name, val, dropButtons, dropStates, "dropVoicings");
  else
    post("⚠️ Unknown button name:", name, "\n");
}

function updateGroup(name, val, btns, states, category) {
  post("→ updateGroup:", category, "button", name, "val:", val, "\n");
  var idx = btns.indexOf(name);
  if (idx == -1) {
    post("⚠️ Couldn't find button index for", name, "\n");
    return;
  }

  var newVal = val ? 1 : 0;

  // Count total actives BEFORE change
  var totalActive = 0;
  for (var i = 0; i < states.length; i++) totalActive += states[i];
  post("Active before click:", totalActive, " | States:", JSON.stringify(states), "\n");

  // === Prevent deselecting the last active button ===
  if (totalActive === 1 && newVal === 0 && states[idx] === 1) {
    var o = this.patcher.getnamed(name);
    if (o) {
      o.message("ignoreclick", 1);
      o.message("set", 1);
      o.message("ignoreclick", 0);
    }
    post("⚠️ Attempted to deselect last active in group:", category, "→ prevented!\n");
    return;
  }

  // === Toggle this button normally ===
  states[idx] = newVal;

  post("Updated group states:", JSON.stringify(states), "\n");

  // Update dict with *all* currently active buttons
  updateDictForGroup(btns, states, category);
}


// ============================================================
// DICT UPDATES
// ============================================================
function updateDictForGroup(btns, states, category) {
  post("\n--- updateDictForGroup ---\n");
  post("Category:", category, "\n");

  var d = new Dict("active_options");
  ensurePath(d, "2NoteVoicing::" + category);
  ensurePath(d, "3NoteVoicing::" + category);
  ensurePath(d, "4NoteVoicing::" + category);

  // Clear all existing keys in this category
  for (var i = 0; i < btns.length; i++) {
    var n = btns[i];
    d.remove("2NoteVoicing::" + category + "::" + n);
    d.remove("3NoteVoicing::" + category + "::" + n);
    d.remove("4NoteVoicing::" + category + "::" + n);
  }

  // Write all currently active states
  for (var i = 0; i < btns.length; i++) {
    if (states[i] === 1) {
      var n = btns[i];

      var data2 = getMapData(n, category, 2);
      var data3 = getMapData(n, category, 3);
      var data4 = getMapData(n, category, 4);

      if (data2) d.replace("2NoteVoicing::" + category + "::" + n, data2);
      if (data3) d.replace("3NoteVoicing::" + category + "::" + n, data3);
      if (data4) d.replace("4NoteVoicing::" + category + "::" + n, data4);

      post("✅ Active:", n, "→ added to dict\n");
    }
  }

  post("Dict after update:\n", d.stringify(), "\n");
}


function ensurePath(d, path) {
  if (!d.contains(path)) {
    d.set(path, new Dict());
    post("Created missing path:", path, "\n");
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
