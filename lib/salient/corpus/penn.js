
var util = require('util');
var Corpus = require('./corpus');

function PennTreeBank(file, options) {
    Corpus.call(this, file, 'en-ptb', options);
};

util.inherits(PennTreeBank, Corpus);
module.exports = PennTreeBank;
