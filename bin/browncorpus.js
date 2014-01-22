
var path = require('path');
var salient = require('./../');
var BrownCorpus = salient.corpus.BrownCorpus;

var args = process.argv;
if (!args || args.length == 2) {
    console.log('usage: node browncorpus.js ~/Public/brown --lines=10000 --skip=10000');
    return;
}

var file = args[2];
var outputDir = __dirname;
var lines = 0;
var skip = 0;
if (args.length > 3) {
    for (var i = 0; i < args.length; i++) {
        if (args[i].indexOf('--') == 0) {
            var item = args[i].split('=');
            if (item[0] == '--lines') {
                lines = parseInt(item[1]);
            }
            else if (item[0] == '--skip') {
                skip = parseInt(item[1]);
            }
        }
    }
}

var brown = new BrownCorpus(file);
brown.skipLines = skip;
brown.limitLines = lines;
brown.output = path.join(outputDir, 'en-brown.tag.vocab');
brown.outputDist = path.join(outputDir, 'en-brown.tag.dist');
brown.outputSentences = path.join(outputDir, 'en-brown.sentences');
brown.parse();
