
//create_chord.js
// This function creates a chord based on the provided scale and voicing
function createChord(scale, voicing) {
    var scaleLength = scale.length; // Length of the scale
    var randomRootNote = Math.floor(Math.random() * scaleLength); // Random root index

    // Initialize an empty array for the chord
    var chord = [];

    // Calculate chord notes dynamically based on voicing
    for (var i = 0; i < voicing.length; i++) {
        var offset = voicing[i];  // voicing[i] = 2, for example
        var noteIndex = randomRootNote + offset; // Calculate the note index
        var wrappedNote = scale[noteIndex % scaleLength]; // Wrap around the scale

        // Adjust octave if the note index exceeds the scale length
        if (noteIndex >= scaleLength) {
            wrappedNote += 12;  // Add an octave if wrapped
        }

        // Add the wrapped note to the chord
        chord.push(wrappedNote);
    }

    // Add the root note to the beginning of the chord
    chord.unshift(scale[randomRootNote]);

    return chord; // Return the final chord
}


// This function processes the incoming dictionary and generates the chord

function anything() {
    var params = new Dict("selected_params");
    var scale = params.get("scale");
    var voicing = params.get("voicing");

    // ✅ Normalize voicing
    if (typeof voicing === "number") {
        voicing = [voicing];
    } else if (voicing && voicing.length && typeof voicing[0] === "number") {
        // already array
    } else if (voicing && voicing.toString().indexOf(",") !== -1) {
        voicing = voicing.toString().split(",").map(function (v) { return parseInt(v, 10); });
    } else {
        voicing = [0];
    }

    if (scale && voicing) {
        var chord = createChord(scale, voicing);
        outlet(0, chord);
    } else {
    }
}
