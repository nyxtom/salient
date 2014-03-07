
var RegExpTokenizer = require('./regexp_tokenizer');
var util = require('util');

var WordPunctTokenizer = function (options) {
    var options = options || {};
    this.preserveEmoticons = options.preserveEmoticons || this.preserveEmoticons;
    var pattern = "(?:[0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]\\s?(?:[PApa]\\.?[Mm]\\.?)?" + // time
                   "|\\d+(?:st|nd|rd|th)" + // numeric 1st, 2nd..etc
                   "|\\$?\\d+(?:[\\d,]?\\d)*(?:\\.\\d+)?\\%?" + // numerics (with and w/o commmas and decimals) (with and w/o percentage and or $)
                   "|(?:[a-zA-ZÁÂàáâÈÉÊèéê]+)-(?:[a-zA-ZÁÂàáâÈÉÊèéê]+)" + // word with hyphen
                   "|(?:[a-zA-ZÁÂàáâÈÉÊèéê]+\')?[a-zA-ZÁÂàáâÈÉÊèéê]+" + // word with w/o accents w/o apos
                   "|\\%|\\!|\\.|;|,|:|\\\'|\\\"|-|\\?|\\&|\\*|\\(|\\)"; // punctuations
                   "|\\S";
    if (this.preserveEmoticons) {
        pattern = "(?:[<>]?[:;=8][\\-o\\*\\\']?[\\)\\]\\(\\[dDpP/\\:\\}\\{@\\|\\\\]|[\\)\\]\\(\\[dDpP/\\:\\}\\{@\\|\\\\][\\-o\\*\\\']?[:;=8][<>]?)" + // emoticons
                  "|" + pattern;
    }
    this.pattern = new RegExp("(" + pattern + ")", "i");
    RegExpTokenizer.call(this, options);
};

// Inherit from the base tokenizer
util.inherits(WordPunctTokenizer, RegExpTokenizer);
module.exports = WordPunctTokenizer;
