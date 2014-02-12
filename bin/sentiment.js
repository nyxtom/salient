
var fs = require('fs'),
    path = require('path');

var args = process.argv;
if (!args || args.length < 3) {
    console.log('usage: node sentiment senticorp.log --lines=100');
    return;
}

var salient = require('./..');
var analyser = new salient.sentiment.BayesSentimentAnalyser();
var sentimentFile = args[2];
var correctNegative = 0.0;
var correctPositive = 0.0;
var correctNeutral = 0.0;
var incorrect = 0.0;
var totalCorrect = 0.0;
var lines = fs.readFileSync(sentimentFile).toString().split('\n');
var count = lines.length;
if (args.length == 4) {
    if (args[3].indexOf('--lines') > -1) {
        count = parseInt(args[3].split('--lines=')[1]);
    }
}

var startTime = new Date().getTime();
var tokens = 0;
var skipped = 0;
for (var i = 0; i < count; i++) {
    if (!lines[i] || lines[i].trim().length == 0) {
        skipped++;
        continue;
    }

    var items = lines[i].split('\t');
    var score = parseInt(items[0]);
    var text = items[1];

    var result = analyser.classify(text);
    tokens += analyser.glossary.terms;
    if (result < -0.1 && score < 0) {
        correctNegative++;
    }
    else if (result > -0.1 && result < 0.1 && score == 0) {
        correctNeutral++;
    }
    else if (result > 0.1 && score > 0) {
        correctPositive++;
    }
    else {
        console.log(score, result, text);
        incorrect++;
    }
}
var endTime = new Date().getTime();
var seconds = (endTime - startTime) / 1000;
totalCorrect = correctPositive + correctNegative + correctNeutral;
var totalProcessed = count - skipped;

console.log('processed', totalProcessed, 'in', seconds, 'seconds', totalProcessed / seconds, '/second');
console.log('processed', tokens, 'tokens in', seconds, 'seconds', tokens / seconds, '/ second');
console.log('correct:', totalCorrect, 'sentences vs incorrect:', incorrect, 'sentences');
console.log('percent correct', (100.0 * totalCorrect / totalProcessed ), 'percent incorrect', (100.0 * incorrect / totalProcessed));
console.log('total tokenization time', analyser.glossary.tokenTime, 'ms', analyser.glossary.tokenTime / totalProcessed, 'ms/iteration');
console.log('total pos time', analyser.glossary.tagTime, 'ms', (analyser.glossary.tagTime) / totalProcessed, 'ms/iteration');
console.log('total lemma time', analyser.glossary.lemmaTime, 'ms',  analyser.glossary.lemmaTime / totalProcessed, 'ms/iteration');
console.log('total collapse time', analyser.glossary.collapseTime, 'ms',  analyser.glossary.collapseTime / totalProcessed, 'ms/iteration');
console.log('total tag sentiment time', analyser.tagTime, 'ms', analyser.tagTime / totalProcessed, 'ms/iteration');
console.log('total classify time', analyser.classifyTime, 'ms', analyser.classifyTime / totalProcessed, 'ms/iteration');
