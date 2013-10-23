
var RegExpTokenizer = require('./regexp_tokenizer');
var util = require('util');
var _ = require('underscore')._;

var EmoticonTokenizer = function (options) {
    var options = options || {};
    this.gaps = false;
    this.pattern = /[<>]?[:;=8][\-o\*\']?[\)\]\(\[dDpP/\:\}\{@\|\\]|[\)\]\(\[dDpP/\:\}\{@\|\\][\-o\*\']?[:;=8][<>]?/ig;
    RegExpTokenizer.call(this, options);
};

util.inherits(EmoticonTokenizer, RegExpTokenizer);
module.exports = EmoticonTokenizer;
