// ============================================================
// get_supersets_and_subsets.js
// ============================================================

inlets = 3;
outlets = 2;

var generateModeDict = new Dict("generate_mode");
var numberOfEntries = 0;
var exactSetSize = 5;

// --- Main processing ---
function processSets(input, fileContent) {
    if (typeof fileContent !== "string") fileContent = fileContent.toString();

    var sets = fileContent
        .split('\n')
        .map(function(line){return line.trim();})
        .filter(function(line){return line.indexOf('(')===0 && line.indexOf(')')===line.length-1;})
        .map(function(line){
            return line.slice(1,-1)
                .split(',')
                .map(function(num){return parseInt(num,10);})
                .filter(function(num){return !isNaN(num);});
        });

    var result = sets.filter(function(set){
        if (set.length !== exactSetSize) return false;
        var isSubset = input.every(function(num){return set.indexOf(num)!==-1;});
        var isSuperset = set.every(function(num){return input.indexOf(num)!==-1;});
        return isSubset || isSuperset;
    });

    if (result.length === 0 && input.length>0) {
        post("⚠️ No matches for " + exactSetSize + "-note sets. Falling back to 6-note.\n");
        exactSetSize = 6;
        result = sets.filter(function(set){
            if (set.length!==6) return false;
            var isSubset = input.every(function(num){return set.indexOf(num)!==-1;});
            var isSuperset = set.every(function(num){return input.indexOf(num)!==-1;});
            return isSubset || isSuperset;
        });
    }

    storeAndOutput(result);
}

function storeAndOutput(result) {
    outlet(0, "clear");
    for (var i=0;i<result.length;i++) outlet(0, "store", i, result[i]);
    numberOfEntries = result.length;
    if (numberOfEntries>0) {
        var randomValue = Math.floor(Math.random() * numberOfEntries);
        outlet(0, randomValue);
        post("✅ Found " + numberOfEntries + " sets (size " + exactSetSize + ")\n");
    }
}

// --- File load ---
function list() {
    if (inlet==0) {
        var inputList = arrayfromargs(arguments);
        var filename = "filtered_powerset_list.txt";
        var file = new File(filename,"read");
        if (file.isopen) {
            var content = "";
            var line;
            while ((line=file.readline())!==null) content += line + "\n";
            file.close();
            processSets(inputList, content);
        } else {
            post("❌ Error opening file: " + filename + "\n");
        }
    }
}

function msg_int(v) {
    if (inlet==1) {
        exactSetSize = v;
        post("Exact set size: " + exactSetSize + "\n");
    }
}

function reset() {
    var filename = "filtered_powerset_list.txt";
    var file = new File(filename,"read");
    if (file.isopen) {
        var content = "";
        var line;
        while ((line=file.readline())!==null) content += line + "\n";
        file.close();
        var sets = content
            .split('\n')
            .map(function(line){return line.trim();})
            .filter(function(line){return line.indexOf('(')===0 && line.indexOf(')')===line.length-1;})
            .map(function(line){
                return line.slice(1,-1)
                    .split(',')
                    .map(function(num){return parseInt(num,10);})
                    .filter(function(num){return !isNaN(num);});
            });
        var result = sets.filter(function(set){return set.length===exactSetSize;});
        outlet(0, "clear");
        for (var i=0;i<result.length;i++) outlet(0, "store", i, result[i]);
        var randomValue = Math.floor(Math.random() * result.length);
        outlet(0, randomValue);
        post("🎲 Reset: picked random " + exactSetSize + "-note scale.\n");
    }
}

function bang() {
    if (inlet==2) {
        generateModeDict.set("triggered","true");
        var randomValue = Math.floor(Math.random() * numberOfEntries);
        outlet(0, randomValue);
    }
}

