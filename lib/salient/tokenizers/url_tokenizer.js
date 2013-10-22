
var Tokenizer = require('./tokenizer');
var util = require('util');
var twitter = require('twitter-text');

var UrlTokenizer = function (options) {
    var options = options || {};
    this.includeIndices = typeof options.includeIndices !== 'undefined' ? options.includeIndices : this.includeIndices;
};

// Inherit from the base tokenizer
util.inherits(UrlTokenizer, Tokenizer);

UrlTokenizer.prototype.tokenize = function (s) {
    if (!s || s.length == 0)
        return [];

    if (this.includeIndices) {
        return twitter.extractUrlsWithIndices(s);
    }
    else {
        return twitter.extractUrls(s);
    }
};

module.exports = UrlTokenizer;
