
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

    it('should be able to add examples and normalize them, and compute the cost', function () {
        var nn = new salient.neuralnetworks.NeuralNetwork();
        var m = X.dimensions().rows / 100;
        for (var i = 1; i <= m; i++) {
            var outputi = y.row(i).e(1,1);
            var inputi = X.row(i).elements;
            nn.addExample(inputi, outputi);
        }
        expect(nn.features).toEqual(undefined);
        nn.normalize();
        var dim = nn.features.dimensions();
        expect(dim.cols).toEqual(401);
        expect(dim.rows).toEqual(50);

        var cost = nn.computeCost(trainedTheta, nn.features, nn.outputVector, 0.3);
        expect(cost).toEqual(2.9057589324472515);
    });

});
