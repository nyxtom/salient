
var path = require('path');

var salient = require('./../');
var model = new salient.language.HiddenMarkovModel();
model.restore(path.join(__dirname, 'model.json'));
model.restore(path.join(__dirname, 'model.tagdist.json'));

var results = model.viterbi(['Where','is','the','train','?']);
/*
for (var k = 0; k < results.pi.length; k++) {
    var item = results.pi[k];
    var argMax;
    for (var t1 in item) {
        for (var t2 in item[t1]) {
            var prob = item[t1][t2];
            if (!argMax || prob > argMax.p) {
                argMax = { t1: t1, t2: t2, p: prob };
            }
        }
    }
}*/
console.log(JSON.stringify(results));
