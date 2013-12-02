
var Matrix = require('./../math/matrix');
var Vector = require('./../math/vector');

var SimpleNormalizer = function (options) {
    this.normalizeFeature0 = true;
};

/**
 * Normalizes the feature 0 (typically used in bias or to handle additional theta-0 weight).
 */
SimpleNormalizer.prototype.normalize = function (observations) {
    var features = $M(observations);
    var dim = features.dimensions();
    var m = dim.rows;

    if (this.normalizeFeature0) {
        return Matrix.Ones(m, 1).augment(features);
    }
    
    return features;
};

/**
 * Normalizes the given input list according to the already trained
 * and normalized data using a simple feature 0 addition.
 *
 * @param [Array] input: Input features of n-dimensions
 */
SimpleNormalizer.prototype.normalizeInput = function (observation) {
    var inputNorm = [];
    if (this.normalizeFeature0) {
        inputNorm.push(1);
    }

    for (var i = 1; i <= observation.length; i++) {
        inputNorm.push(observation[i-1]);
    }
    
    return $V(inputNorm);
};

module.exports = SimpleNormalizer;
