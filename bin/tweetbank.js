
var path = require('path');
var salient = require('./../');
var TwitterTreeBank = salient.corpus.TwitterTreeBank;

var args = process.argv;
if (!args || args.length == 2) {
    console.log('usage: node ptb ~/Public/twitter');
    return;
}

var file = args[2];
var outputDir = __dirname;

var corp = new TwitterTreeBank(file);
corp.output = path.join(outputDir, 'en-tweet.tag.vocab');
corp.outputDist = path.join(outputDir, 'en-tweet.tag.dist');
corp.outputSentences = path.join(outputDir, 'en-tweet.sentences');
corp.parse();
