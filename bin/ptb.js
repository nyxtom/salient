
var path = require('path');
var salient = require('./../');
var PennTreeBank = salient.corpus.PennTreeBank;

var args = process.argv;
if (!args || args.length == 2) {
    console.log('usage: node ptb ~/Public/ptb/pos');
    return;
}

var file = args[2];
var outputDir = __dirname;

var corp = new PennTreeBank(file);
corp.output = path.join(outputDir, 'en-ptb.tag.vocab');
corp.outputDist = path.join(outputDir, 'en-ptb.tag.dist');
corp.outputSentences = path.join(outputDir, 'en-ptb.sentences');
corp.parse();
