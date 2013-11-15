
var salient = require('./../../');
var LinearRegression = salient.regression.LinearRegression;
var plot = require('plotter').plot;

describe('linear_regression', function () {

    it('should be able to add examples and normalize them', function () {
        var regression = new LinearRegression();
        regression.addExample([1,2,3], 4);
        regression.addExample([4,5,6], 4);
        var normalizedMatrix = regression.normalize();
        expect(normalizedMatrix.eql($M([[1,-1,-1,-1],[1,1,1,1]]))).toBeTruthy();
    });

    it('should be able to load training, normalize and normalize input', function () {
        var regression = new LinearRegression();
        regression.load('./spec/regression/ex1data2.txt');
        regression.normalize();
        var result = regression.train();
        var normalInput = regression.normalizeInput([1650,3]);
        expect(regression.calculate(result.theta, normalInput).e(1)).toEqual(293081.46436300856);
    });

    it('should be able to perform regularization', function () {
        var regression = new LinearRegression({ lambda: 1, regularization: true });
        regression.load('./spec/regression/ex1data2.txt');
        regression.normalize();
        var result = regression.train();
        var normalInput = regression.normalizeInput([1650,3]);
        expect(regression.calculate(result.theta, normalInput).e(1)).toEqual(294135.15996768116);
    });

});
