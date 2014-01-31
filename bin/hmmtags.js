
var path = require('path'),
    util = require('util'),
    fs = require('fs');

var salient = require('./../');

var args = process.argv;
if (!args || args.length < 3) {
    console.log('usage: node hmmtags en-brown.tag.dist [outputdir]');
    return;
}

var model = new salient.language.HiddenMarkovModel();
var tagDistFile = args[2];
var outputDir = __dirname;
if (args.length == 4) {
    outputDir = args[3];
    if (outputDir.indexOf('./') == 0) {
        outputDir = path.join(__dirname, outputDir);
    } 
}

// initialize a vocabulary with the size 12 tagsets
model.loadTagDist(tagDistFile, function () {
    model.estimateTagDistribution();
    var s = JSON.stringify(model);
    fs.writeFileSync(path.join(outputDir, 'model.tagdist.json'), s);
});
