# Known Bugs Analysis

Based on the console output and the provided project documentation, here is an analysis of the startup errors grouped by likelihood of being the root cause versus cascading failures.

## Log Message Grouping

### 1. Actual Errors & Likely Root Causes
- `js: one_must_stay_on_2: Javascript ReferenceError: updateDict is not defined, line 61`
- `js: error calling function loadbang [one_must_stay_on_2]`
- ` "$" variable out of range (1)`

### 2. Cascading Failures (Probably caused by the above)
- `dict: cannot read dictionary: -1`
- `dictwrap: no dictionary named 2NoteVoicing, cannot access values`
- `dict: failed to remove key named 'interval2'` (and other similar `failed to remove key` messages for `cluster2`, `inv1`, `special1`, `sus2`, etc.)

### 3. Debug Logging (Harmless / can be removed eventually)
- `js: ==== one_must_stay_on_spreads_debug_v5.js LOADED ====`
- `js: Init inversions...` / `js: Initial invStates...`
- `js: ✅ Updated chord memory output`
- `js: --- handleButton ---` / `js: --- updateDictForGroup ---`
- `js: Dict after update: { ... }`
- `js: Note naming mode set to: Flats (b)`

### 4. Harmless Warnings
- `live.comment: doesn't understand "active"`
- `expr: divide by zero detected` (Could be cascading from missing tempo/time-interval initialization, but likely harmless until values populate)

---

## Root Cause Prioritization

1. **`one_must_stay_on_2.js` Loadbang Failure**: The most critical issue. Because this script crashes on initialization (`loadbang`), the dict values it's responsible for managing are never properly set up. This directly leads to downstream dict-related read/write errors.
2. **`"$" variable out of range (1)`**: A Max message box or object is receiving a bang or list without the expected arguments (like `$1`), likely due to the broken loadbang sequence failing to send expected initial data.
3. **`expr: divide by zero detected`**: Likely a cascading result of uninitialized values passing through a timing calculation (e.g., initial tempo or rate is `0`).

---

## Known Bugs

### Bug 1: Startup Initialization Failure in Voicing/Shape Constraints
- **Bug Description:** During startup, `one_must_stay_on_2.js` crashes during its `loadbang` sequence. This prevents chord shapes, inversions, and other parameters from correctly initializing in the shared `Dict` objects. This is highly likely to be the root cause of the "certain starting values do not get loadbanged" issue mentioned in the README.
- **Suspected Cause:** A Javascript `ReferenceError` at line 61 of `code/one_must_stay_on_2.js` because it calls a function named `updateDict` that is either undefined or out of scope.
- **Affected Files:** 
  - `code/one_must_stay_on_2.js`
  - Downstream dictionaries (`active_voicings`, `active_options`, `selected_params`)
- **Severity:** High (halts proper plugin initialization)
- **Confidence:** High
- **Suggested Investigation Steps:**
  1. Open `code/one_must_stay_on_2.js` and inspect line 61.
  2. Verify if `updateDict` is defined elsewhere in the file, if it was renamed, or if it was supposed to be imported/called differently.
  3. Check if `one_must_stay_on_2.js` is conflicting with or meant to replicate logic from `one_must_stay_on.js` / `one_must_stay_on_spreads_debug_v5.js`.

### Bug 2: Missing Argument for Max Variable
- **Bug Description:** A Max object expecting a variable argument receives none, resulting in a `"$"` variable out of range (1)` error.
- **Suspected Cause:** A UI object or message box (e.g., `$1`) being banged during initialization without an upstream value, probably because a JS file failed to output its initial state.
- **Affected Files:** `Untitled1.maxpat` (The main patcher)
- **Severity:** Medium
- **Confidence:** Medium
- **Suggested Investigation Steps:**
  1. Search `Untitled1.maxpat` for message boxes or objects containing `$1`.
  2. Trace their inputs back to initialization bangs (like `loadbang` or `live.thisdevice`).
  3. Determine if one of these inputs is mapped to an outlet of `one_must_stay_on_2.js`.

### Bug 3: Rate Calculation Division by Zero
- **Bug Description:** An `expr: divide by zero detected` error appears, likely relating to time-interval or tempo-sync generation modes. Could be related to the README issue: "rate of chord generation should update as the Ableton global tempo is changed."
- **Suspected Cause:** A mathematical expression (likely in `Untitled1.maxpat` or an associated `expr` object) receives a `0` value for a denominator, perhaps because Ableton's global tempo hasn't been fetched yet, or a rate value failed to loadbang. 
- **Affected Files:** 
  - `Untitled1.maxpat`
  - `code/apply_generate_mode.js` (potentially)
- **Severity:** Medium
- **Confidence:** Medium
- **Suggested Investigation Steps:**
  1. Locate `expr` objects in the patcher handling rate/tempo calculations.
  2. Verify how the global tempo or user-selected rate is initialized on launch.
  3. Add a check or fallback mechanism to prevent division by zero before Ableton Live syncs the tempo.

### Bug 4: Unsupported Message to `live.comment`
- **Bug Description:** A `live.comment` object throws a `doesn't understand "active"` warning in the console.
- **Suspected Cause:** A message intended for a different object (maybe setting an "active" state flag) is incorrectly routed to a text label (`live.comment`). 
- **Affected Files:** `Untitled1.maxpat`
- **Severity:** Low
- **Confidence:** High
- **Suggested Investigation Steps:**
  1. Inspect the patcher for `live.comment` objects.
  2. Check the message cords connected to them to see what routing is inappropriately passing the string `"active"`.
