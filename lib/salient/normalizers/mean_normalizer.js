
var Matrix = require('./../math/matrix');
var Vector = require('./../math/vector');

var MeanNormalizer = function (options) {
    this.normalizeFeature0 = true;
};

/**
 * Normalizes all examples by running them through mean-normalization.
 * This will calculate each element in the matrix using the ith element
 * in each column minus the average of the column divided by the standard
 * deviation of the column (or mean normalization).
 */
MeanNormalizer.prototype.normalize = function (observations) {
    var features = $M(observations);

    var dim = features.dimensions();
    var m = dim.rows;
    var n = dim.cols;
    var mu = Matrix.Zeros(1, n);
    var sigma = Matrix.Zeros(1, n);

    this.mu = features.mean();
    this.sigma = features.std();
    var elements = [];
    if (this.normalizeFeature0) {
        var feature0 = Vector.One(m);
        elements.push(feature0.elements);
    }

    for (var i = 1; i <= n; i++) {
        var r = features.col(i).subtract(this.mu.e(i)).div(this.sigma.e(i));
        elements.push(r.elements);
    }

    return $M(elements).transpose();
};

/**
 * Normalizes the given input list according to the already trained
 * and normalized data using mean normalization.
 *
 * @param [Array] input: Input features of n-dimensions
 */
MeanNormalizer.prototype.normalizeInput = function (observation) {
    var inputNorm = [];
    if (this.normalizeFeature0) {
        inputNorm.push(1);
    }

    for (var i = 1; i <= observation.length; i++) {
        inputNorm.push((observation[i-1] - this.mu.e(i)) / this.sigma.e(i));
    }
    
    return $V(inputNorm);
};

module.exports = MeanNormalizer;
