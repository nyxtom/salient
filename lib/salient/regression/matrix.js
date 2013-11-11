
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
