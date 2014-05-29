
var path = require('path');
var salient = require('./../');
var IULATreeBank = salient.corpus.IULATreeBank;

var args = process.argv;
if (!args || args.length == 2) {
    console.log('usage: node iula ~/Public/IULA_Spanish_LSP_Treebank/IULA_Spanish_LSP_Treebank.conll');
    return;
}

var file = args[2];
var outputDir = __dirname;

var corp = new IULATreeBank(file);
corp.output = path.join(outputDir, 'es-iula.tag.vocab');
corp.outputDist = path.join(outputDir, 'es-iula.tag.dist');
corp.outputSentences = path.join(outputDir, 'es-iula.sentences');
corp.parse();
