
var RegExpTokenizer = require('./regexp_tokenizer');
var util = require('util');

var WordPunctTokenizer = function (options) {
    var options = options || {};
    this.pattern = /([-]?\$?\d+(?:[\d,]?\d)*(?:\.\d+)?|\w+|\!|\.|;|,|:|\'|\")/i;
    RegExpTokenizer.call(this, options);
};

// Inherit from the base tokenizer
util.inherits(WordPunctTokenizer, RegExpTokenizer);
module.exports = WordPunctTokenizer;
