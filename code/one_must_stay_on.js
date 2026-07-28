//one_must_stay_on.js

inlets = 2;  // 0 = button events, 1 = mode changes
outlets = 1; // ["set", name, notes...] or ["remove", name]

// --- Mode → allowed shapes ---
/*
var groupsByMode = {
  0: ["cluster1","cluster2","cluster3"],
  1: ["triad","sus2","sus4","quartal","cluster1","cluster2","cluster3","triad+2","triad+4","7th","7thsus4"],
  2: ["triad","sus2","sus4","quartal","cluster1","cluster2","cluster3","triad+2","triad+4"],
  3: ["triad","sus2","sus4","quartal","cluster1","cluster2","cluster3","triad+2","triad+4","7th","7thsus4"],
  4: ["triad","sus2","sus4","quartal","cluster1","cluster2","cluster3","triad+2","triad+4","7th","7thsus4","special1","special2"]
};

// --- Button list ---
var buttons = [
  "triad","sus2","sus4","quartal",
  "cluster1","cluster2","cluster3",
  "triad+2","triad+4","7th","7thsus4",
  "special1","special2"
];
*/

var groupsByMode = {
  0: ["cluster1","cluster2","cluster3","interval2","interval3"],
  1: ["triad","sus2","sus4","quartal","cluster1","cluster2","cluster3",
      "triad+2","triad+4","7th","7thsus4","interval2","interval3","interval4"],
  2: ["triad","sus2","sus4","quartal","cluster1","cluster2","cluster3",
      "triad+2","triad+4","interval2","interval3","interval4","interval5"],
  3: ["triad","sus2","sus4","quartal","cluster1","cluster2","cluster3",
      "triad+2","triad+4","7th","7thsus4","interval2","interval3","interval4","interval5","interval6"],
  4: ["triad","sus2","sus4","quartal","cluster1","cluster2","cluster3",
      "triad+2","triad+4","7th","7thsus4","special1","special2",
      "interval2","interval3","interval4","interval5","interval6","interval7"]
};

var buttons = [
  "triad","sus2","sus4","quartal",
  "cluster1","cluster2","cluster3",
  "triad+2","triad+4","7th","7thsus4",
  "special1","special2",
  "interval2","interval3","interval4","interval5","interval6","interval7"
];

// --- Chord mappings ---

var chordMap = {
  "triad": [2,4],
  "sus2": [1,4],
  "sus4": [3,4],
  "quartal": [3,6],
  "cluster1": [1,2],
  "cluster2": [2,3],
  "cluster3": [1,3],
  "triad+2": [1,2,4],
  "triad+4": [2,3,4],
  "7th": [2,4,6],
  "7thsus4": [3,4,6],
  "special1": [2,4,7],
  "special2": [2,5,7],
  // 2-Note Voicings (Intervals)
  "interval2": [1],  // 2nd
  "interval3": [2],  // 3rd
  "interval4": [3],  // 4th
  "interval5": [4],  // 5th
  "interval6": [5],  // 6th
  "interval7": [6]   // 7th
};

// --- States array ---
var states = [];

// ===== INIT =====
function loadbang() {
  resetStates();
}

function resetStates() {
  states = [];
  for (var i = 0; i < buttons.length; i++) {
    states.push(0);
  }

  // Default: first button ON
  for (var i = 0; i < buttons.length; i++) {
    var o = this.patcher.getnamed(buttons[i]);
    if (o) o.message("set", i == 0 ? 1 : 0);
    states[i] = (i == 0) ? 1 : 0;
  }

  var notes = chordMap[buttons[0]] || [];
  outlet(0, ["set", buttons[0]].concat(notes));
}

// ===== INPUT HANDLERS =====
function list() {
  var a = arrayfromargs(arguments);
  handleButton(a[0], parseInt(a[1]));
}

function anything() {
  handleButton(messagename, parseInt(arguments[0]));
}

function handleButton(name, val) {
  if (!states || states.length == 0) resetStates();

  var idx = buttons.indexOf(name);
  if (idx == -1) return;

  var newVal = val ? 1 : 0;

  var totalActive = 0;
  for (var i = 0; i < states.length; i++) totalActive += states[i];

  // Prevent turning off the last active
  if (totalActive == 1 && newVal == 0) {
    var o = this.patcher.getnamed(name);
    if (o) {
      o.message("ignoreclick", 1);
      o.message("set", 1);
      o.message("ignoreclick", 0);
    }
    return;
  }

  // Apply new state
  states[idx] = newVal;

  // Output
  if (newVal == 1) {
    var notes = chordMap[name] || [];
    outlet(0, ["set", name].concat(notes));
  } else {
    outlet(0, ["remove", name]);
  }
}

// ===== MODE CHANGES =====
function msg_int(mode) {
  post("hello");
  if (inlet != 1) return;
  if (!states || states.length == 0) resetStates();

  var allowed = groupsByMode[mode] || [];

  // Disable disallowed
  for (var i = 0; i < buttons.length; i++) {
    var name = buttons[i];
    var o = this.patcher.getnamed(name);
    post(o);
    if (!o) continue;

    var allowedHere = (allowed.indexOf(name) != -1);
    if (!allowedHere) {
      post("removing", name, "/n");
      outlet(0, ["remove", name]);
      o.message("set", 0);
      o.message("active", 0);
      o.message("ignoreclick", 1);
      states[i] = 0;
    } else {
      o.message("active", 1);
      o.message("ignoreclick", 0);
    }
  }

  // Ensure at least one allowed is active
  var activeCount = 0;
  for (var i = 0; i < states.length; i++) activeCount += states[i];

  if (activeCount == 0 && allowed.length > 0) {
    var fb = allowed[0];
    var idx = buttons.indexOf(fb);
    if (idx != -1) {
      states[idx] = 1;
      var o2 = this.patcher.getnamed(fb);
      if (o2) o2.message("set", 1);
      var notes = chordMap[fb] || [];
      outlet(0, ["set", fb].concat(notes));
    }
  }
}
