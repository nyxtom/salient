
var Matrix = require('sylvester').Matrix;

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

module.exports = Matrix;
