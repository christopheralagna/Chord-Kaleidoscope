
// jsui_circle_scale_visualizer.js  — hover+click note toggling
outlets = 4; // [ "add" <pc> ] or [ "remove" <pc> ]

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

// --------------------------------------------
// Note names (flat vs sharp)
// --------------------------------------------
var noteNamesFlat  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
var noteNamesSharp = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
var noteNames = noteNamesFlat.slice(); // default mode = flats
var NUM = noteNames.length;
var namingMode = 0; // 0 = flats, 1 = sharps

// --------------------------------------------
var rings = [
  { outer:150, inner:120, rgb:[0.38,0.65,0.98], levels:new Array(NUM), targets:new Array(NUM) }, // outer (scale / tracked notes)
  { outer:120, inner: 90,  rgb:[0.20,0.83,0.60], levels:new Array(NUM), targets:new Array(NUM) }, // middle (subset)
  { outer: 90, inner: 60,  rgb:[0.96,0.62,0.05], levels:new Array(NUM), targets:new Array(NUM) }  // inner (chord)
];

function resetArrays() { for (var r=0;r<rings.length;r++){ for (var i=0;i<NUM;i++){ rings[r].levels[i]=0.0; rings[r].targets[i]=0.0; } } }
resetArrays();

var fadeSpeed = 0.25;
var frameMs   = 30;
var animTask  = new Task(animate);
animTask.interval = frameMs;
animTask.repeat();

// ---------- NEW: hover/click state ----------
var hoverIndex = -1;         // note index under mouse, or -1
var hoverAllowed = false;    // whether clicking this note would be valid
var OFFSET = -Math.PI/2;     // aligns "C" to top like your painter

// ---------- NEW: rule check (no 3 consecutive) ----------
function hasConsecutivePCs(list) {
  if (list.length < 3) return false;
  // dedupe + sort
  var uniq = []; for (var i=0;i<list.length;i++) if (uniq.indexOf(list[i])==-1) uniq.push(list[i]);
  uniq.sort(function(a,b){return a-b;});

  var run=1;
  for (var i=1;i<uniq.length;i++){
    if ((uniq[i] === (uniq[i-1]+1))) { run++; if (run>=3) return true; }
    else if (uniq[i] !== uniq[i-1]) run=1;
  }
  // wraparound runs: 10-11-0 and 11-0-1
  if (uniq.indexOf(11)!=-1 && uniq.indexOf(0)!=-1 && (uniq.indexOf(1)!=-1 || uniq.indexOf(10)!=-1)) return true;
  return false;
}
function currentScalePCs() {
  var pcs = [];
  for (var i=0;i<NUM;i++) if (rings[0].targets[i] > 0.5) pcs.push(i);
  return pcs;
}

function broadcastOuterRingState(){
  var pcs = currentScalePCs().slice();
  pcs.sort(function(a,b){ return a - b; });

  if (pcs.length === 0) {
    outlet(2, "reset");
    outlet(3, "reset");
  } else {
    outlet(2, pcs);
    outlet(3, pcs);
  }

  return pcs;
}
function canAdd(pc){
  var pcs = currentScalePCs();
  if (pcs.indexOf(pc) !== -1) return true; // already there (click would remove; hover should still show)
  pcs.push(pc);
  return !hasConsecutivePCs(pcs);
}

// ---------- Message Handling ----------
function anything() {
  var sel = (messagename||"").toLowerCase();
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
  post("🔄 Visualization reset — all rings cleared.\n");
}

// Handles both "outer A B D E" and "outer 'A B D E'"
function handleRingInput(sel, args) {
  var notes = [];
  if (args.length > 1) notes = args;
  else if (args.length === 1 && typeof args[0] === "string") notes = args[0].trim().split(/\s+/);

  if (sel === "outer")  setTargets(0, notes);
  if (sel === "middle") setTargets(1, notes);
  if (sel === "inner")  setTargets(2, notes);
}

function setType(mode) {
  namingMode = parseInt(mode);
  noteNames = (namingMode === 1) ? noteNamesSharp.slice() : noteNamesFlat.slice();
}

// Set targets for each ring
function setTargets(ringIndex, notes) {
  var ring = rings[ringIndex];
  var next = new Array(NUM);
  for (var i=0;i<NUM;i++) next[i] = 0.0;

  for (var n=0; n<notes.length; n++) {
    var raw = notes[n];
    var idx = -1;

    if (typeof raw === "number" && !isNaN(raw)) {
      idx = ((raw % NUM) + NUM) % NUM; // accept direct pitch classes
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
  for (var j=0; j<NUM; j++) {
    if (ring.targets[j] !== next[j]) changed = true;
    ring.targets[j] = next[j];
  }

  if (ringIndex === 0 && changed) broadcastOuterRingState();
}

// ---------- Animation ----------
function animate() {
  var changed = false;
  for (var r=0; r<rings.length; r++) {
    var ring = rings[r];
    for (var i=0; i<NUM; i++) {
      var cur = ring.levels[i];
      var tgt = ring.targets[i];
      var diff = tgt - cur;
      if (Math.abs(diff) > 0.001) { ring.levels[i] = cur + diff * fadeSpeed; changed = true; }
      else { ring.levels[i] = tgt; }
    }
  }
  if (changed) mgraphics.redraw();
}

// ---------- Hit-testing & mouse events (NEW) ----------
function worldFromScreen(x,y){
  var W = mgraphics.size[0], H = mgraphics.size[1];
  var s = Math.min(W,H)/400;
  return [(x - W/2)/s, (y - H/2)/s, s];
}
function ringIndexFromRadius(radius){
  for (var r=0;r<rings.length;r++){
    if (radius <= rings[r].outer && radius >= rings[r].inner) return r;
  }
  return -1;
}
function noteIndexFromAngle(angle){ // 0..NUM-1
  var seg = (2*Math.PI)/NUM;
  var a = angle - OFFSET;
  while (a < 0) a += 2*Math.PI;
  while (a >= 2*Math.PI) a -= 2*Math.PI;
  return Math.floor(a / seg);
}

function onidle(x, y, button, cmd, shift, caps, opt, ctrl){
  var w = worldFromScreen(x,y);
  var lx = w[0], ly = w[1];
  var r = Math.sqrt(lx*lx + ly*ly);
  var a = Math.atan2(ly, lx);
  var ri = ringIndexFromRadius(r);
  if (ri === -1){ if (hoverIndex !== -1){ hoverIndex = -1; mgraphics.redraw(); } return; }

  var ni = noteIndexFromAngle(a);
  var allowed = canAdd(ni);
  // if the note is already in the scale we allow hover (for removal)
  if (rings[0].targets[ni] > 0.5) allowed = true;

  var changed = (hoverIndex !== ni) || (hoverAllowed !== allowed);
  hoverIndex = allowed ? ni : -1;
  hoverAllowed = allowed;
  if (changed) mgraphics.redraw();
}
function onidleout(){ if (hoverIndex !== -1){ hoverIndex = -1; hoverAllowed = false; mgraphics.redraw(); } }

function onclick(x, y, button, cmd, shift, caps, opt, ctrl){
  if (hoverIndex < 0) return;
  var pc = hoverIndex;
  var isOn = rings[0].targets[pc] > 0.5;

  if (isOn){
      rings[0].targets[pc] = 0.0;
      outlet(0, ["remove", pc]);
  } else {
      if (!canAdd(pc)) return;
      rings[0].targets[pc] = 1.0;
      outlet(0, ["add", pc]);
  }

  // 🟢 NEW: immediately send the updated scale (sorted list of PCs)
  var pcs = broadcastOuterRingState();

  // ✅ Existing: check if any notes still active
  var anyOn = pcs.length > 0;
  if (!anyOn) {
      outlet(1, "bang");
      outlet(0, ["resetTracked"]);
  }

  mgraphics.redraw();
}


// ---------- Drawing ----------
function paint() {
  var W = mgraphics.size[0], H = mgraphics.size[1];
  mgraphics.translate(W/2, H/2);
  mgraphics.scale(Math.min(W,H)/400, Math.min(W,H)/400);
  mgraphics.set_line_width(1);

  var seg = (2*Math.PI)/NUM;

  // Draw rings
  for (var r=0; r<rings.length; r++) {
    var ring = rings[r];
    for (var i=0; i<NUM; i++) {
      var a0 = OFFSET + i*seg;
      var a1 = OFFSET + (i+1)*seg;

      var alpha = 0.25 + 0.75 * ring.levels[i];
      mgraphics.new_path();
      mgraphics.arc(0,0, ring.outer, a0, a1);
      mgraphics.line_to(ring.inner*Math.cos(a1), ring.inner*Math.sin(a1));
      mgraphics.arc_negative(0,0, ring.inner, a1, a0);
      mgraphics.close_path();

      mgraphics.set_source_rgba(ring.rgb[0], ring.rgb[1], ring.rgb[2], alpha);
      mgraphics.fill_preserve();
      mgraphics.set_source_rgba(0.05,0.07,0.13,1);
      mgraphics.stroke();
    }
  }

  // ---------- NEW: unified hover outline across all three rings ----------
  if (hoverIndex >= 0){
    var a0 = OFFSET + hoverIndex*seg;
    var a1 = OFFSET + (hoverIndex+1)*seg;
    var glowRGBA = hoverAllowed ? [0.98, 0.76, 0.32, 1.0] : [0.6,0.6,0.6,0.6]; // golden if allowed, grey if not

    // Draw a thick outer “band” that spans innermost to outermost ring edges
    var inner = rings[2].inner; // smallest inner
    var outer = rings[0].outer; // largest outer

    // soft halo
    mgraphics.new_path();
    mgraphics.arc(0,0, outer+6, a0, a1);
    mgraphics.line_to((inner-6)*Math.cos(a1), (inner-6)*Math.sin(a1));
    mgraphics.arc_negative(0,0, inner-6, a1, a0);
    mgraphics.close_path();
    mgraphics.set_source_rgba(glowRGBA[0], glowRGBA[1], glowRGBA[2], 0.15);
    mgraphics.fill();

    // crisp border
    mgraphics.set_line_width(3.5);
    mgraphics.set_source_rgba(glowRGBA[0], glowRGBA[1], glowRGBA[2], glowRGBA[3]);
    mgraphics.new_path(); mgraphics.arc(0,0, outer+1.5, a0, a1); mgraphics.stroke();
    mgraphics.new_path(); mgraphics.arc(0,0, inner-1.5, a0, a1); mgraphics.stroke();
    mgraphics.set_line_width(1);
  }

  // Labels (same as before; inner ring drives emphasis)
  for (var i=0;i<NUM;i++) {
    var a = OFFSET + i*seg + seg/2;
    var labelR = rings[0].outer + 18;
    var x = labelR*Math.cos(a);
    var y = labelR*Math.sin(a);

    var chordLevel = rings[2].levels[i];
    var chordActive = chordLevel > 0.6;

    if (chordActive) {
      var glowSize = 14;
      mgraphics.new_path();
      mgraphics.arc(x, y, glowSize, 0, 2*Math.PI);
      mgraphics.set_source_rgba(1.0, 0.9, 0.4, 0.25);
      mgraphics.fill();
      mgraphics.select_font_face("Arial Bold");
      mgraphics.set_font_size(26);
      mgraphics.set_source_rgba(0.98, 0.76, 0.32, 1);
    } else {
      mgraphics.select_font_face("Arial");
      mgraphics.set_font_size(20);
      mgraphics.set_source_rgba(0.82,0.84,0.86,1);
    }
    var t = noteNames[i];
    var tw = mgraphics.text_measure(t)[0];
    mgraphics.move_to(x - tw/2, y + 4);
    mgraphics.show_text(t);
  }
}


/*
// jsui_circle_scale_visualizer.js
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

// --------------------------------------------
// Note names (flat vs sharp)
// --------------------------------------------
var noteNamesFlat  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
var noteNamesSharp = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
var noteNames = noteNamesFlat.slice(); // default mode = flats
var NUM = noteNames.length;
var namingMode = 0; // 0 = flats, 1 = sharps

// --------------------------------------------
var rings = [
  { outer:150, inner:120, rgb:[0.38,0.65,0.98], levels:new Array(NUM), targets:new Array(NUM) }, // outer (scale)
  { outer:120, inner: 90,  rgb:[0.20,0.83,0.60], levels:new Array(NUM), targets:new Array(NUM) }, // middle (subset)
  { outer: 90, inner: 60,  rgb:[0.96,0.62,0.05], levels:new Array(NUM), targets:new Array(NUM) }  // inner (chord)
];

function resetArrays() {
  for (var r=0; r<rings.length; r++) {
    for (var i=0; i<NUM; i++) {
      rings[r].levels[i]  = 0.0;
      rings[r].targets[i] = 0.0;
    }
  }
}
resetArrays();

var fadeSpeed = 0.25;
var frameMs   = 30;
var animTask  = new Task(animate);
animTask.interval = frameMs;
animTask.repeat();

// --------------------------------------------
// Message Handling
// --------------------------------------------
function anything() {
  var sel = (messagename||"").toLowerCase();
  var args = arrayfromargs(arguments);

  if (sel === "outer" || sel === "middle" || sel === "inner") {
    handleRingInput(sel, args);
  } else if (sel === "type") {
    setType(args[0]);
  }

  mgraphics.redraw();
}

function reset() {
  resetArrays();
  mgraphics.redraw();
  post("🔄 Visualization reset — all rings cleared.\n");
}

// Handles both "outer A B D E" and "outer 'A B D E'"
function handleRingInput(sel, args) {
  var notes = [];

  // Case 1: multiple arguments
  if (args.length > 1) {
    notes = args;
  }
  // Case 2: single space-delimited string
  else if (args.length === 1 && typeof args[0] === "string") {
    notes = args[0].trim().split(/\s+/);
  }

  if (sel === "outer")  setTargets(0, notes);
  if (sel === "middle") setTargets(1, notes);
  if (sel === "inner")  setTargets(2, notes);
}

function setType(mode) {
  namingMode = parseInt(mode);
  if (namingMode === 1) noteNames = noteNamesSharp.slice();
  else noteNames = noteNamesFlat.slice();
}

// Set targets for each ring
function setTargets(ringIndex, notes) {
  var ring = rings[ringIndex];
  for (var i=0;i<NUM;i++) ring.targets[i] = 0.0;
  for (var n=0; n<notes.length; n++) {
    var name = String(notes[n]).trim();
    var idx = noteNames.indexOf(name);
    if (idx !== -1) ring.targets[idx] = 1.0;
  }
}

// --------------------------------------------
// Animation
// --------------------------------------------
function animate() {
  var changed = false;
  for (var r=0; r<rings.length; r++) {
    var ring = rings[r];
    for (var i=0; i<NUM; i++) {
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
// Drawing
// --------------------------------------------
function paint() {
  var W = mgraphics.size[0], H = mgraphics.size[1];
  mgraphics.translate(W/2, H/2);
  mgraphics.scale(Math.min(W,H)/400, Math.min(W,H)/400);
  mgraphics.set_line_width(1);

  var seg = (2*Math.PI)/NUM;
  var offset = -Math.PI/2;

  // Draw rings
  for (var r=0; r<rings.length; r++) {
    var ring = rings[r];
    for (var i=0; i<NUM; i++) {
      var a0 = offset + i*seg;
      var a1 = offset + (i+1)*seg;

      var alpha = 0.25 + 0.75 * ring.levels[i];
      mgraphics.new_path();
      mgraphics.arc(0,0, ring.outer, a0, a1);
      mgraphics.line_to(ring.inner*Math.cos(a1), ring.inner*Math.sin(a1));
      mgraphics.arc_negative(0,0, ring.inner, a1, a0);
      mgraphics.close_path();

      mgraphics.set_source_rgba(ring.rgb[0], ring.rgb[1], ring.rgb[2], alpha);
      mgraphics.fill_preserve();
      mgraphics.set_source_rgba(0.05,0.07,0.13,1);
      mgraphics.stroke();
    }
  }

  // Labels light up based on INNER ring (chord)
  var labelR = rings[0].outer + 18;
  for (var i=0;i<NUM;i++) {
    var a = offset + i*seg + seg/2;
    var x = labelR*Math.cos(a);
    var y = labelR*Math.sin(a);

    // focus only on inner ring (ring index 2)
    var chordLevel = rings[2].levels[i];
    var chordActive = chordLevel > 0.6; // threshold for glowing note

    if (chordActive) {
      // soft glow halo
      var glowSize = 14;
      mgraphics.new_path();
      mgraphics.arc(x, y, glowSize, 0, 2*Math.PI);
      mgraphics.set_source_rgba(1.0, 0.9, 0.4, 0.25);
      mgraphics.fill();

      // bold + golden text
      mgraphics.select_font_face("Arial Bold");
      mgraphics.set_font_size(26);
      mgraphics.set_source_rgba(0.98, 0.76, 0.32, 1);
    } else {
      mgraphics.select_font_face("Arial");
      mgraphics.set_font_size(20);
      mgraphics.set_source_rgba(0.82,0.84,0.86,1);
    }

    var t = noteNames[i];
    var tw = mgraphics.text_measure(t)[0];
    mgraphics.move_to(x - tw/2, y + 4);
    mgraphics.show_text(t);
  }
}
*/
