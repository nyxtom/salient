
var Matrix = require('sylvester').Matrix;
var fs = require('fs');

/**
 * Returns a vector of each column's standard deviation.
 */
Matrix.prototype.std = function () {
    var dim = this.dimensions();
    var mMean = this.mean();
    var r = [];
    for (var i = 1; i <= dim.cols; i++) {
        var meanDiff = this.col(i).subtract(mMean.e(i));
        meanDiff = meanDiff.elementMultiply(meanDiff);
        r.push(Math.sqrt(meanDiff.sum() / dim.rows));
    }
    return $V(r);
};

/**
 * Sigmoid or logistic function represents the bounded differentiable 
 * real function for all real input values showing the cumulative distribution 
 * between 0 and 1 given the input value Z.
 *
 * @param {Vector|Matrix|Number} z: The item to calculate sigmoid.
 */
Matrix.sigmoid = function (z) {
    if (!z.elements) {
        return (1.0 / (1 + Math.exp(-1.0 * z)));
    }
    else {
        var rows = z.rows();
        var cols = z.cols();
        var result = Matrix.Zeros(rows,cols).elements;
        for (var i = 1; i <= rows; i++) {
            for (var j = 1; j <= cols; j++) {
                var e = z.e(i,j);
                result[i-1][j-1] = Matrix.sigmoid(e);
            }
        }
        return $M(result);
    }
};

/**
 * Loads a .dat matlab file that consists of matrix data.
 *
 * @param {String} dat: location to the data file containing the matrix data.
 */
Matrix.load = function (dat) {
    var lines = fs.readFileSync(dat).toString().split('\n').map(function (x, i) { return x.trim() });
    lines = lines.filter(function (x, i) { return x.length > 0 && x.indexOf('#') < 0 });
    var elements = [];
    for (var l = 0; l < lines.length; l++) {
        var items = lines[l].split(' ').map(function (x) { return parseFloat(x); });
        elements.push(items);
    }
    return $M(elements);
};

module.exports = Matrix;
