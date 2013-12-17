
var CrossValidate = function (analyzerPrototype, analyzerOptions) {
    this.analyzerPrototype = analyzerPrototype;
    this.analyzerOptions = analyzerOptions;
};

/**
 * Obtains the analyzer using the configured prototype.
 *
 * @param {Number} lamba: Configured lamba value for the analyzer to regularize with.
 * @returns A new instance of the configured classifier with preconfigured options.
 */
CrossValidate.prototype.getAnalyzer = function (lambda) {
    var options = this.analyzerOptions || {};
    options.lambda = lambda;
    var analyzer = new this.analyzerPrototype(options);
    return analyzer;
};

CrossValidate.prototype.computeError = function (analyzer, inputValidationSamples, outputValidation) {
    var result = analyzer.train();
    var trainError = [0];
    if (result.length > 0) {
        for (var e = 0; e < result.length; e++) {
            trainError[e] = result[e].error;
        }
    }
    else {
        trainError[0] = result.error;
    }

    var validationError = analyzer.test(inputValidationSamples, outputValidation);
    return { 'trainError': trainError, 'validationError': validationError };
};

/**
 * Computes the learning curve by training the analyzer on a subset of the training examples to 
 * determine how well the learning algorithm is working as more data is added. The cross validation 
 * curve is computed in order to determine how well the learned parameters upon each iteration does 
 * on the cross validation data. All of which is computed based on a given regularlization parameter 
 * which can be determined by plotting the validation curve below for various regularization values.
 *
 * @param {Matrix|Array} inputSamples: The training samples to train the given classifier.
 * @param {Matrix|Array} output: The expected output values for each training sample.
 * @param {Matrix|Array} inputValidationSamples: The cross-validation samples to test the classifier against.
 * @param {Matrix|Array} outputValidation: The cross-validation expected output values for each cross-validation sample.
 *
 * @returns The learning curve used to plot whether the learning algorithm suffers from high bias or high variance.
 */
CrossValidate.prototype.learningCurve = function (inputSamples, output, inputValidationSamples, outputValidation, lambda) {
    var trainingErrorCurve = [];
    var validationErrorCurve = [];
    var m = 0;
    var cols = 1;
    if (inputSamples.elements) {
        m = inputSamples.rows();
        cols = inputSamples.cols();
    }
    else {
        m = inputSamples.length;
    }

    for (var i = 1; i <= m; i++) {
        var analyzer = this.getAnalyzer(lambda);
        if (!inputSamples.elements)
            analyzer.addExamples(inputSamples.slice(0, i), output.slice(0, i));
        else
            analyzer.addExamples(inputSamples.slice(1, i, 1, cols), output.slice(1, i, 1, 1));

        var result = this.computeError(analyzer, inputValidationSamples, outputValidation);
        trainingErrorCurve.push(result.trainError);
        validationErrorCurve.push(result.validationError);
    }

    return { 'trainingError': trainingErrorCurve, 'validationError': validationErrorCurve, 'samples': m };
};

/**
 * Calculates the cross-validation error curve in order to calculate the best fit 
 * regularization parameter provided from a list of lambda values. This is done by 
 * first training on the given training set for each lambda and using the trained theta 
 * without regularization tested on the given validation samples.
 *
 * @param {Number[]} lambdaVals: An array of regularization parameters to train against.
 * @param {Matrix|Array} inputSamples: The training samples to train the given classifier.
 * @param {Matrix|Array} output: The expected output values for each training sample.
 * @param {Matrix|Array} inputValidationSamples: The cross-validation samples to test the classifier against.
 * @param {Matrix|Array} outputValidation: The cross-validation expected output values for each cross-validation sample.
 *
 * @returns The cross validation curve used to find the best fit regularization parameter.
 */
CrossValidate.prototype.validationCurve = function (lambdaVals, inputSamples, output, inputValidationSamples, outputValidation) {
    var trainingErrorCurve = [];
    var validationErrorCurve = [];
    for (var i = 0; i < lambdaVals.length; i++) {
        var analyzer = this.getAnalyzer(lambdaVals[i]);
        analyzer.addExamples(inputSamples, output);

        var result = this.computeError(analyzer, inputValidationSamples, outputValidation);
        trainingErrorCurve.push(result.trainError);
        validationErrorCurve.push(result.validationError);
    }

    return { 'trainingError': trainingErrorCurve, 'validationError': validationErrorCurve, 'lambda': lambdaVals };
};

module.exports = CrossValidate;
