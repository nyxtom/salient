
var fs = require('fs'),
    readline = require('readline');

var Regression = function () {
};

Regression.prototype.train = function () {
};

Regression.prototype.addExample = function (input, output) {
};

Regression.prototype.load = function (input, callback) {
    var lines = fs.readFileSync(input).toString().split('\n');
    for (var l = 0; l < lines.length; l++) {
        var items = lines[l].split(',');
        var features = [];
        var output = 0;
        for (var i = 0; i < items.length; i++) {
            if (i < items.length - 1) {
                features.push(parseFloat(items[i]));
            } 
            else {
                output = parseFloat(items[i]);
            }
        }
        if (features.length > 0) {
            this.addExample(features, output);
        }
    }
};

module.exports = Regression;
