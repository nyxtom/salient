
var path = require('path'),
    util = require('util'),
    fs = require('fs');

var salient = require('./../');

var args = process.argv;
if (!args || args.length < 3) {
    console.log('usage: node hmmtags en-brown.tag.dist');
    return;
}

var model = new salient.language.HiddenMarkovModel();
var tagDistFile = args[2];

// initialize a vocabulary with the size 12 tagsets
model.loadTagDist(tagDistFile, function () {
    model.estimateTagDistribution();
    var s = JSON.stringify(model);
    fs.writeFileSync(path.join(__dirname, 'model.tagdist.json'), s);
});
