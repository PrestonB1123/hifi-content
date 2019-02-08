
/*

    Filter for the spot
    filter_spot
    Created by Milad Nazeri on 2019-02-01
    Copyright 2019 High Fidelity, Inc.

    Distributed under the Apache License, Version 2.0.
    See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

    Filter for the spot

*/

// *************************************
// START INIT
// *************************************
// #region INIT

var debug = true;

// Simple logger
function log(message, item) {
    if (!debug) {
        return;
    }
    arguments = Array.prototype.slice.call(arguments).map(function(item){
        return JSON.stringify(item, null, 4) + "\n";
    });
    print("\n$$$LOG$$$\n");
    print.apply(null, arguments);
}

log("V6");

// ENUMS for edit filter type
var ADD = 0;
var EDIT = 1;
var PHYSICS = 2;
var DELETE = 3;


// Properties we are asking for
var PROPERTIES_TO_FILTER = 
    ['name', 'dimensions', 'modelURL', 'script', 'serverScripts', 'textures'];

var DELETE_QUALIFIERS = ['-clone', '-temp', 'Plate Piece', 'space'];


// #endregion
// *************************************
// END INIT
// *************************************


// *************************************
// START FILTER_PROPERTY_SETTINGS
// *************************************
// #region FILTER_PROPERTY_SETTINGS


filter.wantsOriginalProperties = PROPERTIES_TO_FILTER; // default: false
filter.wantsZoneProperties = false; // default: false
filter.wantsZoneBoundingBox = true; // default: true
filter.wantsToFilterAdd = true; // default: true
filter.wantsToFilterEdit = true; // default: true
filter.wantsToFilterPhysics = false; // default: true
filter.wantsToFilterDelete = true; // default: true
filter.rejectAll = false; // default: false


// #endregion
// *************************************
// END FILTER_PROPERTY_SETTINGS
// *************************************


// *************************************
// START HANDLERS
// *************************************
// #region HANDLERS


function filterAdd(properties, originalProperties, zoneProperties){
    // log("FILTER_ADD");    
    // log("FILTER_ADD", "properties:", properties, "originalProperties", originalProperties);
    return false;
}


var MAX_DIMENSION = 3.0;
function filterEdit(properties, originalProperties, zoneProperties){
    // log("FILTER_EDIT");
    // log("FILTER_EDIT", "properties:", properties, "originalProperties", originalProperties);
    if (
        properties.name && properties.name !== originalProperties.name ||
        properties.modelURL && properties.modelURL !== originalProperties.modelURL ||
        properties.script && properties.script !== originalProperties.script ||
        properties.serverScripts && properties.serverScripts !== originalProperties.serverScripts ||
        properties.textures && properties.textures !== originalProperties.textures ||
        properties.dimensions && (
            properties.dimensions.x >= MAX_DIMENSION || 
            properties.dimensions.y >= MAX_DIMENSION || 
            properties.dimensions.z >= MAX_DIMENSION
        )
    ){
        // We had a violation.  Returning false
        log("filter edit issue");
        return false;
    }
    // No violation
    return properties;
}


function filterPhysics(properties, originalProperties, zoneProperties){
    // log("FILTER_PHYSICS", "properties:", properties, "originalProperties", originalProperties);
    // log("FILTER_PHYSICS");
    return false;
}


function filterDelete(properties){
    // log("FILTER_DELETE", "properties:", properties, "originalProperties", originalProperties);
    log("FILTER_Delete");
    log(arguments);
    var name = properties.name;
    log("name", name);
    for (var i = 0; i < DELETE_QUALIFIERS.length; i++){
        if (name.toLowerCase().indexOf(DELETE_QUALIFIERS[i]) !== -1) {
            log("this is an allowed delete", name);
            return true;
        }
    }
    log("this isn't an allowed delete", name);
    return false;
}


// #endregion
// *************************************
// END HANDLERS
// *************************************


// *************************************
// START MAIN_FILTER
// *************************************
// #region MAIN_FILTER


// A filter returns either false, true, or the properties to let into the edit
// return false; means you aren't allowing these edits
// return properties; means you are allowing the incoming changes
function filter(properties, filterType, originalProperties, zoneProperties) {
    log("properties", properties);
    log("filterType", filterType);
    log("originalProperties", originalProperties);
    log("zoneProperties", zoneProperties);

    // make arguments an actual array
    switch (filterType) {
        case ADD:
            return filterAdd(properties, originalProperties, zoneProperties);
        case EDIT:
            return filterEdit(properties, originalProperties, zoneProperties);
        case PHYSICS:
            return filterPhysics(properties, originalProperties, zoneProperties);
        case DELETE:
            return filterDelete(originalProperties);
    }
}


// #endregion
// *************************************
// END MAIN_FILTER
// *************************************

