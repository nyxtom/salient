
var Tokenizer = require('./tokenizer');
var util = require('util');
var twitter = require('twitter-text');

var UrlTokenizer = function (options) {};

// Inherit from the base tokenizer
util.inherits(UrlTokenizer, Tokenizer);

UrlTokenizer.prototype.tokenize = function (s) {
    if (!s || s.length == 0)
        return [];

    return twitter.extractUrls(s);
};

module.exports = UrlTokenizer;
