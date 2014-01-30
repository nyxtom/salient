
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
            vocab[w] = { freq: parseInt(items[1]), id: l.toString(), w: w }
            if (items.length > 2) {
                vocab[w].pos = items[2];
            }
        }
        else if (items.length > 2) {
            // ID TOKEN POS,POS
            var w = items[1].toLowerCase();
            vocab[w] = { pos: items[2], id: items[0], w: w };
        }
    }

    vocab._length = lines.length;
    return vocab;
}

function mapCorpus(vocab, dist) {
    for (var v in vocab) {
        var pos = vocab[v].pos;
        if (pos) {
            var result = [];
            var resultFreq = [];
            var items = pos.split(',');
            for (var i = 0; i < items.length; i++) {
                var item = items[i].split('/');
                var tag = item[0];
                var tagFreq = item[1];
                if (typeof dist[tag] != 'undefined') {
                    var tagId = dist[tag].i;
                    if (result.indexOf(tagId) < 0) {
                        result.push(tagId);
                        resultFreq.push(tagFreq);
                    }
                }
            }
            vocab[v].pos = result.join(',');
            vocab[v].posFreq = resultFreq.join(',');
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
var coveredOutput = path.join(__dirname, 'covered.corpus.vocab');
var uncoveredSorted = [];
var coveredSorted = [];
for (var c in corpusV) {
    if (typeof dict[c] != 'undefined') {
        coveredSorted.push(corpusV[c]);
        corpusCovered++;
    }
    else {
        var item = corpusV[c];
        // determine if the item falls under a numeric or money category ala regex
        if (c.match(/\$?\d+/)) {
            continue;
        }

        uncoveredSorted.push(item);
        corpusUncovered++;
    }
}

uncoveredSorted = uncoveredSorted.sort(function (a, b) { return b.freq - a.freq });
for (var i = 0; i < corpusUncovered; i++) {
    var item = uncoveredSorted[i];
    var additionLine = util.format('%s\t%s\t%s\t%s\n', dict._length + i, item.w, item.pos, item.posFreq);
    fs.appendFileSync(uncoveredOutput, additionLine);
}

coveredSorted = coveredSorted.sort(function (a, b) { return b.freq - a.freq });
for (var i = 0; i < corpusCovered; i++) {
    var item = coveredSorted[i];
    var additionLine = util.format('%s\t%s\t%s\t%s\n', dict._length + i, item.w, item.pos, item.posFreq);
    fs.appendFileSync(coveredOutput, additionLine);
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
            corpusUncovered, Math.round(100 * corpusCovered / (corpusCovered + corpusUncovered))));

console.log(util.format('%s found in corpus, %s not found in corpus. %s% covered', countCovered,
            countUncovered, Math.round(100 * countCovered / (countCovered + countUncovered))));
