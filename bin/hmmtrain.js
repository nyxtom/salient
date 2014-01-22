
var path = require('path'),
    util = require('util'),
    fs = require('fs');

var salient = require('./../');

var args = process.argv;
if (!args || args.length < 5) {
    console.log('usage: node hmmtrain model.training.json model.validation.json model.test.json');
    return;
}

var trainModel = new salient.language.HiddenMarkovModel();
var validationModel = new salient.language.HiddenMarkovModel();
var testModel = new salient.language.HiddenMarkovModel();
var trainDataFile = args[2];
var validationDataFile = args[3];
var testDataFile = args[4];

trainModel.restore(path.join(__dirname, trainDataFile));
validationModel.restore(path.join(__dirname, validationDataFile));
testModel.restore(path.join(__dirname, testDataFile));

var lambda = [];
for (var i = 1; i < 100; i++) {
    lambda.push(i * 0.01);
}

var lambdaV = [];
for (var i = 0; i < lambda.length; i++) {
    for (var i2 = 0; i2 < lambda.length; i2++) {
        for (var i3 = 0; i3 < lambda.length; i3++) {
            var l1 = lambda[i];
            var l2 = lambda[i2];
            var l3 = lambda[i3];
            if (l1 + l2 + l3 == 1.0) {
                lambdaV.push([l1, l2, l3]);
            }
        }
    }
}

// begin cross validation
var scores = [];
var maxScore;
var maxIndex = 0;
var percentComplete = 0;
for (var i = 0; i < lambdaV.length; i++) {
    trainModel.lambdaV = lambdaV[i];
    trainModel.estimateTagDistribution();
    var score = trainModel.crossValidate(validationModel);
    scores.push({ s: score, lambda: trainModel.lambdaV });
    if (!maxScore || score > maxScore) {
        maxScore = score;
        maxIndex = i;
    }
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write('Validation ' + (i + 1) + '/' + lambdaV.length + '. Best score: ' + maxScore + '.');
}

var best = scores[maxIndex];
console.log('\nBest cross validation error:', best, 'out of', lambdaV.length, 'configurations');

// begin test
trainModel.lambdaV = best.lambda;
trainModel.estimateTagDistribution();
var bestScore = trainModel.crossValidate(testModel);
console.log('Test error score:', bestScore);
