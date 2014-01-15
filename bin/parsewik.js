var salient = require('./../');
var path = require('path');

var args = process.argv;
if (!args || args.length == 2) {
    console.log('usage: node parsewik.js ~/enwiktionary-20140102-pages-articles.xml [outputdir]');
    return;
}

var file = args[2];
var outputDir = __dirname;
if (args.length > 3) {
    if (args[3] == "~") {
        outputDir = process.env['HOME'];
    }
}

// execute the parser with the given file
var parser = new salient.wiktionary.WiktionaryParser(file);
parser.output = path.join(outputDir, parser.lang + '.wik.vocab');
parser.outputDist = path.join(outputDir, parser.lang + '.wik.dist');
parser.parse();
