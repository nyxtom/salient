
var CrossValidate = function (classifierPrototype, classifierOptions) {
    this.classifierPrototype = classifierPrototype;
    this.classifierOptions = classifierOptions;
};

/**
 * Obtains the classifier using the configured prototype.
 *
 * @param {Number} lamba: Configured lamba value for the classifier to regularize with.
 * @returns A new instance of the configured classifier with preconfigured options.
 */
CrossValidate.prototype.getClassifier = function (lambda) {
    var options = this.classifierOptions || {};
    options.lambda = lambda;
    var classifier = new this.classifierPrototype(options);
    return classifier;
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
        var classifier = this.getClassifier(lambdaVals[i]);
        classifier.addExamples(inputSamples, output);

        var result = classifier.train();
        var trainError = 0;
        if (result.length > 0) {
            for (var e = 0; e < result.length; e++) {
                trainError += result[e].error;
            }
        }
        else {
            trainError = result.error;
        }

        var validationError = classifier.test(inputValidationSamples, outputValidation);
        trainingErrorCurve.push(trainError);
        validationErrorCurve.push(validationError);
    }

    return { 'trainingError': trainingErrorCurve, 'validationError': validationErrorCurve, 'lambda': lambdaVals };
};

module.exports = CrossValidate;
