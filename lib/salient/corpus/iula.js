var util = require('util');
var Corpus = require('./corpus');

function IULATreeBank(file, options) {
    Corpus.call(this, file, 'es-iula', options);
};

util.inherits(IULATreeBank, Corpus);

IULATreeBank.prototype.parseLine = function (line) {
    // returns [token/POS token/POS]
    // ID    FORM    LEMMA    CPOSTAG    POSTAG    FEATS    HEAD    DEPREL    PHEAD
    var tokens = line.split('\t');
    if (tokens.length < 3)
        return [];

    var token = tokens[1];
    var tag = tokens[3];
    if (this.mapping.hasOwnProperty(tag)) {
        tag = this.mapping[tag];
    }

    return [[token, tag]];
};

module.exports = IULATreeBank;
