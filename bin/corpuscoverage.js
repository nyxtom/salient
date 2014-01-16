
var path = require('path'),
    util = require('util'),
    fs = require('fs');

var salient = require('./../');

var args = process.argv;
if (!args || args.length < 5) {
    console.log('usage: node corpuscoverage en.wik.dist en.wik.vocab en-brown.tag.vocab');
    return;
}

var wikDistFile = args[2];
var wikVocabFile = args[3];
var corpusVocabFile = args[4];

function readDist(file) {
    var dist = {};
    var lines = fs.readFileSync(file).toString().split('\n');
    for (var l = 0; l < lines.length; l++) {
        var line = lines[l];
        if (line.indexOf('#') == 0) {
            continue;
        }

        var items = line.split('\t');
        if (items.length != 4) {
            continue;
        }

        var i = parseInt(items[0]);
        var tag = items[1];
        var freq = items[2];
        dist[tag] = { i: i, t: tag, f: freq };
    }

    return dist;
};

function readDict(file, corpus) {
    var vocab = {};
    var lines = fs.readFileSync(file).toString().split('\n');
    for (var l = 0; l < lines.length; l++) {
        var line = lines[l];
        var items = line.split('\t');
        if (!items || items.length < 2)
            continue;

        if (corpus) {
            // TOKEN FREQUENCY POS/FREQ,POS/FREQ OR TOKEN FREQUENCY
            var w = items[0].toLowerCase();
            vocab[w] = { freq: items[1], id: l.toString() }
            if (items.length > 2) {
                vocab[w].pos = items[2];
            }
        }
        else if (items.length > 2) {
            // ID TOKEN POS,POS
            var w = items[1].toLowerCase();
            vocab[w] = { pos: items[2], id: items[0] };
        }
    }

    return vocab;
}

function mapCorpus(vocab, dist) {
    for (var v in vocab) {
        var pos = vocab[v].pos;
        if (pos) {
            var result = [];
            var items = pos.split(',');
            for (var i = 0; i < items.length; i++) {
                var item = items[i].split('/');
                var tag = item[0];
                if (typeof dist[tag] != 'undefined') {
                    var tagId = dist[tag].i;
                    if (result.indexOf(tagId) < 0) {
                        result.push(tagId);
                    }
                }
                else {
                    console.log('unmapped', v, vocab[v]);
                }
            }
            vocab[v].pos = result.join(',');
        }
    }
}

var dict = readDict(wikVocabFile, false);
var corpusV = readDict(corpusVocabFile, true);
var distribution = readDist(wikDistFile);

mapCorpus(corpusV, distribution);

// Determine whether the corpus is a subset, supset, overlap or disjoint set of the vocabulary
var corpusCovered = 0;
var corpusUncovered = 0;
var uncoveredOutput = path.join(__dirname, 'uncovered.corpus.vocab');
for (var c in corpusV) {
    if (typeof dict[c] != 'undefined') {
        corpusCovered++;
    }
    else {
        var item = corpusV[c];
        var additionLine = util.format('%s\t%s\t%s\n', item.id, c, item.pos);
        fs.appendFileSync(uncoveredOutput, additionLine);
        corpusUncovered++;
    }
}

// Determine whether the vocabulary is a subset, supset, overlap or disjoint set of the corpus
var countCovered = 0;
var countUncovered = 0;
for (var c in dict) {
    if (typeof corpusV[c] != 'undefined') {
        countCovered++;
    }
    else {
        countUncovered++;
    }
}

console.log(util.format('%s found in vocab, %s not found in vocab. %s% covered', corpusCovered,
            corpusUncovered, (corpusCovered / (corpusCovered + corpusUncovered))));

console.log(util.format('%s found in corpus, %s not found in corpus. %s% covered', countCovered,
            countUncovered, (countCovered / (countCovered + countUncovered))));
