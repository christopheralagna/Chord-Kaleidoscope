
/*
scale = [0,2,4,5,7,9,11]; // Major scale
var chord = [0,4,7,11]; // Major 7th chord
var octave = [3,3,3,3]; // the octave of each note in the chord
var chordAndOctave = [chord, octave];

function voiceLead(chord, octave, scale) {
    var newChord = [];
    for (var i = 0; i < chord.length; i++) {
        var currentNote = chord[i]; 
        var currentNoteIndex = scale.indexOf(currentNote);
        // randomize the direction of the voice leading. Choose to move up 1 step, down one step, or stay the same
        var direction = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        var nextNoteIndex = currentNoteIndex + direction;
        if (nextNoteIndex < 0) { // if the next note is below the scale
            nextNoteIndex = scale.length + nextNoteIndex; // wrap around to the top of the scale
            octave[i]--; // decrease the octave of the note
        }
        if (nextNoteIndex >= scale.length) { // if the next note is above the scale
            nextNoteIndex = nextNoteIndex - scale.length; // wrap around to the bottom of the scale
            octave[i]++; // increase the octave of the note
        }
        for (var j = 0; j < newChord.length; j++) {
            if (scale[nextNoteIndex] === newChord[j]) { // if the new note is already in the chord
                if (direction === 1) { // if the direction is up
                    while (scale[nextNoteIndex] === newChord[j]) { // keep moving up until the note is not in the chord
                        nextNoteIndex++; // move to the next note in the scale
                    }
                }
                if (direction === -1) { // if the direction is down  
                    while (scale[nextNoteIndex] === newChord[j]) { // keep moving down until the note is not in the chord   
                        nextNoteIndex--; // move to the previous note in the scale
                    }
                }
                if (direction === 0) { 
                    nextNoteIndex = currentNoteIndex; // stay on the same note
                }
            }
        }
        newChord.push(scale[nextNoteIndex]);
    }
    return [newChord, octave];
}

for (var i = 0; i < 10; i++) {
    chord = chordAndOctave[0];
    octave = chordAndOctave[1];
    chordAndOctave = voiceLead(chord, octave, scale);
}

*/

/*

// Major scale definition
const scale = [0, 2, 4, 5, 7, 9, 11]; // Major scale intervals
let chord = [0, 4, 7, 11]; // Major 7th chord (root, 3rd, 5th, 7th)
let octave = [3, 3, 3, 3]; // Starting octave for each note in the chord

function voiceLead(chord, octave, scale) {
    const newChord = [];
    const newOctave = [...octave]; // Clone the octave array to modify safely

    for (let i = 0; i < chord.length; i++) {
        const currentNote = chord[i];
        const currentNoteIndex = scale.indexOf(currentNote);

        if (currentNoteIndex === -1) {
            return [chord, octave];
        }

        // Randomize direction: -1 (down), 0 (stay), or 1 (up)
        let direction = Math.floor(Math.random() * 3) - 1;

        // Compute the next note index
        let nextNoteIndex = currentNoteIndex + direction;

        // Handle wrapping and octave adjustments
        if (nextNoteIndex < 0) {
            nextNoteIndex += scale.length; // Wrap around to the top
            newOctave[i]--; // Decrease the octave
        } else if (nextNoteIndex >= scale.length) {
            nextNoteIndex -= scale.length; // Wrap around to the bottom
            newOctave[i]++; // Increase the octave
        }

        // Ensure no duplicate notes in the new chord
        let nextNote = scale[nextNoteIndex];
        while (newChord.includes(nextNote)) {
            // Adjust direction to avoid duplicates
            direction = direction === 0 ? 1 : -direction; // Flip or move up
            nextNoteIndex = (nextNoteIndex + direction + scale.length) % scale.length;
            nextNote = scale[nextNoteIndex];

            // Adjust octave for wrapping
            if (direction === 1 && nextNoteIndex === 0) {
                newOctave[i]++;
            } else if (direction === -1 && nextNoteIndex === scale.length - 1) {
                newOctave[i]--;
            }
        }

        newChord.push(nextNote);
    }

    return [newChord, newOctave];
}

// Simulate voice leading over multiple iterations
for (let i = 0; i < 10; i++) {
    [chord, octave] = voiceLead(chord, octave, scale);
}

*/

/*
// Major scale definition
const scale = [0, 2, 4, 5, 7, 9, 11]; // Major scale intervals
let chord = [0, 4, 7, 11]; // Major 7th chord (root, 3rd, 5th, 7th)
let octave = [3, 3, 3, 3]; // Starting octave for each note in the chord

function voiceLead(chord, octave, scale) {
    const newChord = [];
    const newOctave = [...octave]; // Clone the octave array to modify safely

    for (let i = 0; i < chord.length; i++) {
        const currentNote = chord[i];
        const currentNoteIndex = scale.indexOf(currentNote);

        if (currentNoteIndex === -1) {
            return [chord, octave];
        }

        // Randomize direction: -1 (down), 0 (stay), or 1 (up)
        let direction = Math.floor(Math.random() * 3) - 1;

        // Compute the next note index
        let nextNoteIndex = currentNoteIndex + direction;

        // Handle wrapping and octave adjustments
        if (nextNoteIndex < 0) {
            nextNoteIndex += scale.length; // Wrap around to the top
            newOctave[i]--; // Decrease the octave
        } else if (nextNoteIndex >= scale.length) {
            nextNoteIndex -= scale.length; // Wrap around to the bottom
            newOctave[i]++; // Increase the octave
        }

        // Ensure no duplicate notes in the new chord
        let nextNote = scale[nextNoteIndex];
        let attempts = 0; // Add an attempt counter
        const maxAttempts = scale.length * 2; // Set a reasonable limit for attempts

        while (newChord.includes(nextNote) && attempts < maxAttempts) {
            // Adjust direction to avoid duplicates
            direction = direction === 0 ? 1 : -direction; // Flip or move up
            nextNoteIndex = (nextNoteIndex + direction + scale.length) % scale.length;
            nextNote = scale[nextNoteIndex];

            // Adjust octave for wrapping
            if (direction === 1 && nextNoteIndex === 0) {
                newOctave[i]++;
            } else if (direction === -1 && nextNoteIndex === scale.length - 1) {
                newOctave[i]--;
            }

            attempts++;
        }

        // If we exceed max attempts, force a unique note
        if (attempts >= maxAttempts) {
            for (let j = 0; j < scale.length; j++) {
                nextNoteIndex = (currentNoteIndex + j) % scale.length;
                nextNote = scale[nextNoteIndex];
                if (!newChord.includes(nextNote)) {
                    break;
                }
            }
        }

        newChord.push(nextNote);
    }

    return [newChord, newOctave];
}

// Simulate voice leading over multiple iterations
for (let i = 0; i < 10; i++) {
    [chord, octave] = voiceLead(chord, octave, scale);
}
*/

// Major scale definition
const scale = [0, 2, 4, 5, 7, 9, 11]; // Major scale intervals
let chord = [0, 4, 7, 11]; // Major 7th chord (root, 3rd, 5th, 7th)
let octave = [3, 3, 3, 3]; // Starting octave for each note in the chord

function voiceLead(chord, octave, scale) {
    const newChord = [];
    const newOctave = [...octave]; // Clone the octave array to modify safely

    for (let i = 0; i < chord.length; i++) {
        const currentNote = chord[i];
        const currentNoteIndex = scale.indexOf(currentNote);

        if (currentNoteIndex === -1) {
            return [chord, octave];
        }

        // Randomize direction: -1 (down), 0 (stay), or 1 (up)
        let direction = Math.floor(Math.random() * 3) - 1;

        // Compute the next note index
        let nextNoteIndex = currentNoteIndex + direction;

        // Handle wrapping and octave adjustments
        if (nextNoteIndex < 0) {
            nextNoteIndex += scale.length; // Wrap around to the top
            newOctave[i]--; // Decrease the octave
        } else if (nextNoteIndex >= scale.length) {
            nextNoteIndex -= scale.length; // Wrap around to the bottom
            newOctave[i]++; // Increase the octave
        }

        // Ensure the octave stays between 3 and 4
        if (newOctave[i] < 3) {
            newOctave[i] = 3;
            nextNoteIndex = currentNoteIndex; // Reset note index to prevent jumps
        }
        if (newOctave[i] > 4) {
            newOctave[i] = 4;
            nextNoteIndex = currentNoteIndex; // Reset note index to prevent jumps
        }

        // Ensure no duplicate notes in the new chord
        let nextNote = scale[nextNoteIndex];
        let attempts = 0; // Add an attempt counter
        const maxAttempts = scale.length * 2; // Set a reasonable limit for attempts

        while (newChord.includes(nextNote) && attempts < maxAttempts) {
            // Adjust direction to avoid duplicates
            direction = direction === 0 ? 1 : -direction; // Flip or move up
            nextNoteIndex = (nextNoteIndex + direction + scale.length) % scale.length;
            nextNote = scale[nextNoteIndex];

            // Adjust octave for wrapping
            if (direction === 1 && nextNoteIndex === 0 && newOctave[i] < 4) {
                newOctave[i]++;
            } else if (direction === -1 && nextNoteIndex === scale.length - 1 && newOctave[i] > 3) {
                newOctave[i]--;
            }

            attempts++;
        }

        // If we exceed max attempts, force a unique note
        if (attempts >= maxAttempts) {
            for (let j = 0; j < scale.length; j++) {
                nextNoteIndex = (currentNoteIndex + j) % scale.length;
                nextNote = scale[nextNoteIndex];
                if (!newChord.includes(nextNote)) {
                    break;
                }
            }
        }

        newChord.push(nextNote);
    }

    return [newChord, newOctave];
}

// Simulate voice leading over multiple iterations
for (let i = 0; i < 100; i++) {
    [chord, octave] = voiceLead(chord, octave, scale);
}
