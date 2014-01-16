
var path = require('path');
var salient = require('./../');
var BrownCorpus = salient.corpus.BrownCorpus;

var args = process.argv;
if (!args || args.length == 2) {
    console.log('usage: node browncorpus.js ~/Public/brown [outputdir]');
    return;
}

var file = args[2];
var outputDir = __dirname;
if (args.length > 3) {
    if (args[3] == "~") {
        outputDir = process.env['HOME'];
    }
}

var brown = new BrownCorpus(file);
brown.output = path.join(outputDir, 'en-brown.tag.vocab');
brown.outputDist = path.join(outputDir, 'en-brown.tag.dist');
brown.parse();
