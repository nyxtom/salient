
var salient = require('./../../');

describe('sentiment', function () {
    it('should be able to classify a sentence as positive or negative', function () {
        var s = new salient.sentiment.BayesSentimentAnalyser();
        var result = s.classify('This is crazy good');
        expect(result > 0.1).toEqual(true);
    });
});
