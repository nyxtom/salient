
var PartOfSpeechTagger = require('./partofspeech_tagger'),
    util = require('util'),
    path = require('path');

var HiddenMarkovModel = require('./../language/hmm');

var HmmTagger = function (options) {
    this.options = options || {};
    this.modelFile = this.options.model || path.join(__dirname, '../../../bin/en.hmm.json');
    this.hmm = new HiddenMarkovModel();
    this.hmm.restore(this.modelFile);
};

util.inherits(HmmTagger, PartOfSpeechTagger);

/**
 * Prototype method for tagging a given string 
 * for parts of speech appropriately.
 */
HmmTagger.prototype.tag = function (tokens, callback) {
    return this.hmm.viterbi(tokens).y;
};

module.exports = HmmTagger;
