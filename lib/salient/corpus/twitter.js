
var util = require('util');
var Corpus = require('./corpus');

function TwitterTreeBank(file, options) {
    Corpus.call(this, file, 'en-tweet', options);
};

util.inherits(TwitterTreeBank, Corpus);

TwitterTreeBank.prototype.parseLine = function (line) {
    // token    POS
    var tokenPair = line.split('\t');
    if (tokenPair.length == 1) {
        tokenPair = [' ', tokenPair[0]];
        console.log(line);
    }
    var token = tokenPair[0].toLowerCase();
    var tag = tokenPair[1].toUpperCase();
    if (this.mapping.hasOwnProperty(tag)) {
        tag = this.mapping[tag];
    }
    return [[token,tag]];
};

module.exports = TwitterTreeBank;
