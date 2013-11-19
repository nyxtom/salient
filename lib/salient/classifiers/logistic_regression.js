
var Classifier = require('./classifier');
var util = require('util');
var sylvester = require('sylvester');
var Matrix = sylvester.Matrix;
var Vector = sylvester.Vector;
require('./../regression/matrix');
require('./../regression/vector');

var LogisticRegression = function (options) {
    var options = options || {};
    this.examples = [];
    this.outputs = [];
    this.labels = [];
    this.features = null;
    this.outputVector = null;
    this.iterations = options.iterations || 500;
    this.alpha = options.alpha || 0.03;
    this.normalizeFeature0 = true;
    this.regularization = true;
    this.lambda = (options.lambda || 0.3);
};

util.inherits(LogisticRegression, Classifier);

/**
 * Adds an example to the items to train against.
 */
LogisticRegression.prototype.addExample = function (input, label) {
    this.examples.push(input);
    if (this.labels.indexOf(label) < 0) {
        this.labels.push(label);
    }

    this.outputs.push([this.labels.indexOf(label) + 1]);
};

/**
 * Normalizes all examples by running them through mean-normalization.
 * This will calculate each element in the matrix using the ith element 
 * in each column minus the average of the column divided by the standard 
 * deviation of the column (or mean normalization).
 */
LogisticRegression.prototype.normalize = function () {
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
LogisticRegression.prototype.normalizeInput = function (input) {
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
 *  Runs gradient descent for each of the labeled input using the normalized 
 *  design matrix, output y vector (using one vs all), alpha learning rate, 
 *  number of iterations to run gradint descent and the initial theta parameters.
 *  
 *  @returns The proposed theta for each of the labels after running gradient descent.
 */
LogisticRegression.prototype.train = function () {
    if (!this.features) {
        return;
    }
    else if (!this.featuresNorm) {
        this.normalize();
    }

    var allTheta = [];
    for (var i = 0; i < this.labels.length; i++) {
        var result = this.trainLabel(this.labels[i]);
        result.label = this.labels[i];
        result.labelIndex = i;
        allTheta.push(result);
    }
    this.trainedTheta = allTheta;
    return this.trainedTheta;
};

/**
 * Runs gradient descent for the given label using the normalized design matrix and a
 * conditional y-vector for the given label using the one-vs-all approach to logistic 
 * regression. This leverages the alpha learning rate, lambda regularization and 
 * gradient descent for the given number of iterations to produce a proper theta output
 * parameters optimized for the given label over the training set.
 *
 * @returns The proposed theta vector parameters for the given label.
 */
LogisticRegression.prototype.trainLabel = function (label) {
    var dim = this.features.dimensions();
    var n = dim.cols;
    var theta = Matrix.Zeros(n + 1, 1);
    var lambdaV = undefined;
    if (this.lambda) {
        var l = [];
        l.push([0]);
        for (var i = 1; i <= n; i++) {
            l.push([this.lambda]);
        }

        lambdaV = $M(l);
    }
    var X = this.featuresNorm;
    var index = this.labels.indexOf(label) + 1;
    var labelY = this.outputVector.map(function (x, i) { return x == index ? 1 : 0; });
    var alpha = this.alpha;
    var iterations = this.iterations;
    var result = this.gradientDescent(theta, X, labelY, alpha, iterations, lambdaV);
    return result;
};

/**
 * Standard implementation of the Multivariant Square-Error Cost function 
 * for reguarlized and non-regularized logistic regression:
 * using the implementation of J(Θ) = -1/m * sum [ y(i) * log(h(x(i))) + (1 - y(i) * log(1 - h(x(i))) ] + regularization_parameter
 * where regularization parameter: (diag(Θ) * λ)'Θ/2m 
 * and h(x(i)) is the sigmoid function: σ (z) = 1 / (1 + e^-z) and 
 * h(x) = σ(Θ'x) or more appropriately simplified:
 * h(x(i)) = 1 / (1 + e^-Θ'x). Using vectorization, this is further simplified to:
 *
 * J(Θ) = -1/m * [ ylog(1/(1+e^-XΘ)) + (1-y)log(1-(1/1+e^-XΘ)) ] + (diag(Θ)λ)'Θ/2m
 * J(Θ) = -1/m * [ ylog(sigmoid) + (1-y)log(1-sigmoid) ] + (diag(Θ)λ)'Θ/2m
 *
 * @param {Vector} theta: n+1-dimensional vector of parameters used to represent the Θ.
 * @param {Matrix} X: m x (n+1) matrix of m-samples of n-features.
 * @param {Vector} y: m x 1-dimensional vector of output values
 * @param {Vector} lambda: n+1-dimensional vector of regularization parameter.
 */
LogisticRegression.prototype.computeCost = function (theta, X, y, lambda) {
    var sigmoid = this.sigmoid(X.multiply(theta));
    var m = X.rows();
    var prob1 = sigmoid.log().transpose().multiply(y).e(1,1);
    var prob0 = sigmoid.multiply(-1).add(1).log().transpose()
                       .multiply((y.multiply(-1).add(1))).e(1,1);
    var cost = (-1.0 * (prob1 + prob0)) / m;
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
 * Θ := diag(Θ) * (1 - α λ/m) - (α / m) * sum [ (h(x(i)) - y(i)) x(i) ]
 *
 * where h(x) is the sigmoid function computed upon: XΘ
 * or in vectorized form:
 *
 * Θ := diag(Θ) * (1 - α λ/m) - (α / m) * sum [ (h(x(i)) - y(i)) x(i) ]
 * Θ := diag(Θ) * (1 - α λ/m) - α ((sigmoid(XΘ) - y)'X/m)' ]
 *
 * @param {Vector} theta: n+1-dimensional vector of parameters used to represent the Θ.
 * @param {Matrix} X: m x (n+1) matrix of m-samples of n-features.
 * @param {Vector} y: m x 1-dimensional vector of output values.
 * @param {Number} alpha: alpha-learning rate used in the gradient descent algorithm.
 * @param {Number} iterations: # of iterations to run gradient descent.
 * @param {Vector} lambda: n+1-dimensional vector of regularization parameter.
 */
LogisticRegression.prototype.gradientDescent = function (theta, X, y, alpha, iterations, lambda) {
    var m = X.rows();
    var history = [];

    for (var i = 0; i < iterations; i++) {
        var result = this.sigmoid(X.multiply(theta)).subtract(y)
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
 * Sigmoid or logistic function represents the bounded differentiable 
 * real function for all real input values showing the cumulative distribution 
 * between 0 and 1 given the input value Z.
 *
 * @param {Vector|Matrix|Number} z: The item to calculate sigmoid.
 */
LogisticRegression.prototype.sigmoid = function (z) {
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
                result[i-1][j-1] = this.sigmoid(e);
            }
        }
        return $M(result);
    }
};

/**
 * Predicts the value probability output of the given input feature vector 
 * against the class-based theta parameters.
 *
 * @param {Vector} theta: n+1-dimensional vector of parameters associated with a given class.
 * @param {Vector} input: n+1-dimensional vctor of input features to calculate the probability y-output.
 */
LogisticRegression.prototype.calculate = function (theta, input) {
    return this.sigmoid(theta.transpose().multiply(input));
};

/**
 * Returns the set of labels and association probability for a given 
 * observation input vector being made.
 */
LogisticRegression.prototype.getClassifications = function (input) {
    if (!this.trainedTheta) {
        throw new Error('must train the classifier first');
        return;
    }

    var classifier = this;
    var labels = [];
    for (var i = 0; i < this.trainedTheta.length; i++) {
        var thetaInput = this.trainedTheta[i];
        var result = this.calculate(thetaInput.theta, input);
        labels.push({ label: thetaInput.label, value: result.max() });
    }

    return labels.sort(function (x, y) { return y.value > x.value });
};

module.exports = LogisticRegression;
