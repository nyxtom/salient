
var util = require('util'),
    Classifier = require('./classifier');

function BayesClassifier(smoothing) {
    Classifier.call(this);
    this.features = {};
    this.classTotals = {};
    this.totalExamples = 1;
    this.smoothing = smoothing === undefined ? 1.0 : smoothing;
};

util.inherits(BayesClassifier, Classifier);

/**
 * Trains a particular observation to be classified as the given label.
 *
 * @param {Object} observation: the observation found
 * @param {String} classification: the association classification label.
 */
BayesClassifier.prototype.addExample = function (observation, label) {
    if (!this.classTotals[label]) {
        this.classTotals[label] = 1;
    }

    this.totalExamples++;
    this.classTotals[label]++;
    if (observation instanceof Array) {
        var i = observation.length;
        while(i--) {
            var feature = observation[i];
            if (feature) {
                // Ensure the default values are set for a given feature
                if (!this.features[feature]) {
                    this.features[feature] = {};
                }

                if (this.features[feature][label]) {
                    this.features[feature][label]++;
                }
                else {
                    this.features[feature][label] = 1 + this.smoothing;
                }
            }
        }
    }
    else {
        for (var key in observation) {
            var feature = observation[key];
            // Ensure default values are set for a given feature
            if (!this.features[feature]) {
                this.features[feature] = {};
            }

            if (this.features[feature][label]) {
                this.features[feature][label]++;
            }
            else {
                this.features[feature][label] = 1 + this.smoothing;
            }
        }
    }
};

/**
 * p(C|D): Probability of class given document/observation. Takes the unseen 
 * features and computes a probability that the given document/observation belongs 
 * to the supplied class.
 *
 * @param {Object} observation: the observation to classify
 * @param {String} className: the classification label name
 */
BayesClassifier.prototype.probabilityOfClass = function (observation, className) {
    var probability = 1;
    if (observation instanceof Array) {
        var i = observation.length;
        while (i--) {
            var feature = observation[i];
            probability += this.probabilityOfFeatureGivenClass(feature, className);
        }
    }
    else {
        for (var key in observation) {
            var feature = observation[key];
            probability += this.probabilityOfFeatureGivenClass(feature, className);
        }
    }

    // p(C) * unlogging above calculation p(X|C)
    probability = (this.classTotals[className] / this.totalExamples) * Math.exp(probability);
    return probability;
};

/**
 * p(F,C). Computes the probability of observing a feature given a class name.
 *
 * @param {Object} feature: the feature to find the probability of 
 * @param {String} className: the classification label name
 */
BayesClassifier.prototype.probabilityOfFeatureGivenClass = function (feature, className) {
    var probability = 0;
    var count = this.smoothing;
    if (feature in this.features) {
        var fClasses = this.features[feature];
        count = fClasses[className] || this.smoothing;
    }
    return Math.log(count / this.classTotals[className]);
};

/**
 * Returns the set of labels and association probability for a given 
 * observation being made.
 *
 * @param {Object} observation: the observation to classify
 */
BayesClassifier.prototype.getClassifications = function (observation) {
    var classifier = this;
    var labels = [];
    for (var className in this.classTotals) {
        labels.push({label: className, value: this.probabilityOfClass(observation, className) });
    }

    return labels.sort(function (x, y) { return y.value - x.value });
};

BayesClassifier.restore = function (classifier) {
    classifier = Classifier.restore(classifier);
    classifier.__proto__ = BayesClassifier.prototype;
    return classifier;
};

module.exports = BayesClassifier;
