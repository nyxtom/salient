
var ArticleTokenizer = require('./article_tokenizer');
var util = require('util');
var _ = require('underscore')._;
var twitter = require('twitter-text');

var TweetTokenizer = function (options) {
    var options = options || {};
    ArticleTokenizer.call(this, options);
};

// Inherit from the base tokenizer
util.inherits(TweetTokenizer, ArticleTokenizer);

/**
 * Tokenizes the given input 
 */
TweetTokenizer.prototype.tokenize = function (s) {
    if (!s || s.length == 0)
        return [];

    if (!this.tokenizer) {
        this._initializeTokenizers();
    }

    var entities = twitter.extractEntitiesWithIndices(s);
    var tokens = [];
    var index = 0;
    if (entities.length > 0) {
        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            var indices = entity.indices;
            if (index < indices[0] && index < s.length) {
                var t = s.substring(index, indices[0]);
                var results = this.tokenizer.tokenize(t);
                tokens = tokens.concat(results);
            }
            if (entity.screenName) {
                tokens.push('@' + entity.screenName);
            }
            else if (entity.hashtag) {
                tokens.push('#' + entity.hashtag);
            }
            else if (entity.url) {
                tokens.push(entity.url);
            }
            else if (entity.cashtag) {
                tokens.push('$' + entity.cashtag);
            }
            index = indices[1];
        }
        if (index < s.length) {
            var t = s.substring(index);
            var results = this.tokenizer.tokenize(t);
            tokens = tokens.concat(results);
        }
        return tokens;
    }
    else {
        return this.tokenizer.tokenize(s);
    }
};

module.exports = TweetTokenizer;
