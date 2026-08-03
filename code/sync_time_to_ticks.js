autowatch = 1;
inlets = 1;
outlets = 2;

var lookups = [
    0.0625, 0.083333, 0.125, 0.166667, 0.25, 0.333333, 0.5, 0.666667, 0.75, 
    1.0, 1.25, 1.333333, 1.5, 2.0, 3.0, 4.0, 6.0, 8.0, 12.0, 16.0, 24.0, 32.0, 64.0, 128.0
];

function process_index(val) {
    var index = Math.floor(val);
    if (index >= 0 && index < lookups.length) {
        var multiplier = lookups[index];
        var ticks = Math.round(multiplier * 480);
        
        // Output proper Max lists to the left inlet
        outlet(0, ["interval", ticks, "ticks"]);
        outlet(1, ["quantize", ticks, "ticks"]);
    }
}

function msg_int(val) {
    process_index(val);
}

function msg_float(val) {
    process_index(val);
}
