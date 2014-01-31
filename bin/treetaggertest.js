
var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    async = require('async');
var salient = require('./../');

var args = process.argv;
if (!args || args.length < 3) {
    console.log('usage: node treetaggertest en-brown.sentences');
    return;
}

var sentencesFile = args[2];
var tagger = new salient.tagging.TreeTagger();

var lines = fs.readFileSync(sentencesFile).toString().split('\n');
var incorrectSentences = 0;
var totalIncorrectTags = 0;
var totalSentences = 0;
var totalTags = 0;
var startTime = new Date().getTime();

async.eachSeries(lines, function (line, callback) {
    var tokenPairs = line.split(' ');
    var tokens = [];
    var expectedTags = [];
    for (var i = 0; i < tokenPairs.length; i++) {
        var tokenPair = tokenPairs[i].split('/');
        tokens.push(tokenPair[0]);
        expectedTags.push(tokenPair[1]);
    }

    tagger.tag(tokens, function (err, results) {
        var incorrectTags = 0;
        for (var i = 0; i < expectedTags.length; i++) {
            if (results.length > i) {
                if (results[i] != expectedTags[i]) {
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
            for (var k = 0; k < results.length; k++) {
                newLine.push(tokens[k] + "/" + results[k]);
            }
            /*
            console.log('\n\t', line);
            console.log('\t', newLine.join(' '));
            */
        }

        totalTags += expectedTags.length;
        totalSentences++;
        callback();
    });
}, function (err) {
    var endTime = new Date().getTime();

    var percentCorrect = 100.0 * ((totalSentences - incorrectSentences) / totalSentences);
    var percentTagsCorrect = 100.0 * ((totalTags - totalIncorrectTags) / totalTags);
    console.log('Finished processing:', totalSentences, 'sentences in', (endTime - startTime) / 1000, 'seconds. rate/second:', totalSentences / ((endTime - startTime) / 1000));
    console.log('% sentences correct:', percentCorrect, ', total sentences:', (totalSentences - incorrectSentences), '/', totalSentences);
    console.log('% tags correct:', percentTagsCorrect, ', total tags:', (totalTags - totalIncorrectTags), '/', totalTags);
});
