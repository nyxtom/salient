
var PartOfSpeechTagger = require('./partofspeech_tagger');
var util = require('util');
var TreeTagger = require('treetagger');

var TreeTagPartOfSpeechTagger = function (options) {
    this.options = options || {};
    this.tagger = new TreeTagger(this.options);
}:

util.inherits(TreeTagPartOfSpeechTagger, PartOfSpeechTagger);
module.exports = TreeTagPartOfSpeechTagger;
