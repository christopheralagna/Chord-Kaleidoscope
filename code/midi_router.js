autowatch = 1;

// Live API for interacting with the Live set
var liveSet = new LiveAPI(callback, "live_set");
liveSet.property = "tracks";

var midioutObj = null;
var trackNames = [];
var trackPaths = [];

// Watch for track list changes
function callback(args) {
    if (args[0] === "tracks") populateMenu();
}

function loadbang() {
    populateMenu();
    // Grab reference to midiout object
    midioutObj = this.patcher.getnamed("midiRouterOut");
}

// Populate umenu with only MIDI tracks
function populateMenu() {
    var count = liveSet.getcount("tracks");
    trackNames = [];
    trackPaths = [];

    for (var i = 0; i < count; i++) {
        var track = new LiveAPI("live_set tracks " + i);
        if (track.get("has_midi_input") == 1 && track.get("has_audio_output") == 1) {
            trackNames.push(track.get("name"));
            trackPaths.push("live_set tracks " + i);
        }
    }

    // Send list to umenu
    var menu = this.patcher.getnamed("trackMenu");
    if (menu) {
        menu.message("clear");
        for (var j = 0; j < trackNames.length; j++) {
            menu.message("append", trackNames[j]);
        }
    }
}

// When user picks a track from umenu
function msg_int(index) {
    if (index < 0 || index >= trackPaths.length) return;

    var selectedTrackPath = trackPaths[index];

    if (midioutObj) {
        midioutObj.message("target", selectedTrackPath);
    }
}

function testnote() {
    if (!midioutObj) {
        return;
    }
    // Middle C note-on, velocity 100
    midioutObj.message(144, 60, 100);
    // Note-off
    midioutObj.message(128, 60, 0);
}
