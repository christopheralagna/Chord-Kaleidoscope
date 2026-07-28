
outlets = 2;

var activeVoicingsDict = new Dict("active_voicings"); // Load the dictionary
var selectedParamsDict = new Dict("selected_params"); // Load the selected params dictionary
var globalSettings = new Dict("global_settings");     // unified global settings dict

// update scale in params
function updateScale(scale, params) {
    params.set("scale", scale); // Set the "current_scale" key
}

// choose random voicing from active voicings
function chooseVoicing(activeVoicings) {
    var voicingKeys = activeVoicings.getkeys(); 
    post("Voicing Keys: " + voicingKeys + "\n"); 

    if (!voicingKeys || voicingKeys.length === 0) {
        post("Error: No voicings found in activeVoicings dictionary.\n");
        return null;
    }

    var randomIndex = Math.floor(Math.random() * voicingKeys.length);
    var selectedVoicing = voicingKeys[randomIndex];
    var voicing = activeVoicings.get(selectedVoicing);

    post("Chosen voicing: " + selectedVoicing + " with voicing: " + voicing + "\n");
    return voicing;
}

// update voicing param
function updateVoicing(voicing, params) {
    if (voicing === null) {
        post("Error: No voicing selected to update.\n");
        return;
    }
    params.set("voicing", voicing);
    post("Updated selected_voicing: " + voicing + "\n");
}

function list() {
    var lockScale = globalSettings.get("lock_scale") === 1;
    post("Lock Scale state:", lockScale, "\n");

    var currentScale = selectedParamsDict.get("scale") || [];

    if (!lockScale) {
        var scale = arrayfromargs(arguments);
        if (scale.length > 0) {
            updateScale(scale, selectedParamsDict);
        } else if (currentScale.length === 0) {
            post("⚠️ No scale yet — keeping scale empty until data arrives.\n");
        }
    } else {
        if (currentScale.length === 0) {
            post("⚠️ Lock Scale active but no previous scale stored — initializing default.\n");
            selectedParamsDict.replace("scale", [0, 2, 4, 5, 7, 9, 11]); // default C major, or whatever you want
        } else {
            post("🔒 Lock Scale active — keeping previous scale.\n");
        }
    }

    outlet(1, selectedParamsDict.get("scale"));

    var voicing = chooseVoicing(activeVoicingsDict);
    updateVoicing(voicing, selectedParamsDict);
    outlet(0, selectedParamsDict);
}
    /*
    function list() {
    // read from global_settings instead of fixed_scale
    var lockScale = globalSettings.get("lock_scale") === 1;
    post("Lock Scale state:", lockScale, "\n");

    if (!lockScale) {
        var scale = arrayfromargs(arguments);
        updateScale(scale, selectedParamsDict);
    } else {
        post("🔒 Lock Scale active — keeping previous scale.\n");
    }

    outlet(1, selectedParamsDict.get("scale"));

    var voicing = chooseVoicing(activeVoicingsDict);
    updateVoicing(voicing, selectedParamsDict);
    outlet(0, selectedParamsDict);
}
    */



/*
var activeVoicingsDict = new Dict("active_voicings"); // Load the dictionary
var selectedParamsDict = new Dict("selected_params"); // Load the selected params dictionary
var fixedScale = new Dict("fixed_scale");

// update scale in params
function updateScale(scale, params) {
    params.set("scale", scale); // Set the "current_scale" key
    //post("Updated current_scale: " + scale + "\n");
}

// choose random voicing from active voicings
function chooseVoicing(activeVoicings) {
    // Get all the voicing keys from the dictionary
    var voicingKeys = activeVoicings.getkeys(); // Get the list of voicing names (keys)
    
    post("Voicing Keys: " + voicingKeys + "\n"); // Log the voicing keys for debugging
    
    // Check if voicingKeys is null or empty
    if (!voicingKeys || voicingKeys.length === 0) {
        post("Error: No voicings found in activeVoicings dictionary.\n");
        return null; // Return null if no voicings are found
    }

    // Generate a random index to choose a voicing
    var randomIndex = Math.floor(Math.random() * voicingKeys.length);

    // Get the selected voicing name
    var selectedVoicing = voicingKeys[randomIndex];

    // Get the voicing array (e.g., [1, 3, 5]) associated with the selected voicing name
    var voicing = activeVoicings.get(selectedVoicing);

    post("Chosen voicing: " + selectedVoicing + " with voicing: " + voicing + "\n");

    return voicing; // Return the chosen voicing
}

// update voicing param
function updateVoicing(voicing, params) {
    if (voicing === null) {
        post("Error: No voicing selected to update.\n");
        return; // Don't update if no voicing is selected
    }
    params.set("voicing", voicing);
    post("Updated selected_voicing: " + voicing + "\n");
}

function list() {
	
	//only update scale if "dict fixed_scale" is set to 0
	var fixed = fixedScale.get("fixed");
	if (fixed == 0) {
    	var scale = arrayfromargs(arguments); // Receive scale
    	updateScale(scale, selectedParamsDict); // Update scale in the params dictionary
	}
	

    var voicing = chooseVoicing(activeVoicingsDict); // Choose random voicing
    updateVoicing(voicing, selectedParamsDict); // Update voicing in the params dictionary
	outlet(0, selectedParamsDict);
}
    */
