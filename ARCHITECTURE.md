This is MIDI Companion (working title Chord Kaleidoscope): a Max for Live MIDI effect that listens to your keyboard, infers a valid scale from what you play, and generates harmonized chords on a schedule or on demand. The architecture splits cleanly into four layers.

High-level overview
Input
Tracking
Generation
Shared state (Dict + JSON)
Output
add/remove pitch class
random N-note scale
tracked pitch classes
midiin
Live UI controls
Chord Kaleidoscope jsui
end_sublist_without_consecutive.js
get_supersets_and_subsets.js
select_params.js
create_chord.js
apply_chord_options.js
send_chord.js
global_settings
generate_mode
selected_params
active_voicings
active_options
chord_memory
midiout
numbers_to_letters + jsui rings
Project structure
Path	Role
Untitled1.maxpat
Main patcher — wiring, Live UI, timing, MIDI I/O
code/*.js
Business logic (17 active modules)
JSUI/new1.js
Chord Kaleidoscope visual UI
data/*.json
Persistent state for Max dict objects
data/filtered_powerset_list.txt
Precomputed valid scales (4–8 pitch classes, no 3 consecutive semitones)
The patcher is the orchestrator; most musical intelligence lives in JavaScript modules that read and write shared dict objects.

Shared state (the “database”)
The device uses Max Dict objects as a shared in-memory store, backed by JSON files:

Dict	Purpose
global_settings
Lock scale, lock memory, add spread, selected chord slot, octave adjust
generate_mode
Manual / time-interval / note-count mode, trigger flag, note-count settings
selected_params
Current scale + chosen voicing for the next chord
active_voicings
Enabled chord shapes (e.g. triad: [2,4], 7th: [2,4,6])
active_options
Enabled inversions and drop voicings per chord size
chord_memory
Last 5 generated chords (chord1–chord5)
chord_history
Rolling history (up to 20 chords)
current_chord
Pitches/velocities of the chord currently sounding
This dict-centric design lets UI toggles, generation logic, and display all stay in sync without tight coupling.

Pipeline: from MIDI in to chord out
1. Input and note tracking
Incoming MIDI is parsed (midiparse) and reduced to pitch classes (0–11). The core tracker is end_sublist_without_consecutive.js:

Maintains a rolling history of played notes
Builds a tracked set that never contains 3 consecutive semitones (including wraparound 10–11–0)
On rule violation, falls back to the longest valid subset from recent notes
Supports a “fixed” mode (stop updating tracked notes) and reset
Accepts click-to-toggle from the jsui via add / remove messages
Tracked notes are a superset; the scale used for generation is a subset of them.

2. Scale selection
get_supersets_and_subsets.js loads filtered_powerset_list.txt (cached in memory) and:

Filters scales matching the user’s scale type (4–8 notes) that are subsets or supersets of tracked notes
Picks a random matching scale and stores it in coll related_scales
On manual “New Chord” or generation trigger, sets generate_mode.triggered = "true"
Disables invalid scale-size menu items (e.g. 7/8-note when whole-tone is detected)
3. Parameter assembly
select_params.js runs when a scale is chosen:

Writes the scale into selected_params (unless lock scale is on)
Randomly picks a voicing from active_voicings
4. Chord creation
create_chord.js reads selected_params and:

Picks a random root index in the scale
Applies the voicing offsets (scale-degree steps)
Wraps into octaves when indices exceed scale length
Outputs pitch-class arrays like [0, 2, 4]
5. Voicing, spread, and memory
apply_chord_options.js is the post-processing hub:

Randomly applies inversions and drop voicings from active_options / chord_options.json
Locked memory mode: replays a stored chord from chord_memory instead of generating new material
Add spread: alternates octaves down on odd-index notes
Updates chord_memory when unlocked; writes to chord_history
Respects manual mode by checking generate_mode.triggered
6. MIDI output
send_chord.js:

Sends note-offs for the previous chord (current_chord.pitches)
Formats new pitches with velocities (default 50, adjustable)
Outputs note-on pairs to midiout
Octave placement (+48/+60) happens in the patcher after pitch-class generation so notes land in a playable MIDI range.

Generation timing
apply_generate_mode.js gates when the pipeline runs:

Mode	Behavior
Manual (none)
Only when “New Chord” sets triggered = true
Time-interval (fixedTimeInterval)
Metro + Live tempo observers; constant or reactive (only if new input notes arrived)
Note-count (perNoteCount)
Counts incoming notes; fixed or variable threshold before triggering
The patcher uses live.observer / live.object for Ableton tempo and transport, plus metronomes for synced intervals.

UI architecture
Live controls (in patcher)
Scale type menu, chord shape toggles, spread/inversion toggles
Generate mode, rate, note count, velocity, octave adjust
Lock scale, lock chords, add spread, chord memory slot selector
“New Chord” button
Chord Kaleidoscope (JSUI/new1.js)
A custom jsui with three animated rings on a 12-segment circle:

Ring	Color	Data
Outer
Blue
Tracked notes
Middle
Green
Current scale
Inner
Orange/red
Generated chord
Clicking segments toggles pitch classes (same 3-consecutive-semitone rule). It drives both visualization and note tracking via outlets.

UI constraint modules
one_must_stay_on.js / one_must_stay_on_2.js — at least one chord shape stays active; maps button names to voicing intervals in active_voicings
handle_greyed_options.js — greys out chord shapes and scale sizes invalid for the current scale type
locker_link.js — locking chords forces lock scale and disables the scale lock UI
numbers_to_letters.js — pitch classes → note names for text displays (flat/sharp toggle)
Chord memory subsystem
unlocked
apply_chord_options
chord_memory.js
chord_memory dict
read_chord_memory.js
5 text displays
lock toggle
global_settings.lock_memory
When locked, generation replays chord{N} from memory; with add spread on, it re-applies random inversions/drops each time instead of repeating identical MIDI.

Data definitions
Chord shapes (one_must_stay_on.js → active_voicings): scale-degree offsets, e.g. triad = [2, 4], 7th = [2, 4, 6].

Spread options (chord_options.json → active_options): per-size inversion and drop tables with semitone adjustments per voice.

Valid scales (filtered_powerset_list.txt): thousands of pitch-class sets obeying the no-3-consecutive-halftones rule.

Design patterns worth noting
Dict as event bus — UI, logic, and persistence share state through named dicts rather than direct object references.
Pitch-class-first — almost all logic works in 0–11; octave translation happens late.
Constraint propagation — tracked notes constrain scale sizes, which constrain chord shapes, which constrain voicing tables.
Separation of concerns — tracking, scale picking, chord building, voicing, timing, and I/O each have dedicated JS files.
Patcher as glue — coll objects, routing, Live API tempo sync, and presentation live in Max; algorithms live in JS.
Maturity and known gaps
Per the README, the device is near completion with a few startup init bugs (velocity, octave adjust, scale type not loadbanging correctly) and tempo-sync rate not updating when Ableton’s global tempo changes. voice_leading.js and generation_filter.js appear to be experimental/commented-out code not wired into the main pipeline.
