
var util = require('util');
var Classifier = require('./../classifiers/classifier');
var SimpleNormalizer = require('./../normalizers/simple_normalizer');
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
    this.normalizer = options.normalizer || new SimpleNormalizer();
    this.layers = options.layers || [ 25 ]; // array of units per layer
    this.epsilon = options.epsilon || 0.13;
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
    this.identityLabels = Matrix.I(this.labels.length);
    var m = this.outputs.length;
    var mappedOutput = [];
    for (var i = 0; i < m; i++) {
        var ithActualValue = this.outputs[i][0];
        var ithOutputVector = this.identityLabels.row(ithActualValue);
        mappedOutput.push(ithOutputVector.elements);
    }

    this.mappedOutputMatrix = $M(mappedOutput);
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

/**
 * Trains the neural network using the standard backpropagation algorithm with 
 * gradient descent as the cost optimization method.
 */
NeuralNetwork.prototype.train = function () {
    if (!this.features) {
        this.normalize();
    }

    // Initialize theta to a random set of weights to start from
    var dim = this.features.dimensions();
    var inputConnections = dim.cols;
    var thetaLD = [];
    for (var l = 0; l < this.layers.length; l++) {
        var outputConnections = this.layers[l];
        thetaLD.push(this.randomInitialize(outputConnections, inputConnections));
        inputConnections = outputConnections + 1;
    }
    thetaLD.push(this.randomInitialize(this.labels.length, inputConnections));

    // Setup the gradient descent algorithm to run
    var result = this.gradientDescent(thetaLD, this.features, this.outputVector, 
                    this.alpha, this.iterations, this.lambda);
    this.trainedTheta = result.theta;
    return result;
};

/**
 * Tests the given samples and output according to the already trained theta.
 *
 * @returns The total error cost over the neural network.
 */
NeuralNetwork.prototype.test = function (samples, output) {
    var features = this.normalizer.normalize(samples);
    var outputVector = $M(output);
    var cost = this.computeCost(this.trainedTheta, features, outputVector);
    return cost;
};

/**
 * Initializes a random matrix set of weights using the preconfigured 
 * epsilon unit and random initialization algorithm for weights.
 *
 * @param {Number} r: Number of rows in the matrix
 * @param {Number} c: Number of columns in the matrix
 */
NeuralNetwork.prototype.randomInitialize = function (r, c) {
    return Matrix.Random(r, c).multiply(2 * this.epsilon).subtract(this.epsilon);
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
    var m = X.dimensions().rows;
    for (var k = 1; k <= this.labels.length; k++) {
        var labelKActivation = $M(activatedOutput.col(k));
        var yk = y.map(function (x, i) { return x == k ? 1 : 0; });
        var prob1 = labelKActivation.log().transpose().multiply(yk).e(1,1);
        var prob0 = labelKActivation.multiply(-1).add(1).log().transpose()
                                    .multiply((yk.multiply(-1).add(1))).e(1,1);
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
NeuralNetwork.prototype.feedForward = function (ThetaLD, X, includePropagation) {
    var layers = ThetaLD.length;
    var input = X;
    var output = [];
    for (var l = 0; l < layers; l++) {
        // obtain the weights in layer l
        var layerThetaM = ThetaLD[l];
        var weightedInputLayerL = input.multiply(layerThetaM.transpose());
        input = Matrix.sigmoid(weightedInputLayerL);

        // Modify the input to include the bias unit on each hidden layer
        if (l < layers - 1) {
            var dimensions = input.dimensions();
            var m = dimensions.rows;
            input = Matrix.Ones(m, 1).augment(input);
        }

        // Push the propagated values into the output if specified
        if (includePropagation) {
            output.push({ 'z': weightedInputLayerL, 'a': input });
        }
    }

    if (includePropagation) {
        return output;
    }
    else {
        return input;
    }
};

/**
 * Performs the standard neural network implementation of gradient descent using 
 * back propagation using the given alpha learning rate for the number of iterations. This is 
 * done by computing the gradient via backpropagation and applying the difference between 
 * the old weights and the partial derivative gradient times the learning rate alpha.
 *
 * W = W - alpha * partial-derivative-gradient[via back-propagation]
 *
 * @param {NDMatrix} ThetaLD: the NxL dimensional matrix of parameters for each layer.
 * @param {Matrix} X: m x (n+1) matrix of m-samples of n-features.
 * @param {Vector} y: m x 1-dimensional vector of output values.
 * @param {Number} alpha: alpha learning rate used to optimized the weights
 * @param {Number} iterations: the number of iterations to run gradient descent
 * @param {Vector} lambda: n+1-dimensional vector of regularization parameter.
 */
NeuralNetwork.prototype.gradientDescent = function (ThetaLD, X, y, alpha, iterations, lambda) {
    var history = [];
    var m = X.rows();

    for (var i = 0; i < iterations; i++) {
        var thetaLDResult = this.backpropagate(ThetaLD, X, y, lambda);
        for (var l = 0; l < thetaLDResult.length; l++) {
            thetaLDResult[l] = ThetaLD[l].add(thetaLDResult[l].multiply(-1 * alpha));
        }
        ThetaLD = thetaLDResult;
        history.push(this.computeCost(ThetaLD, X, y, lambda));
    }

    var error = this.computeCost(ThetaLD, X, y);
    return { 'theta': ThetaLD, 'cost': history, 'error': error };
};

/**
 * Standard implementation of the backpropagation algorithm by using 
 * the given set of weights, input and output - this function will perform 
 * the feed forward and back propagation of the given weights in order to 
 * propagate the aggregated error of the network. Moreover, this will need 
 * to perform feed forward, followed by:
 *
 * d3 = delta of proposed predicted values in the output layer - actual output.
 * theta2_gradient = theta in the final layer * d3;
 *
 * sum of weighted delta error (of the given hidden layer) * sigmoid gradient of 
 *  the weighted input mapping from the current hidden layer - 1 (or input layer if 
 *  there is only 1 hidden layer).
 * 
 * Finally, this process leads us to the backpropagation of each layer's theta gradient
 * which can be used to parameterize for gradient descent.
 *
 * @param {NDMatrix} ThetaLD: NxL dimensional matrix of parameters used to represent big-Θ.
 * @param {Matrix} X: m x (n+1) matrix of m-samples of n-features.
 * @param {Vector} y: m x 1-dimensional vector of output values.
 * @param {Vector} lambda: n+1-dimensional vector of regularization parameter.
 */
NeuralNetwork.prototype.backpropagate = function (ThetaLD, X, y, lambda) {
    var output = this.feedForward(ThetaLD, X, true);
    var layers = ThetaLD.length;
    var ThetaGrad = [];
    for (var l = 0; l < layers; l++) {
        var thetaLDimensions = ThetaLD[l].dimensions();
        ThetaGrad.push(Matrix.Zeros(thetaLDimensions.rows, thetaLDimensions.cols));
    }

    var prediction = output[output.length - 1].a;
    var deltaOutput = prediction.subtract(this.mappedOutputMatrix);
    for (var l = layers - 1; l >= 0; l--) {
        var thetaL = ThetaLD[l];
        var thetaGrad = ThetaGrad[l];
        var activationMinus1 = l == 0 ? X : output[l-1].a;

        // gradient function in the next few lines
        var m = deltaOutput.rows();
        for (var i = 1; i <= m; i++) {
            var activeDelta = $M(deltaOutput.row(i)).multiply($M(activationMinus1.row(i)).transpose());
            thetaGrad = thetaGrad.add(activeDelta);
        }
        //var activatedDelta = deltaOutput.transpose().multiply(activationMinus1);
        //thetaGrad = thetaGrad.add(activatedDelta);
        ThetaGrad[l] = thetaGrad;

        // Calculate the propagated weight using the previous delta output
        var weightedErrorL = deltaOutput.multiply(thetaL);

        // Using the current layer - 1 weighted input values, 
        // we can calculate the distributed error weight using the sigmoid 
        if (l == 0)
            break;

        var weightedInputMinus1 = output[l-1].z;
        var augmentWeightedInputMinus1 = Matrix.Ones(weightedInputMinus1.rows(), 1).augment(weightedInputMinus1.sigmoidGradient());
        deltaOutput = weightedErrorL.elementMultiply(augmentWeightedInputMinus1);
        deltaOutput = deltaOutput.slice(1, deltaOutput.rows(), 2, deltaOutput.cols());
    }

    var m = X.rows();
    for (var i = 0; i < ThetaGrad.length; i++) {
        var grad = ThetaGrad[i];
        grad = grad.div(m);
        var dim = grad.dimensions();
        var gradAugment = Matrix.Zeros(dim.rows, 1).augment(grad.slice(1, dim.rows, 2, dim.cols));
        var adjust = lambda / m;
        grad = grad.add(gradAugment.multiply(adjust));
        ThetaGrad[i] = grad;
    }

    return ThetaGrad;
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
    if (input.length > 0) {
        return this.feedForward(ThetaLD, $M(input).transpose());
    }
    else if (input.elements) {
        if (input.elements[0][0]) {
            return this.feedForward(ThetaLD, input);
        }
        else {
            return this.feedForward(ThetaLD, $M(input.elements).transpose());
        }
    }
    else {
        throw new Error('invalid input parameter, must provide element array, matrix or vector');
        return;
    }
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
