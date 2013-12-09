
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

        var result = analyzer.train();
        var trainError = 0;
        if (result.length > 0) {
            for (var e = 0; e < result.length; e++) {
                trainError += result[e].error;
            }
        }
        else {
            trainError = result.error;
        }

        var validationError = analyzer.test(inputValidationSamples, outputValidation);
        trainingErrorCurve.push(trainError);
        validationErrorCurve.push(validationError);
    }

    return { 'trainingError': trainingErrorCurve, 'validationError': validationErrorCurve, 'lambda': lambdaVals };
};

module.exports = CrossValidate;
