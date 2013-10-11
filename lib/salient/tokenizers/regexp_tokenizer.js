
var Tokenizer = require("./tokenizer");
var util = require("util");

var RegExpTokenizer = function (options) {
    var options = options || {};
    this.pattern = options.pattern || "";
    this.excludeEmpty = options.excludeEmpty || true;
    this.splitGaps = options.splitGaps || true;
    this.triggerChar = options.triggerChar ? options.triggerChar.charCodeAt(0) : 0;
    this.match = undefined;
};

// Inherit from the base tokenizer
util.inherits(RegExpTokenizer, Tokenizer);

/**
 * Resets the input based in a quick measurement 
 * if there is such a thing as a triggering character.
 */
RegExpTokenizer.prototype.reset = function (s) {
    if (!s || s == "")
        return false;

    var triggerChar = this.triggerChar;
    if (triggerChar > 0) {
        var foundTriggerChar = false;
        var l = s.length;
        for (var i = 0; i < l; ++i) {
            if (triggerChar == s.charCodeAt(i)) {
                foundTriggerChar = true;
                break;
            }
        }

        if (!foundTriggerChar) {
            this.match = undefined;
            return false;
        }
    }

    if (this.pattern) {
        this.match = new RegExp(this.pattern);
    }
};

/**
 * Tokenizes the given input 
 */
RegExpTokenizer.prototype.tokenize = function (s) {
};
