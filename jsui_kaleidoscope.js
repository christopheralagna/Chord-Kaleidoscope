// jsui_kaleidoscope.js — "Chord Kaleidoscope"
// A pro-quality, aesthetically rich UI for Max for Live
// Preserves original logic: 3 rings (Outer=Scale, Middle=Subset, Inner=Chord)

outlets = 4; // [ "add" <pc> ] or [ "remove" <pc> ]

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

// --------------------------------------------
// Configuration & State
// --------------------------------------------
var noteNamesFlat = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
var noteNamesSharp = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
var noteNames = noteNamesFlat.slice();
var NUM = 12;
var namingMode = 0; // 0 = flats, 1 = sharps

// Visual Configuration
// We keep the logical "rings" structure for state, but render them as shards.
// Radii are used for hit-testing and general layout.
var R_OUTER_MAX = 180;
var R_OUTER_MIN = 135;
var R_MID_MIN = 95;
var R_INNER_MIN = 50;

// Logic state (levels animate 0.0 -> 1.0)
var rings = [
  { name: "outer", levels: new Array(NUM), targets: new Array(NUM) },
  { name: "middle", levels: new Array(NUM), targets: new Array(NUM) },
  { name: "inner", levels: new Array(NUM), targets: new Array(NUM) }
];

function resetArrays() {
  for (var r = 0; r < rings.length; r++) {
    for (var i = 0; i < NUM; i++) {
      rings[r].levels[i] = 0.0;
      rings[r].targets[i] = 0.0;
    }
  }
}
resetArrays();

var fadeSpeed = 0.2; // Slightly slower for smoother glass fade
var frameMs = 33;
var animTask = new Task(animate);
animTask.interval = frameMs;
animTask.repeat();

// Interaction State
var hoverIndex = -1;
var hoverAllowed = false;
var OFFSET = -Math.PI / 2; // "C" at top

// --------------------------------------------
// Logic: Rules & Scales
// --------------------------------------------
function hasConsecutivePCs(list) {
  if (list.length < 3) return false;
  var uniq = [];
  for (var i = 0; i < list.length; i++) if (uniq.indexOf(list[i]) === -1) uniq.push(list[i]);
  uniq.sort(function (a, b) { return a - b; });

  var run = 1;
  for (var i = 1; i < uniq.length; i++) {
    if ((uniq[i] === (uniq[i - 1] + 1))) { run++; if (run >= 3) return true; }
    else if (uniq[i] !== uniq[i - 1]) run = 1;
  }
  // Wraparound check
  if (uniq.indexOf(11) !== -1 && uniq.indexOf(0) !== -1 && (uniq.indexOf(1) !== -1 || uniq.indexOf(10) !== -1)) return true;
  return false;
}

function currentScalePCs() {
  var pcs = [];
  for (var i = 0; i < NUM; i++) if (rings[0].targets[i] > 0.5) pcs.push(i);
  return pcs;
}

function broadcastOuterRingState() {
  var pcs = currentScalePCs().slice();
  pcs.sort(function (a, b) { return a - b; });

  if (pcs.length === 0) {
    outlet(2, "reset");
    outlet(3, "reset");
  } else {
    outlet(2, pcs);
    outlet(3, pcs);
  }
  return pcs;
}

function canAdd(pc) {
  var pcs = currentScalePCs();
  if (pcs.indexOf(pc) !== -1) return true; // already active
  pcs.push(pc);
  return !hasConsecutivePCs(pcs);
}

// --------------------------------------------
// Max Messages
// --------------------------------------------
function anything() {
  var sel = (messagename || "").toLowerCase();
  var args = arrayfromargs(arguments);

  if (sel === "outer" || sel === "middle" || sel === "inner") {
    handleRingInput(sel, args);
  } else if (sel === "type") {
    setType(args[0]);
  } else if (sel === "reset") {
    reset();
  }
  mgraphics.redraw();
}

function reset() {
  var hadNotes = currentScalePCs().length > 0;
  resetArrays();
  hoverIndex = -1;
  hoverAllowed = false;
  if (hadNotes) broadcastOuterRingState();
  mgraphics.redraw();
}

function handleRingInput(sel, args) {
  var notes = [];
  if (args.length > 1) notes = args;
  else if (args.length === 1 && typeof args[0] === "string") notes = args[0].trim().split(/\s+/);

  if (sel === "outer") setTargets(0, notes);
  if (sel === "middle") setTargets(1, notes);
  if (sel === "inner") setTargets(2, notes);
}

function setType(mode) {
  namingMode = parseInt(mode);
  noteNames = (namingMode === 1) ? noteNamesSharp.slice() : noteNamesFlat.slice();
}

function setTargets(ringIndex, notes) {
  var ring = rings[ringIndex];
  var next = new Array(NUM);
  for (var i = 0; i < NUM; i++) next[i] = 0.0;

  for (var n = 0; n < notes.length; n++) {
    var raw = notes[n];
    var idx = -1;
    if (typeof raw === "number" && !isNaN(raw)) {
      idx = ((raw % NUM) + NUM) % NUM;
    } else {
      var name = String(raw).trim();
      idx = noteNames.indexOf(name);
      if (idx === -1) {
        var asInt = parseInt(name, 10);
        if (!isNaN(asInt)) idx = ((asInt % NUM) + NUM) % NUM;
      }
    }
    if (idx !== -1) next[idx] = 1.0;
  }

  var changed = false;
  for (var j = 0; j < NUM; j++) {
    if (ring.targets[j] !== next[j]) changed = true;
    ring.targets[j] = next[j];
  }

  if (ringIndex === 0 && changed) broadcastOuterRingState();
}

function animate() {
  var changed = false;
  for (var r = 0; r < rings.length; r++) {
    var ring = rings[r];
    for (var i = 0; i < NUM; i++) {
      var cur = ring.levels[i];
      var tgt = ring.targets[i];
      var diff = tgt - cur;
      if (Math.abs(diff) > 0.001) {
        ring.levels[i] = cur + diff * fadeSpeed;
        changed = true;
      } else {
        ring.levels[i] = tgt;
      }
    }
  }
  if (changed) mgraphics.redraw();
}

// --------------------------------------------
// Interaction (Hit Testing)
// --------------------------------------------
function worldFromScreen(x, y) {
  var W = mgraphics.size[0], H = mgraphics.size[1];
  var s = Math.min(W, H) / 400; // base scale on 400x400 reference
  return [(x - W / 2) / s, (y - H / 2) / s, s];
}

// Simple radial hit testing works well enough for the kaleidoscope slices
function ringIndexFromRadius(radius) {
  if (radius > R_OUTER_MAX) return -1;
  if (radius > R_OUTER_MIN) return 0; // Outer
  if (radius > R_MID_MIN) return 1; // Middle
  if (radius > R_INNER_MIN) return 2; // Inner
  return -1; // Center hole
}

function noteIndexFromAngle(angle) {
  var seg = (2 * Math.PI) / NUM;
  var a = angle - OFFSET;
  while (a < 0) a += 2 * Math.PI;
  while (a >= 2 * Math.PI) a -= 2 * Math.PI;
  return Math.floor(a / seg);
}

function onidle(x, y, button, cmd, shift, caps, opt, ctrl) {
  var w = worldFromScreen(x, y);
  var lx = w[0], ly = w[1];
  var r = Math.sqrt(lx * lx + ly * ly);
  var a = Math.atan2(ly, lx);

  // We only care about the outer ring for interaction (toggling scale notes)
  // But we allow hovering anywhere in the slice to highlight that slice
  if (r > R_OUTER_MAX || r < R_INNER_MIN) {
    if (hoverIndex !== -1) { hoverIndex = -1; mgraphics.redraw(); }
    return;
  }

  var ni = noteIndexFromAngle(a);
  var allowed = canAdd(ni);
  if (rings[0].targets[ni] > 0.5) allowed = true; // can always remove

  var changed = (hoverIndex !== ni) || (hoverAllowed !== allowed);
  hoverIndex = allowed ? ni : -1;
  hoverAllowed = allowed;
  if (changed) mgraphics.redraw();
}

function onidleout() {
  if (hoverIndex !== -1) { hoverIndex = -1; hoverAllowed = false; mgraphics.redraw(); }
}

function onclick(x, y, button, cmd, shift, caps, opt, ctrl) {
  if (hoverIndex < 0) return;
  var pc = hoverIndex;
  var isOn = rings[0].targets[pc] > 0.5;

  if (isOn) {
    rings[0].targets[pc] = 0.0;
    outlet(0, ["remove", pc]);
  } else {
    if (!canAdd(pc)) return;
    rings[0].targets[pc] = 1.0;
    outlet(0, ["add", pc]);
  }

  var pcs = broadcastOuterRingState();
  var anyOn = pcs.length > 0;
  if (!anyOn) {
    outlet(1, "bang");
    outlet(0, ["resetTracked"]);
  }
  mgraphics.redraw();
}

// --------------------------------------------
// Drawing: The Kaleidoscope
// --------------------------------------------
function paint() {
  var W = mgraphics.size[0], H = mgraphics.size[1];
  var S = Math.min(W, H) / 400;
  mgraphics.translate(W / 2, H / 2);
  mgraphics.scale(S, S);

  // Dark background
  // mgraphics.set_source_rgba(0.05, 0.05, 0.08, 1);
  // mgraphics.paint(); // Fill entire bg if desired, or let Max panel bg show

  var seg = (2 * Math.PI) / NUM;

  // --- Draw Shards ---
  for (var i = 0; i < NUM; i++) {
    var a0 = OFFSET + i * seg;
    var a1 = OFFSET + (i + 1) * seg;
    var am = (a0 + a1) / 2; // mid angle

    // Levels
    var lOuter = rings[0].levels[i];
    var lMid = rings[1].levels[i];
    var lInner = rings[2].levels[i];

    // --- 1. Outer Ring (The Scale) ---
    // Shape: Crystalline wedge
    // Active Color: Cyan/Blue/Purple cool tones
    drawShard(i, a0, a1, R_OUTER_MIN, R_OUTER_MAX, lOuter, [0.2, 0.6, 1.0], 0);

    // --- 2. Middle Ring (The Subset) ---
    // Shape: Interlocking diamond/trapezoid
    // Active Color: Teal/Green/Emerald
    drawShard(i, a0, a1, R_MID_MIN, R_OUTER_MIN, lMid, [0.1, 0.9, 0.6], 1);

    // --- 3. Inner Ring (The Chord) ---
    // Shape: Central star point
    // Active Color: Gold/Orange/Amber
    drawShard(i, a0, a1, R_INNER_MIN, R_MID_MIN, lInner, [1.0, 0.7, 0.2], 2);
  }

  // --- Hover Overlay ---
  if (hoverIndex >= 0) {
    var h0 = OFFSET + hoverIndex * seg;
    var h1 = OFFSET + (hoverIndex + 1) * seg;
    var color = hoverAllowed ? [1, 1, 1, 0.15] : [1, 0, 0, 0.1]; // White glow or red warn

    mgraphics.set_source_rgba(color);
    mgraphics.new_path();
    mgraphics.arc(0, 0, R_OUTER_MAX + 5, h0, h1);
    mgraphics.arc_negative(0, 0, R_INNER_MIN - 5, h1, h0);
    mgraphics.close_path();
    mgraphics.fill();

    // Active border
    mgraphics.set_line_width(2);
    mgraphics.set_source_rgba(hoverAllowed ? [1, 1, 1, 0.5] : [0.8, 0.2, 0.2, 0.5]);
    mgraphics.stroke();
  }

  // --- Labels ---
  drawLabels();
}

function drawShard(idx, a0, a1, rIn, rOut, level, baseRgb, type) {
  // Geometry
  // To make it look "kaleidoscopic", we can inset the corners or add a point
  // For now, let's stick to clean arc segments but with rich gradients.
  // To make it "shard-like", we can slightly modify the path to be straighter or angular.

  var pad = 1.5; // gap between shards
  var r0 = rIn + pad;
  var r1 = rOut - pad;
  var angPad = 0.02; // angular gap
  var th0 = a0 + angPad;
  var th1 = a1 - angPad;

  // Define Path
  mgraphics.new_path();
  // We use arcs for the smooth circular feel, but you could use line_to for polygons
  mgraphics.arc(0, 0, r1, th0, th1);
  mgraphics.arc_negative(0, 0, r0, th1, th0);
  mgraphics.close_path();

  // Fill Style
  var alpha = 0.1 + (0.8 * level); // Dim base, bright active
  if (level < 0.01) alpha = 0.05; // Very faint when off

  // Gradient for "Glass" effect
  // Radial gradient from center of the shard
  var midA = (th0 + th1) / 2;
  var midR = (r0 + r1) / 2;
  var cx = midR * Math.cos(midA);
  var cy = midR * Math.sin(midA);

  var pat = mgraphics.pattern_create_radial(cx, cy, 0, cx, cy, (r1 - r0));

  // Color mixing
  // Off state: dark grey/blue
  // On state: baseRgb
  var r = baseRgb[0], g = baseRgb[1], b = baseRgb[2];

  if (level > 0.01) {
    // Active Gradient
    // Center is bright/white (specular), edge is pure color
    pat.add_color_stop_rgba(0, r + (1 - r) * 0.5, g + (1 - g) * 0.5, b + (1 - b) * 0.5, alpha);
    pat.add_color_stop_rgba(1, r, g, b, alpha * 0.8);
  } else {
    // Inactive "dark glass"
    pat.add_color_stop_rgba(0, 0.2, 0.2, 0.25, 0.1);
    pat.add_color_stop_rgba(1, 0.1, 0.1, 0.15, 0.2);
  }

  mgraphics.set_source(pat);
  mgraphics.fill_preserve();

  // Stroke (Edge highlight)
  if (level > 0.01) {
    mgraphics.set_source_rgba(r, g, b, 0.8);
    mgraphics.set_line_width(1.5);
  } else {
    mgraphics.set_source_rgba(0.3, 0.3, 0.35, 0.3);
    mgraphics.set_line_width(1);
  }
  mgraphics.stroke();
}

function drawLabels() {
  var seg = (2 * Math.PI) / NUM;
  var labelR = R_OUTER_MAX + 20;

  for (var i = 0; i < NUM; i++) {
    var a = OFFSET + i * seg + seg / 2;
    var x = labelR * Math.cos(a);
    var y = labelR * Math.sin(a);

    var chordLevel = rings[2].levels[i]; // Inner ring drives emphasis
    var isChord = chordLevel > 0.5;

    if (isChord) {
      // Glow behind text
      var pat = mgraphics.pattern_create_radial(x, y, 0, x, y, 15);
      pat.add_color_stop_rgba(0, 1, 0.8, 0.4, 0.6);
      pat.add_color_stop_rgba(1, 1, 0.8, 0.4, 0.0);
      mgraphics.set_source(pat);
      mgraphics.rectangle(x - 15, y - 15, 30, 30);
      mgraphics.fill();

      mgraphics.select_font_face("Arial Bold");
      mgraphics.set_font_size(24);
      mgraphics.set_source_rgba(1, 1, 1, 1);
    } else {
      mgraphics.select_font_face("Arial");
      mgraphics.set_font_size(18);
      mgraphics.set_source_rgba(0.6, 0.6, 0.7, 0.8);
    }

    var t = noteNames[i];
    var tw = mgraphics.text_measure(t)[0];
    var th = mgraphics.text_measure(t)[1];
    mgraphics.move_to(x - tw / 2, y + th / 3);
    mgraphics.show_text(t);
  }
}
