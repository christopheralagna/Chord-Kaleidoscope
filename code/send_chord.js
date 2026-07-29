inlets = 3;

var currentChordDict = new Dict("current_chord"); // Load the dictionary
var generateModeDict = new Dict("generate_mode"); // global settings dict
var defaultVelocity = 50;

// Silence the previous chord by sending note-off messages if pitches exist
function silencePreviousChord() {
    var previousMidiPitches = currentChordDict.get("pitches");

    for (var i = 0; i < previousMidiPitches.length; i++) {
        var midiContainer = [];
        midiContainer.push(previousMidiPitches[i]); // Add pitch
        midiContainer.push(0); // Velocity 0 for note-off
        outlet(0, midiContainer); // Send note-off message
    } 
}

// Update the current chord in the dictionary
function updateMidiChord(midiPitches) {
    currentChordDict.set("pitches", midiPitches); // Update pitches
}

// Format pitches into MIDI notes with velocities
function formatMidiChord(midiPitches) {
    var velocities = currentChordDict.get("velocities") || []; // Get velocities or fallback to empty array
    var midiNotes = [];

    for (var i = 0; i < midiPitches.length; i++) {
        var midiContainer = [];
        midiContainer.push(midiPitches[i]); // Add pitch

        // Use the corresponding velocity or default to 40
        var velocity = velocities[i] !== undefined ? velocities[i] : defaultVelocity;
        midiContainer.push(velocity);
        midiNotes.push(midiContainer);
    }
    return midiNotes; // Return formatted MIDI notes
}

// Send MIDI notes to the output
function sendMidiChord(midiNotes) {
    for (var i = 0; i < midiNotes.length; i++) {
        outlet(0, midiNotes[i]); // Send each note
    }
}

// Handle incoming list of pitches
function list() {
	var generateMode = generateModeDict.get("generateMode");
	var triggered = generateModeDict.get("triggered");
	
	if (generateMode != 'none') { // if generate mode is NOT 'none', send the chord through.
    	var midiPitches = arrayfromargs(arguments);

    	// Silence any previous chord before playing new one
    	silenceIfNeeded();

    	// Update and send new chord
    	updateMidiChord(midiPitches);
    	sendMidiChord(formatMidiChord(midiPitches));
	}
	
	if (generateMode == 'none' && triggered == 'true') {
		
		//reset generateModeDict triggered to "false"
		generateModeDict.set("triggered", "false");
		
		var midiPitches = arrayfromargs(arguments);

    	// Silence any previous chord before playing new one
    	silenceIfNeeded();

    	// Update and send new chord
    	updateMidiChord(midiPitches);
    	sendMidiChord(formatMidiChord(midiPitches));
	}
}

function msg_int(v) {
    if (inlet === 1) {
        defaultVelocity = v;
    }
}

/*
// Handle bangs from various inlets
function bang() {
    var previousMidiPitches = currentChordDict.get("pitches") || [];

    if (inlet === 1) {
        silencePreviousChord(); // explicit silence trigger
    } 
    else if (inlet === 2 && previousMidiPitches.length > 0) {
        // retrigger previous chord
        silencePreviousChord();
        sendMidiChord(formatMidiChord(previousMidiPitches));
    }
}
*/



// Utility — silence current chord only if one exists
function silenceIfNeeded() {
    var previous = currentChordDict.get("pitches") || [];
    if (previous.length > 0) silencePreviousChord();
}

