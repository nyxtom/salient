
var Tokenizer = require('./tokenizer');
var RegExpTokenizer = require('./regexp_tokenizer');
var WordPunctTokenizer = require('./wordpunct_tokenizer');
var util = require('util');
var _ = require('underscore')._;

var ArticleTokenizer = function (options) {
    var options = options || {};
    this.cleanWikiMarkup = options.cleanWikiMarkup;
    this.cleanXHTML = options.cleanHTML;
    this.decodeURLEncoded = options.decodeURLEncoded;
    this.cleanNonAlphaNumeric = options.cleanNonAlphaNumeric || false;
    this.compressWhitespace = options.compressWhitespace || false;
    if (typeof this.cleanWikiMarkup === 'undefined') {
        this.cleanWikiMarkup = true;
    }
    if (typeof this.cleanXHTML === 'undefined') {
        this.cleanXHTML = true;
    }
    if (typeof this.decodeURLEncoded === 'undefined') {
        this.decodeURLEncoded = true;
    }
    if (typeof this.cleanNonAlphaNumeric === 'undefined') {
        this.cleanNonAlphaNumeric = true;
    }
};

// Inherit from the base tokenizer
util.inherits(ArticleTokenizer, Tokenizer);

ArticleTokenizer.prototype._initializeTokenizers = function () {
    this.tokenizer = new WordPunctTokenizer();
    this.cleanTokenizers = [];
    if (this.decodeURLEncoded) {
        // decode URL encoded characters
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /&amp;/ig, 
            replaceWith: '&'
        }));
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /&lt;/ig,
            replaceWith: '<'
        }));
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /&gt;/ig,
            replaceWith: '>'
        }));
    }
    if (this.cleanWikiMarkup) {
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /<ref[^<]*<\/ref>/ig, 
            cleanTriggerChar: '<'
        }));
    }
    if (this.cleanXHTML) {
        // removes xhtml tags
        this.cleanTokenizers.push(new RegExpTokenizer({ 
            cleanPattern: /(<([^>]+)>)/ig, 
            cleanTriggerChar: '<' 
        }));
    }
    if (this.cleanWikiMarkup) {
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /\[http:[^] ]*/ig,
            replaceWith: '['
        }));
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /\|thumb/ig
        }));
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /\|left/ig
        }));
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /\|right/ig
        }));
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /\|\d+px/ig
        }));
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /\[\[image:[^\[\]]*\|/ig
        }));
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /\[\[category:([^|\]]*)[^]]*\]\]/ig,
        }));
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /\[\[[a-z\-]*:[^\]]*\]\]/ig
        }));
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /\[\[[^\|\]]*\|/ig,
            replaceWith: '[['
        }));
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /{{[^}]*}}/ig
        }));
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /{[^}]*}/ig
        }));
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /\[/ig
        }));
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /\]/ig
        }));
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /&[^;]*;/ig,
            replaceWith: ' '
        }));
    }
    if (this.cleanNonAlphaNumeric) {
        this.cleanTokenizers.push(new RegExpTokenizer({
            cleanPattern: /[^a-zA-Z0-9]/ig,
            replaceWith: ' '
        }));
    }
};

/**
 * Tokenizes the given input 
 */
ArticleTokenizer.prototype.tokenize = function (s) {
    return this.tokenizer.tokenize(s);
};

/*
 * Cleans the given input
 */
ArticleTokenizer.prototype.clean = function (s) {
    if (!this.cleanTokenizers) {
        this._initializeTokenizers();
    }
    for (var i = 0; i < this.cleanTokenizers.length; i++) {
        var cleanTokenizer = this.cleanTokenizers[i];
        s = cleanTokenizer.clean(s);
    }
    if (this.compressWhitespace) {
        s = this.chop(s);
    }
    return s;
};

module.exports = ArticleTokenizer;
