
var salient = require('../../lib/salient/');
var Matrix = salient.math.Matrix;

var theta1 = Matrix.load('./spec/math/weights1.dat');
var theta2 = Matrix.load('./spec/math/weights2.dat');
var sample = Matrix.load('./spec/math/sample.dat'); // sample has been modified to already inclue the bias parameter
var X = Matrix.load('./spec/math/samplesx.dat');
var y = Matrix.load('./spec/math/samplesy.dat');
var trainedTheta = [theta1, theta2];

describe('neural network classifier', function () {

    it('should be able to perform feedforward propagation for a set of layered weights against an input feature vector', function () {
        var nn = new salient.neuralnetworks.NeuralNetwork();
        var result = nn.feedForward(trainedTheta, sample);
        var dim = result.dimensions();
        expect(dim.cols).toEqual(10);
        var maxIndex = result.maxIndex();
        expect(maxIndex.row).toEqual(1);
        expect(maxIndex.col).toEqual(10);
    });

    it('should be able to perform feedforward propagation with propagated output for a set of layered weights against an input feature vector', function () {
        var nn = new salient.neuralnetworks.NeuralNetwork();
        var result = nn.feedForward(trainedTheta, sample, true);
        expect(result.length).toEqual(2);
        var maxIndex = result[1].a.maxIndex();
        expect(maxIndex.row).toEqual(1);
        expect(maxIndex.col).toEqual(10);
    });

    it('should be able to correctly obtain the class', function () {
        var nn = new salient.neuralnetworks.NeuralNetwork();
        nn.trainedTheta = trainedTheta;
        nn.labels = [1,2,3,4,5,6,7,8,9,10];
        expect(nn.classify(sample)).toEqual(10);
        var m = X.dimensions().rows;
        var misclassified = 0;
        for (var i = 1; i <= m; i++) {
            var outputi = y.row(i).e(1,1);
            var inputi = X.row(i).elements;
            inputi.unshift(1);
            var isCorrect = nn.classify(inputi) == outputi;
            if (!isCorrect) {
                misclassified++;
            }
        }
        var percentCorrect = (1.0 - (misclassified / m)) * 100.0;
        expect(percentCorrect).toEqual(97.52);
    });

    it('should be able to add examples and normalize them, and compute the cost', function () {
        var nn = new salient.neuralnetworks.NeuralNetwork();
        var m = X.dimensions().rows / 10;
        nn.labels = [1,2,3,4,5,6,7,8,9,10];
        for (var i = 1; i <= m; i++) {
            var outputi = y.row(i).e(1,1);
            var inputi = X.row(i).elements;
            nn.addExample(inputi, outputi);
        }
        expect(nn.features).toEqual(undefined);
        nn.normalize();
        var dim = nn.features.dimensions();
        expect(dim.cols).toEqual(401);
        expect(dim.rows).toEqual(500);

        var cost = nn.computeCost(trainedTheta, nn.features, nn.outputVector, 0);
        expect(cost).toEqual(0.14982239144665388);
    });

    it('should be able to backpropagate sample values', function () {
        var nn = new salient.neuralnetworks.NeuralNetwork();
        var m = X.dimensions().rows / 10;
        for (var i = 1; i <= m; i++) {
            var outputi = y.row(i).e(1,1);
            var inputi = X.row(i).elements;
            nn.addExample(inputi, outputi);
        }
        expect(nn.features).toEqual(undefined);
        nn.labels = [1,2,3,4,5,6,7,8,9,10];
        nn.normalize();
        nn.backpropagate(trainedTheta, nn.features, nn.outputVector, 0.3);
    });

    it('should be able to train the network', function () {
        var nn = new salient.neuralnetworks.NeuralNetwork();
        nn.labels = [1,2,3,4,5,6,7,8,9,10];
        nn.lambda = 3;
        nn.alpha = 0.09;
        nn.iterations = 2;
        var m = X.dimensions().rows / 10;
        for (var i = 1; i <= m; i++) {
            var outputi = y.row(i).e(1,1);
            var inputi = X.row(i).elements;
            nn.addExample(inputi, outputi);
        }

        var result = nn.train();
        var value = result.cost[0];
        var latestValue = result.cost[result.cost.length - 1];
        expect(value > latestValue).toEqual(true);
    });

});
