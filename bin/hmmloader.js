
var fs = require('fs');
var path = require('path');
var salient = require('./../')
var model = new salient.language.HiddenMarkovModel();

var args = process.argv;
if (!args || args.length == 2) {
    console.log('usage: node hmmloader.js model.json model.tagdist.json language.hmm.json');
    return;
}

var modelVocabFile = 'model.json';
var modelTagDistFile = 'model.tagdist.json';
if (args && args.length > 2) {
    modelVocabFile = args[2];
    if (args.length > 3)
        modelTagDistFile = args[3];
    if (args.length > 4)
        outputFile = args[4];
}

model.restore(path.join(__dirname, modelVocabFile));
model.restore(path.join(__dirname, modelTagDistFile));

var json = JSON.stringify(model);
fs.writeFileSync(outputFile || 'output.hmm.json', json);

module.exports = model;
