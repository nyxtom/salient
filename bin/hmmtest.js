
var path = require('path'),
    util = require('util'),
    fs = require('fs');

var salient = require('./../');

var args = process.argv;
if (!args || args.length < 3) {
    console.log('usage: node hmmtest en-brown.sentences [en.hmm.json] --lines=10000 --skip=10000');
    return;
}

var sentencesFile = args[2];
var modelFile = path.join(__dirname, 'en.hmm.json');
var lineLimit = 0;
var skip = 0;
if (args.length > 3) {
    for (var i = 3; i < args.length; i++) {
        if (args[i].indexOf('--lines=') == 0) {
            lineLimit = parseInt(args[i].split('=')[1]);
        }
        else if (args[i].indexOf('--skip=') == 0) {
            skip = parseInt(args[i].split('=')[1]);
        }
        else {
            modelFile = path.join(__dirname, args[3]);
        }
    }
}

var model = new salient.language.HiddenMarkovModel();
model.restore(modelFile);

var lines = fs.readFileSync(sentencesFile).toString().split('\n');
var incorrectSentences = 0;
var totalIncorrectTags = 0;
var totalSentences = 0;
var totalTags = 0;
var startTime = new Date().getTime();
var limit = lineLimit > 0 ? skip + lineLimit : lines.length;
var incorrectSentenceGroups = {};
var incorrectTokensToTags = {};
for (var l = skip; l < limit; l++) {
    var line = lines[l].trim();
    if (line.length == 0)
        continue;

    var tokenPairs = line.split(' ');
    var tokens = [];
    var expectedTags = [];
    for (var i = 0; i < tokenPairs.length; i++) {
        if (tokenPairs[i].trim().length == 0)
            continue;

        var splitIndex = tokenPairs[i].trim().lastIndexOf('/');
        var token = tokenPairs[i].trim().substring(0, splitIndex);
        var tag = tokenPairs[i].trim().substring(splitIndex + 1);
        tokens.push(token);
        expectedTags.push(tag);
    }

    var results = model.viterbi(tokens);
    var incorrectTags = 0;
    var incorrectHigh = false;
    for (var i = 0; i < expectedTags.length; i++) {
        if (results.y.length > i) {
            /*
            if (results.y[i] == "PRON" && expectedTags[i] == "NOUN") {
            }
            else if (results.y[i] == "NOUN" && expectedTags[i] == "PRON") {
            }
            else if (results.y[i] == "NUM" && expectedTags[i] == "NOUN") {
            }
            else if (results.y[i] == "NUM" && expectedTags[i] == "ADJ") {
            }
            else if (results.y[i] == 'X' && expectedTags[i] == '.') {
            }
            else if (results.y[i] == '.' && expectedTags[i] == 'X') {
            }
            */
            if (results.y[i] != expectedTags[i]) {
                var tag = expectedTags[i] + "/" + results.y[i];
                if (!incorrectTokensToTags.hasOwnProperty(tokens[i])) {
                    incorrectTokensToTags[tokens[i]] = {};
                }
                if (!incorrectTokensToTags[tokens[i]].hasOwnProperty(tag)) {
                    incorrectTokensToTags[tokens[i]][tag] = 0;
                }
                incorrectTokensToTags[tokens[i]][tag]++;
                incorrectTags++;
            }
        }
        else {
            incorrectTags++;
        }
    }

    if (incorrectTags > 0) {
        incorrectSentences++;
        totalIncorrectTags += incorrectTags;

        var newLine = [];
        for (var k = 0; k < results.y.length; k++) {
            newLine.push(tokens[k] + "/" + results.y[k]);
        }
        /*
        console.log('\t', line);
        console.log('\t', newLine.join(' '));
        */

        if (!incorrectSentenceGroups.hasOwnProperty(incorrectTags.toString())) {
            incorrectSentenceGroups[incorrectTags.toString()] = 0;
        }
        incorrectSentenceGroups[incorrectTags.toString()]++;
    }

    totalTags += expectedTags.length;
    totalSentences++;
}
var endTime = new Date().getTime();

var totalIncorrectTokensSort = [];
for (var t in incorrectTokensToTags) {
    var item = incorrectTokensToTags[t];
    var total = 0;
    for (var tag in item) {
        total += item[tag];
    }
    totalIncorrectTokensSort.push({t: t, tags: item, total: total});
}
totalIncorrectTokensSort = totalIncorrectTokensSort.sort(function (a, b) { return a.total - b.total; });

//console.log(totalIncorrectTokensSort);
var percentCorrect = 100.0 * ((totalSentences - incorrectSentences) / totalSentences);
var percentTagsCorrect = 100.0 * ((totalTags - totalIncorrectTags) / totalTags);
console.log('Finished processing:', totalSentences, 'sentences in', (endTime - startTime) / 1000, 'seconds. rate/second:', totalSentences / ((endTime - startTime) / 1000));
console.log('% sentences correct:', percentCorrect, ', total sentences:', (totalSentences - incorrectSentences), '/', totalSentences);
console.log('% tags correct:', percentTagsCorrect, ', total tags:', (totalTags - totalIncorrectTags), '/', totalTags);
