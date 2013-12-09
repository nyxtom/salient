
var Regression = require('./regression');
var util = require('util');
var Matrix = require('./../math/matrix');
var Vector = require('./../math/vector');
var MeanNormalizer = require('./../normalizers/mean_normalizer');

var LinearRegression = function (options) {
    var options = options || {};
    this.examples = [];
    this.outputs = [];
    this.features = null;
    this.outputVector = null;
    this.iterations = options.iterations || 1500;
    this.alpha = options.alpha || 0.03;
    this.regularization = options.regularization || false;
    this.lambda = (options.lambda || 1) * (this.regularization ? 1 : 0);
    this.normalizer = options.normalizer || new MeanNormalizer();
};

util.inherits(LinearRegression, Regression);

/**
 * Adds an example to the items to train against.
 */
LinearRegression.prototype.addExample = function (input, output) {
    this.examples.push(input);
    this.outputs.push([output]);
};

/**
 * Normalizes all examples by running them through mean-normalization.
 * This will calculate each element in the matrix using the ith element 
 * in each column minus the average of the column divided by the standard 
 * deviation of the column (or mean normalization).
 */
LinearRegression.prototype.normalize = function () {
    this.features = this.normalizer.normalize(this.examples);
    this.outputVector = $M(this.outputs);
    return this.features;
};

/**
 * Normalizes the given input list according to the already trained 
 * and normalized data using mean normalization.
 *
 * @param [Array] input: Input features of n-dimensions
 */
LinearRegression.prototype.normalizeInput = function (input) {
    return this.normalizer.normalizeInput(input);
};

/**
 * Runs gradient descent using the normalized design matrix, output y vector 
 * alpha learning rate, number of iterations to run gradient descent and the 
 * initial theta parameters for the hypothesis h(x).
 *
 * @returns The proposed theta after running gradient descent and the cost history.
 */
LinearRegression.prototype.train = function () {
    if (!this.features) {
        this.normalize();
    }

    var dim = this.features.dimensions();
    var n = dim.cols;

    var theta = Matrix.Zeros(n, 1);
    var l = [];
    l.push([0]);
    for (var i = 1; i < n; i++) {
        l.push([this.lambda]);
    }
    var lambdaV = $M(l);
    var X = this.features;
    var y = this.outputVector;
    var alpha = this.alpha;
    var iterations = this.iterations;
    var result = this.gradientDescent(theta, X, y, alpha, iterations, lambdaV);
    this.trainedTheta = result.theta;
    return result;
};

/**
 * Tests the given samples and output according to the already trained theta.
 *
 * @returns The total error cost over the all-vs-one computed cost function.
 */
LinearRegression.prototype.test = function (samples, output) {
    var features = this.normalizer.normalize(samples);
    var outputVector = $M(output);
    var cost = this.computeCost(this.trainedTheta, features, outputVector);
    return cost;
};

/**
 * Standard implementation of the Multivariant Square-Error Cost function 
 * using the implementation of J(Θ) = (XΘ-y)'(XΘ-y) / 2m  + regularization_parameter
 * where regularization parameter: (diag(Θ) * λ)'Θ/2m 
 *
 * @param {Vector} theta: n+1-dimensional vector of parameters used to represent the Θ.
 * @param {Matrix} X: m x (n+1) matrix of m-samples of n-features.
 * @param {Vector} y: m x 1-dimensional vector of output values
 * @param {Vector} lambda: n+1-dimensional vector of regularization parameter.
 */
LinearRegression.prototype.computeCost = function (theta, X, y, lambda) {
    var m = X.rows();
    var n = X.cols();
    var result = X.multiply(theta).subtract(y);
    var cost = result.transpose().multiply(result).div(2 * m).e(1, 1);
    if (lambda) {
        cost += Matrix.Diagonal(theta.elements)
                .multiply(lambda).transpose()
                .multiply(theta).div(2 * m).e(1,1);
    }
    return cost;
};

/**
 * Gradient Descent regression algorithm to compute the minimal cost 
 * of a hypothesis h(x) that best fits the output data. This is done 
 * using the implementation: Θ = Θ - α ((XΘ-y)'X/m)'
 *
 * @param {Vector} theta: n+1-dimensional vector of parameters used to represent the Θ.
 * @param {Matrix} X: m x (n+1) matrix of m-samples of n-features.
 * @param {Vector} y: m x 1-dimensional vector of output values.
 * @param {Number} alpha: alpha-learning rate used in the gradient descent algorithm.
 * @param {Number} iterations: # of iterations to run gradient descent.
 * @param {Vector} lambda: n+1-dimensional vector of regularization parameter.
 */
LinearRegression.prototype.gradientDescent = function (theta, X, y, alpha, iterations, lambda) {
    var m = X.rows();
    var history = [];

    for (var i = 0; i < iterations; i++) {
        var result = X.multiply(theta).subtract(y)
                      .transpose().multiply(X).div(m);
        if (lambda) {
            var lambdaAdjust = lambda.multiply(-1 * alpha).div(m).add(1);
            var thetaAdjust = Matrix.Diagonal(theta.elements).multiply(lambdaAdjust);
            theta = thetaAdjust.subtract(result.multiply(alpha).transpose());
        }
        else {
            theta = theta.subtract(result.multiply(alpha).transpose());
        }
        history.push(this.computeCost(theta, X, y, lambda));
    }

    var error = this.computeCost(theta, X, y);
    return { 'theta': theta, 'cost': history, 'error': error };
};

/**
 * Predicts the value output of the given input feature vector.
 *
 * @param {Vector} theta: n+1-dimensional vector of parameters used to represent the Θ.
 * @param {Vector} input: n+1-dimensional vector of input features to calculate y-output.
 */
LinearRegression.prototype.calculate = function (theta, input) {
    return theta.transpose().multiply(input);
};

module.exports = LinearRegression;
