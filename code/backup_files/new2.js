

// ============================================================
// jsui_circle_scale_visualizer.js
// ============================================================

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

var noteNames = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
var NUM = noteNames.length;

var rings = [
  { outer:150, inner:120, rgb:[0.38,0.65,0.98], levels:new Array(NUM), targets:new Array(NUM) }, // scale
  { outer:120, inner:90,  rgb:[0.20,0.83,0.60], levels:new Array(NUM), targets:new Array(NUM) },  // subset
  { outer:90,  inner:60,  rgb:[0.96,0.62,0.05], levels:new Array(NUM), targets:new Array(NUM) }   // chord
];

function resetArrays() {
  for (var r=0;r<rings.length;r++) {
    for (var i=0;i<NUM;i++) {
      rings[r].levels[i]=0.0;
      rings[r].targets[i]=0.0;
    }
  }
}
resetArrays();

var fadeSpeed = 0.25;
var frameMs = 30;
var animTask = new Task(animate);
animTask.interval = frameMs;
animTask.repeat();

function anything() {
  var sel = (messagename||"").toLowerCase();
  var args = arrayfromargs(arguments);
  if (sel==="outer"||sel==="middle"||sel==="inner") handleRingInput(sel,args);
  mgraphics.redraw();
}

function handleRingInput(sel,args) {
  var notes = [];
  if (args.length>1) notes=args;
  else if (args.length===1 && typeof args[0]==="string")
    notes=args[0].trim().split(/\s+/);

  if (sel==="outer")  setTargets(0,notes);
  if (sel==="middle") setTargets(1,notes);
  if (sel==="inner")  setTargets(2,notes);
}

function setTargets(ringIndex,notes) {
  var ring = rings[ringIndex];
  for (var i=0;i<NUM;i++) ring.targets[i]=0.0;
  for (var n=0;n<notes.length;n++) {
    var name = String(notes[n]).trim();
    var idx = noteNames.indexOf(name);
    if (idx!==-1) ring.targets[idx]=1.0;
  }
}

function animate() {
  var changed=false;
  for (var r=0;r<rings.length;r++) {
    var ring=rings[r];
    for (var i=0;i<NUM;i++) {
      var cur=ring.levels[i];
      var tgt=ring.targets[i];
      var diff=tgt-cur;
      if (Math.abs(diff)>0.001) {
        ring.levels[i]=cur+diff*fadeSpeed;
        changed=true;
      } else ring.levels[i]=tgt;
    }
  }
  if (changed) mgraphics.redraw();
}

function paint() {
  var W=mgraphics.size[0], H=mgraphics.size[1];
  mgraphics.translate(W/2,H/2);
  mgraphics.scale(Math.min(W,H)/400, Math.min(W,H)/400);
  mgraphics.set_line_width(1);

  var seg=(2*Math.PI)/NUM;
  var offset=-Math.PI/2;

  for (var r=0;r<rings.length;r++) {
    var ring=rings[r];
    for (var i=0;i<NUM;i++) {
      var a0=offset+i*seg;
      var a1=offset+(i+1)*seg;
      var alpha=0.25+0.75*ring.levels[i];
      mgraphics.new_path();
      mgraphics.arc(0,0,ring.outer,a0,a1);
      mgraphics.line_to(ring.inner*Math.cos(a1),ring.inner*Math.sin(a1));
      mgraphics.arc_negative(0,0,ring.inner,a1,a0);
      mgraphics.close_path();
      mgraphics.set_source_rgba(ring.rgb[0],ring.rgb[1],ring.rgb[2],alpha);
      mgraphics.fill_preserve();
      mgraphics.set_source_rgba(0.05,0.07,0.13,1);
      mgraphics.stroke();
    }
  }

  var labelR = rings[0].outer+18;
  for (var i=0;i<NUM;i++) {
    var a=offset+i*seg+seg/2;
    var x=labelR*Math.cos(a);
    var y=labelR*Math.sin(a);
    var chordLevel=rings[2].levels[i];
    var chordActive=chordLevel>0.6;
    if (chordActive) {
      mgraphics.new_path();
      mgraphics.arc(x,y,14,0,2*Math.PI);
      mgraphics.set_source_rgba(1.0,0.9,0.4,0.25);
      mgraphics.fill();
      mgraphics.select_font_face("Arial Bold");
      mgraphics.set_font_size(26);
      mgraphics.set_source_rgba(0.98,0.76,0.32,1);
    } else {
      mgraphics.select_font_face("Arial");
      mgraphics.set_font_size(20);
      mgraphics.set_source_rgba(0.82,0.84,0.86,1);
    }
    var t=noteNames[i];
    var tw=mgraphics.text_measure(t)[0];
    mgraphics.move_to(x-tw/2,y+4);
    mgraphics.show_text(t);
  }
}
