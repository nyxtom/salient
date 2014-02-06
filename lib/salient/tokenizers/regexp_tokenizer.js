
var Tokenizer = require('./tokenizer');
var util = require('util');
var _ = require('underscore')._;

var RegExpTokenizer = function (options) {
    var options = options || {};
    this.pattern = options.pattern || (typeof this.pattern !== 'undefined' ?  this.pattern : "");
    this.discardEmpty = options.discardEmpty || (typeof this.discardEmpty !== 'undefined' ? this.discardEmpty : true);
    this.includeIndices = options.includeIndices || this.includeIndices;

    // Match and split on gaps in the text
    this.gaps = options.gaps || (typeof this.gaps !== 'undefined' ? this.gaps : true);
    this.triggerChar = options.triggerChar ? options.triggerChar.charCodeAt(0) : 
        (typeof this.triggerChar !== 'undefined' ? this.triggerChar : 0);
    this.matchExp = undefined;

    // Clean pattern, triggering character and regexp
    this.cleanPattern = options.cleanPattern || (typeof this.cleanPattern !== 'undefined' ? this.cleanPattern : "");
    this.cleanTriggerChar = options.cleanTriggerChar ? options.cleanTriggerChar.charCodeAt(0) :
        (typeof this.triggerChar !== 'undefined' ? this.triggerChar : 0);
    this.replaceWith = options.replaceWith || (typeof this.replaceWith !== 'undefined' ? this.replaceWith : "");
    this.cleanMatchExp = undefined;
};

// Inherit from the base tokenizer
util.inherits(RegExpTokenizer, Tokenizer);

RegExpTokenizer.prototype._findTriggerChar = function (triggerChar, s) {
    var foundTriggerChar = false;
    var l = s.length;
    for (var i = 0; i < l; ++i) {
        if (triggerChar == s.charCodeAt(i)) {
            foundTriggerChar = true;
            break;
        }
    }

    return foundTriggerChar;
};

/**
 * Resets the input based in a quick measurement 
 * if there is such a thing as a triggering character.
 */
RegExpTokenizer.prototype.reset = function (s) {
    if (!s || s == "")
        return;

    var match = true;
    var cleanMatch = true;
    if (this.triggerChar && this.triggerChar > 0) {
        if (!this._findTriggerChar(this.triggerChar, s)) {
            this.matchExp = undefined;
            match = false;
        }
    }
    if (this.cleanTriggerChar && this.cleanTriggerChar > 0) {
        if (!this._findTriggerChar(this.cleanTriggerChar, s)) {
            this.cleanMatchExp = undefined;
            cleanMatch = false;
        }
    }

    if (match && this.pattern) {
        this.matchExp = new RegExp(this.pattern);
    }
    if (cleanMatch && this.cleanPattern) {
        this.cleanMatchExp = new RegExp(this.cleanPattern);
    }

    s = s.replace('’', '\'');

};

/**
 * Tokenizes the given input 
 */
RegExpTokenizer.prototype.tokenize = function (s) {
    this.reset(s);
    if (this.gaps) {
        if (this.matchExp) {
            var results = s.split(this.matchExp);
            return (this.discardEmpty) ? _.without(results, '', ' ') : results;
        }
    }
    else if (this.matchExp) {
        if (!this.includeIndices) {
            return s.match(this.matchExp);
        }
        else {
            var m, results  = [];
            while (m = this.matchExp.exec(s)) {
                var value = m[0];
                results.push({ v: value, indices: [m.index, m.index + value.length]});
            }
            return results;
        }
    }

    return [];
};

/*
 * Cleans the given input
 */
RegExpTokenizer.prototype.clean = function (s) {
    this.reset(s);
    if (this.cleanMatchExp) {
        return s.replace(this.cleanMatchExp, this.replaceWith);
    }
    return s;
};

module.exports = RegExpTokenizer;
