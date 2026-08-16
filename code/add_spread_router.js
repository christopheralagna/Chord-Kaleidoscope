// ============================================================
// add_spread_router.js
// ============================================================
// inlets:
//  0 = lock state (0/1)
//
// outlets:
//  0 = [add_spread <state>] messages for routing
// ============================================================

inlets = 1;
outlets = 1;

function msg_int(v) {
    var state = v === 1 ? 1 : 0;

    // emit message that can be routed directly to add_spread UI or patch logic
    outlet(0, "add_spread", state);

    // also directly control the UI element if named
    var o = this.patcher.getnamed("add_spread");
    if (o) {
        if (o.maxclass !== "live.comment") o.message("active", state);
    } else {
    }
}
