inlets = 2;
outlets = 2;

var useSharps = 0; // 0 = flats, 1 = sharps
var lastChord = []; // store the most recent chord input

// Note name arrays
var flatNames  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
var sharpNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Function to convert pitch numbers to note letters
function numbers_to_letters(numbers) {
    var noteNames = useSharps ? sharpNames : flatNames;
    var letters = [];

    for (var i = 0; i < numbers.length; i++) {
        var pitchClass = ((numbers[i] % 12) + 12) % 12; // Handle negatives
        letters.push(noteNames[pitchClass]);
    }

    return letters.join(' ');
}

// --- Inlet 0: incoming list of MIDI note numbers ---
function list() {
    if (inlet === 0) {
        lastChord = arrayfromargs(arguments);
        lastChord.sort(function(a, b) { return a - b; });
        var output = numbers_to_letters(lastChord);
        outlet(0, output);
    }
}

// --- Inlet 1: sharp/flat toggle ---
function msg_int(v) {
    if (inlet === 1) {
        useSharps = v === 1 ? 1 : 0;

        // Re-output last chord if one exists
        if (lastChord.length > 0) {
            var output = numbers_to_letters(lastChord);
            outlet(1, output);
        }
    }

    if (inlet === 0) {
        lastChord = arrayfromargs(arguments);
        lastChord.sort(function(a, b) { return a - b; });
        var output = numbers_to_letters(lastChord);
        outlet(0, output);
    }
}

function reset() {
    outlet(0, "");
}



/*
// Function to convert pitch numbers to note letters
function numbers_to_letters(numbers) {
    var noteNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    var letters = [];
    
    for (var i = 0; i < numbers.length; i++) {
        var pitchClass = ((numbers[i] % 12) + 12) % 12; // Handle negative numbers correctly
        letters.push(noteNames[pitchClass]);
    }
    
    return letters.join(' ');
}

function list() {
	var inputList = arrayfromargs(arguments);
	inputList.sort(function(a, b) { return a - b; });
	outlet(0, numbers_to_letters(inputList));
}
*/