
var RegExpTokenizer = require('./regexp_tokenizer');
var util = require('util');

var WordPunctTokenizer = function (options) {
    var options = options || {};
    this.pattern = /((?:[<>]?[:;=8][\-o\*\']?[\)\]\(\[dDpP/\:\}\{@\|\\]|[\)\]\(\[dDpP/\:\}\{@\|\\][\-o\*\']?[:;=8][<>]?)|[-]?\d+(?:[\d,]?\d)*(?:\.\d+)?|[a-zA-ZÁÂàáâÈÉÊèéê]+|\!|\.|;|,|:|\'|\")/i;
    RegExpTokenizer.call(this, options);
};

// Inherit from the base tokenizer
util.inherits(WordPunctTokenizer, RegExpTokenizer);
module.exports = WordPunctTokenizer;
