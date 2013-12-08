
function Classifier() {
};

/**
 * Restores the classifier from a json saved model.
 *
 * @param {String} classifier saved json model.
 */
Classifier.restore = function (classifier) {
    classifier = typeof classifier == 'string' ? JSON.parse(classifier) : classifier;
    return classifier;
};

/**
 * Saves the given classifier to a json model including the type information.
 */
Classifier.prototype.save = function () {
    var json = JSON.stringify(this);
    return json;
};

/**
 * Trains a particular observation to be classified as the given label.
 *
 * @param {Object} observation: the observation found
 * @param {String} classification: the association classification label.
 */
Classifier.prototype.addExample = function (observation, classification) {
};

/**
 * Trains a particular set of observations to be classified as the given labels.
 * 
 * @param {Object} observation: the observation found
 * @param {String} classification: the association classification label.
 */
Classifier.prototype.addExamples = function (observations, classifications) {
    if (observations.elements) {
        var m = observations.rows();
        for (var i = 1; i <= m; i++) {
            var outputi = classifications.row(i).e(1,1);
            var inputi = observations.row(i).elements;
            this.addExample(inputi, outputi);
        }
    }
    else {
        var m = observations.length;
        for (var i = 0; i < m; i++) {
            this.addExample(observations[i], classifications[i]);
        }
    }
};

/**
 * Prototype function for loading in a particular database or training set 
 * data in order to add many examples to the classifier.
 */
Classifier.prototype.train = function () {};

/**
 * Returns the appropriate set of probabilities that the given 
 * observation is found according to the nearest labels.
 *
 * @param {Object} observation: the observation to classify
 */
Classifier.prototype.classify = function (observation) {
    var labels = this.getClassifications(observation);
    if (labels && labels.length > 0 && labels[0].label) {
        return labels[0].label;
    }

    return undefined;
};

/**
 * Returns the set of labels and association probability for a given 
 * observation being made.
 *
 * @param {Object} observation: the observation to classify
 */
Classifier.prototype.getClassifications = function (observation) {
};

module.exports = Classifier;
