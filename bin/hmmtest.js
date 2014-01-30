
var path = require('path');

var salient = require('./../');
var model = new salient.language.HiddenMarkovModel();
model.restore(path.join(__dirname, 'model.json'));
model.restore(path.join(__dirname, 'model.tagdist.json'));

var results = model.viterbi(['i','am','starting','to','have','faith']);
console.log(JSON.stringify(results));

results = model.viterbi(['this','is','another','test']);
console.log(JSON.stringify(results));

results = model.viterbi(['the','programmer','is','coding','every','day']);
console.log(JSON.stringify(results));

results = model.viterbi(['the','dog','is','beautiful','and','perfect']);
console.log(JSON.stringify(results));
