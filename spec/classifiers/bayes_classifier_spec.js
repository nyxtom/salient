
var Classifier = require('../../lib/salient/classifiers/bayes_classifier');

describe('bayes_classifier', function () {

    describe('classifier', function () {
        it('should classify with arrays', function () {
            var classifier = new Classifier();
            classifier.addExample(['fix', 'box'], 'computing');
            classifier.addExample(['write', 'code'], 'computing');
            classifier.addExample(['script', 'code'], 'computing');
            classifier.addExample(['write', 'book'], 'literature');
            classifier.addExample(['read', 'book'], 'literature');
            classifier.addExample(['study', 'book'], 'literature');
            
            expect(classifier.classify(['bug', 'code'])).toEqual('computing');
            expect(classifier.classify(['read', 'thing'])).toEqual('literature');
        });

        it('should provide all classification scores', function() {
            var classifier = new Classifier();
            classifier.addExample(['fix', 'box'], 'computing');
            classifier.addExample(['write', 'code'], 'computing');
            classifier.addExample(['script', 'code'], 'computing');
            classifier.addExample(['write', 'book'], 'literature');
            classifier.addExample(['read', 'book'], 'literature');
            classifier.addExample(['study', 'book'], 'literature');

            expect(classifier.getClassifications(['i','write','code'])[0].label).toEqual('computing');
            expect(classifier.getClassifications(['i','write','code'])[0].label).toEqual('computing');
        });

        it('should be able to save and load', function () {
            var classifier = new Classifier();
            classifier.addExample(['fix', 'box'], 'computing');
            classifier.addExample(['write', 'code'], 'computing');
            classifier.addExample(['script', 'code'], 'computing');
            classifier.addExample(['write', 'book'], 'literature');
            classifier.addExample(['read', 'book'], 'literature');

            var obj = classifier.save();
            var newClassifier = Classifier.restore(obj);

            newClassifier.addExample(['kick', 'ball'], 'sports');
            newClassifier.addExample(['shoot', 'ball'], 'sports');

            expect(newClassifier.classify(['bug','code'])).toEqual('computing');
            expect(newClassifier.classify(['read','the','book'])).toEqual('literature');
            expect(newClassifier.classify(['i','kick','this','ball'])).toEqual('sports');

        });

    });

});
