
var path = require('path'),
    util = require('util'),
    fs = require('fs');

var salient = require('./../');

var args = process.argv;
if (!args || args.length < 4) {
    console.log('usage: node mergevocabulary en.wik.vocab covered.corpus.vocab');
    return;
}

var wikVocabFile = args[2];
var corpusVocabFile = args[3];

function readDict(file) {
    var vocab = {};
    var lines = fs.readFileSync(file).toString().split('\n');
    for (var l = 0; l < lines.length; l++) {
        var line = lines[l];
        var items = line.split('\t');
        if (!items || items.length < 2)
            continue;

        // ID TOKEN POS,POS POSFREQ,POSFREQ
        var w = items[1].toLowerCase();
        if (items.length == 4) {
            vocab[w] = { pos: items[2], posFreq: items[3], id: items[0], w: w };
        }
        else if (items.length == 3) {
            vocab[w] = { pos: items[2], id: items[0], w: w };
        }
    }

    vocab._length = lines.length;
    return vocab;
}

var dict = readDict(wikVocabFile);
var corpusV = readDict(corpusVocabFile);
var newOutput = path.join(__dirname, 'corpus.vocab');

// Determine whether the corpus is a subset, supset, overlap or disjoint set of the vocabulary
var newCorpusVocab = [];
for (var c in corpusV) {
    if (typeof dict[c] != 'undefined') {
        newCorpusVocab.push(corpusV[c]);
    }
}

// Determine whether the vocabulary is a subset, supset, overlap or disjoint set of the corpus
for (var c in dict) {
    if (typeof corpusV[c] == 'undefined') {
        newCorpusVocab.push(dict[c]);
    }
}

for (var i = 0; i < newCorpusVocab.length; i++) {
    var item = newCorpusVocab[i];
    var additionLine = "";
    if (item.posFreq) {
        additionLine = util.format('%s\t%s\t%s\t%s\n', i, item.w, item.pos, item.posFreq);
    }
    else {
        additionLine = util.format('%s\t%s\t%s\n', i, item.w, item.pos);
    }
    fs.appendFileSync(newOutput, additionLine);
}
