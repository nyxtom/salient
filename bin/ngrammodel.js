
var path = require('path'),
    util = require('util'),
    fs = require('fs');

var salient = require('./../');

var args = process.argv;
if (!args || args.length < 3) {
    console.log('usage: node ngrammodel en.wik.vocab');
    return;
}

var model = new salient.language.HiddenMarkovModel();
var vocabFile = args[2];

// initialize a vocabulary with the size 12 tagsets
model.loadVocab(vocabFile, 12, function () {
    model.estimateVocabulary();
    var s = JSON.stringify(model);
    fs.writeFileSync(path.join(__dirname, 'model.json'), s);
});
