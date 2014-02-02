
var fs = require('fs'),
    path = require('path'),
    util = require('util');

module.exports = {};
module.exports.load = function (mapFile) {
    var mapping = {};
    var lines = fs.readFileSync(mapFile).toString().split('\n');
    for (var l = 0; l < lines.length; l++) {
        var line = lines[l];
        if (!line || line.trim().length == 0) {
            continue;
        }
        var items = line.split('\t');
        if (items.length != 2)
            continue;

        var btag = items[0];
        var utag = items[1];
        mapping[btag] = utag;
    }

    return mapping;
};
