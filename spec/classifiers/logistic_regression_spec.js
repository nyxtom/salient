
var Classifier = require('../../lib/salient/classifiers/logistic_regression');

describe('logistic regression', function () {
    it('should be able to calculate the sigmoid function', function () {
        var classifier = new Classifier();
        expect(classifier.sigmoid(99999)).toEqual(1);
        expect(classifier.sigmoid(-99999)).toEqual(0);
    });

    it('should be able to add examples, train on them and successfully classify new inputs', function () {
        var classifier = new Classifier();
        for (var i = 0; i < 10; i++) {
            classifier.addExample([i,i,i,i,i,i,i,i,i], "0-9");
        }
        for (var i = 10; i < 20; i++) {
            classifier.addExample([i,i,i,i,i,i,i,i,i], "10-20");
        }
        for (var i = 20; i < 30; i++) {
            classifier.addExample([i,i,i,i,i,i,i,i,i], "20-30");
        }
        var normOutput = classifier.normalize();
        var output = classifier.train();
        var normInput = classifier.normalizeInput([1,2,3,1,4,2,3,4,5]);
        var label = classifier.classify(normInput);
        expect(label).toEqual('0-9');

        normInput = classifier.normalizeInput([10,18,15,11,14,12,13,14,19]);
        label = classifier.classify(normInput);
        expect(label).toEqual('10-20');

        normInput = classifier.normalizeInput([10,28,25,21,24,12,23,24,29]);
        label = classifier.classify(normInput);
        expect(label).toEqual('20-30');
    });
});
