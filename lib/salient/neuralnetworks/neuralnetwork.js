
var util = require('util');
var Classifier = require('./../classifiers/classifier');
var MeanNormalizer = require('./../normalizers/mean_normalizer');
var Matrix = require('./../math/matrix');
var Vector = require('./../math/vector');

var NeuralNetwork = function (options) {
    var options = options || {};
    this.examples = [];
    this.outputs = [];
    this.labels = [];
    this.features = null;
    this.outputVector = null;
    this.iterations = options.iterations || 100;
    this.alpha = options.alpha || 0.03;
    this.lambda = (options.lambda || 0.3);
    this.normalizer = options.normalizer || new MeanNormalizer();
    this.layers = options.layers || [ 25 ]; // array of units per layer
};

util.inherits(NeuralNetwork, Classifier);

/**
 * Adds an example to the items to train against.
 */
NeuralNetwork.prototype.addExample = function (input, label) {
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
NeuralNetwork.prototype.normalize = function () {
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
NeuralNetwork.prototype.normalizeInput = function (input) {
    return this.normalizer.normalizeInput(input);
};

NeuralNetwork.prototype.train = function () {
    if (!this.features) {
        this.normalize();
    }

    
};

/**
 * Error-Cost function of the an L-dimensional neural network. This will perform 
 * the regularized or non-regularized neural network using a modified logistic regression cost function:
 * J(Θ) = -1/m * sum [ y(i) * log(h(x(i))) + (1 - y(i) * log(1 - h(x(i))) ] + regularization_parameter
 * with the exception of including the summation of each label in the last layer as an inner summation.
 * where regularization parameter: (diag(Θ) * λ)'Θ/2m
 * and h(x(i)) is the sigmoid function: σ (z) = 1 / (1 + e^-z) and
 * h(x) = σ(Θ'x) or more appropriately simplified:
 * h(x(i)) = 1 / (1 + e^-Θ'x). Using vectorization, this is further simplified to:
 *
 * J(Θ) = -1/m * [ log(1/(1+e^-XΘ))'y + log(1-(1/1+e^-XΘ))'(1-y) ] + (diag(Θ)λ)'Θ/2m
 * J(Θ) = -1/m * [ log(sigmoid)'y + log(1-sigmoid)'(1-y) ] + (diag(Θ)λ)'Θ/2m
 *
 * To compute the cost function for the last layer of K-labels, we must perform forward propogation first of 
 * the input values against the given ThetaLD parameters until we can compute the cost in layer L (or output layer).
 *
 * J(Θ) = sum k-labels [ log(sigmoid)'yk + log(1-sigmoid)'(1-yk) ] + (diag(Θ)'Θ)λ/2m
 * where yk is the binary vector for label k in the K-number of labels provided by the output layer y and 
 * sigmoid in this case is the activation output of the final hidden layer propogated to units in the output layer.
 *
 * @param {NDMatrix} theta: NxL dimensional matrix of parameters used to represent the big-Θ.
 * @param {Matrix} X: m x (n+1) matrix of m-samples of n-features
 * @param {Vector} y: m x 1-dimensional vector of output values.
 * @param {Vector} lambda: n+1-dimensional vector of regularization parameter.
 */
NeuralNetwork.prototype.computeCost = function (ThetaLD, X, y, lambda) {
    var activatedOutput = this.feedForward(ThetaLD, X);
    var cost = 0;
    for (var k = 1; k <= this.labels.length; k++) {
        var labelKActivation = $M(activatedOutput.col(k));
        var yk = y.map(function (x, i) { return x == (k - 1) ? 1 : 0; });
        var prob1 = labelKActivation.log().transpose().multiply(yk).e(1,1);
        var prob0 = labelKActivation.multiply(-1).add(1).log().transpose()
                                    .multiply((y.multiply(-1).add(1))).e(1,1);
        cost += (-1.0 * (prob1 + prob0)) / m;
    }
    if (lambda) {
        var lambdaCost = 0;
        for (var l = 0; l < ThetaLD.length; l++) {
            var thetaL = ThetaLD[l];
            lambdaCost += thetaL.map(function (x) { return x * x }).sum();
        }
        cost += (lambda / (2 * m)) * lambdaCost;
    }
    return cost;
};

/**
 * Propogates the input of X through the various layers with weights provided 
 * by the multi-dimensional matrix ThetaLD, which derives of weights in each 
 * layer of the neural network for applied weights of input to the first hidden layer 
 * and all hidden layers until we reach the output layer. This will return the 
 * activated result of the output layer which can be used to determine probability of 
 * labels, compute the cost function or perform backpropagation.
 *
 * @param {NDMatrix} ThetaLD: NxL dimensional matrix of parameters used to represent big-Θ.
 * @param {Matrix} X: m x (n+1) matrix of m-samples of n-features.
 */
NeuralNetwork.prototype.feedForward = function (ThetaLD, X) {
    var layers = ThetaLD.length;
    var input = X;
    for (var l = 0; l < layers; l++) {
        // obtain the weights in layer l
        var layerThetaM = ThetaLD[l];
        input = Matrix.sigmoid(input.multiply(layerThetaM.transpose()));

        // Modify the input to include the bias unit on each hidden layer
        if (l < layers - 1) {
            var dimensions = input.dimensions();
            var m = dimensions.rows;
            input = Matrix.Ones(m, 1).augment(input);
        }
    }

    return input;
};

NeuralNetwork.prototype.backpropagate = function () {
};

/**
 * Predicts the value probability output of the given input feature vector 
 * against the parameterized theta values calculated for each of the layers in the 
 * neural network.
 *
 * @param {NDMatrix} ThetaLD: NxL dimensional matrix of parameters used to represent big-Θ.
 * @param {Vector} input: n+1-dimensional vector of input features to calculate the output.
 */
NeuralNetwork.prototype.calculate = function (ThetaLD, input) {
    // Determine if the input is a matrix, an array or a vector
    var inputMatrix = null;
    if (input.length > 0) {
        inputMatrix = $M(input).transpose();
    }
    else if (input.row && input.elements) {
        inputMatrix = $M(input.elements).transpose();
    }
    else if (input.elements) {
        inputMatrix = input;
    }
    else {
        throw new Error('invalid input parameter, must provide element array, matrix or vector');
        return;
    }
    return this.feedForward(ThetaLD, input);
};

/**
 * Returns the set of labels and association probability for a given observation input.
 */
NeuralNetwork.prototype.getClassifications = function (input) {
    if (!this.trainedTheta) {
        throw new Error('must train the classifier first');
        return;
    }

    var result = this.calculate(this.trainedTheta, input);
    var labels = [];
    for (var k = 0; k < this.labels.length; k++) {
        labels.push({ label: this.labels[k], value: result.e(1, k+1) });
    }

    return labels.sort(function (x, y) { return y.value > x.value });
};

module.exports = NeuralNetwork;
