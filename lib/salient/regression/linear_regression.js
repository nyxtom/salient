
var Regression = require('./regression');
var util = require('util');
var sylvester = require('sylvester');
var Matrix = sylvester.Matrix;
var Vector = sylvester.Vector;
require('./matrix');
require('./vector');

var LinearRegression = function (options) {
    var options = options || {};
    this.examples = [];
    this.outputs = [];
    this.features = null;
    this.outputVector = null;
    this.iterations = options.iterations || 1500;
    this.alpha = options.alpha || 0.03;
    this.normalizeFeature0 = true;
    this.regularization = options.regularization || false;
    this.lambda = (options.lambda || 1) * (this.regularization ? 1 : 0);
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
    this.features = $M(this.examples);
    this.outputVector = $M(this.outputs);

    var dim = this.features.dimensions();
    var m = dim.rows;
    var n = dim.cols;
    var mu = Matrix.Zeros(1, n);
    var sigma = Matrix.Zeros(1, n);

    this.mu = this.features.mean();
    this.sigma = this.features.std();
    var elements = [];
    if (this.normalizeFeature0) {
        var feature0 = Vector.One(m);
        elements.push(feature0.elements);
    }

    for (var i = 1; i <= n; i++) {
        var r = this.features.col(i).subtract(this.mu.e(i)).div(this.sigma.e(i));
        elements.push(r.elements);
    }

    this.featuresNorm = $M(elements).transpose();
    return this.featuresNorm;
};

/**
 * Normalizes the given input list according to the already trained 
 * and normalized data using mean normalization.
 *
 * @param [Array] input: Input features of n-dimensions
 */
LinearRegression.prototype.normalizeInput = function (input) {
    var inputNorm = [];
    if (this.normalizeFeature0) {
        inputNorm.push(1);
    }

    for (var i = 1; i <= input.length; i++) {
        inputNorm.push((input[i-1] - this.mu.e(i)) / this.sigma.e(i));
    }

    return $V(inputNorm);
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
        return;
    }
    else if (!this.featuresNorm) {
        this.normalize();
    }

    var dim = this.features.dimensions();
    var n = dim.cols;

    var theta = Matrix.Zeros(n + 1, 1);
    var l = [];
    l.push([0]);
    for (var i = 1; i <= n; i++) {
        l.push([this.lambda]);
    }
    var lambdaV = $M(l);
    var X = this.featuresNorm;
    var y = this.outputVector;
    var alpha = this.alpha;
    var iterations = this.iterations;
    var result = this.gradientDescent(theta, X, y, alpha, iterations, lambdaV);
    return result;
};

/**
 * Standard implementation of the Multivariant Square-Error Cost function 
 * using the implementation of J(Θ) = (XΘ-y)'(XΘ-y) / 2m  + regularization_parameter
 * where regularization parameter: (diag(Θ) * λ)'Θ/2m 
 *
 * @param {Vector} theta: n+1-dimensional vector of parameters used to represent the Θ.
 * @param {Matrix} X: m x (n+1) matrix of m-samples of n-features.
 * @param {Vector} y: m x 1-dimensional vector of output values
 */
LinearRegression.prototype.computeCost = function (theta, X, y, lambda) {
    var m = X.rows();
    var n = X.cols();
    var result = X.multiply(theta).subtract(y);
    var cost = result.transpose().multiply(result).div(2 * m).e(1, 1);
    if (lambda) {
        cost += Matrix.Diagonal(theta.elements)
                .multiply(lambda).transpose()
                .multiply(theta).div(2 * m);
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

    return { 'theta': theta, 'cost': history };
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
