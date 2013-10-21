
var Tokenizer = function() {
};

/**
 * Default trim operation for an array of tokens.
 */
Tokenizer.prototype.trim = function (array) {
    if (array[array.length - 1] == '')
        array.pop();

    if (array[0] == '')
        array.shift();

    return array;
};

/**
 * Default chop operation to replace multiple spaces with 1 space.
 */
Tokenizer.prototype.chop = function (s) {
    if (!s || s.length == 0)
        return s;

    return s.replace(/\s+/ig, ' ').trim();
};

/**
 * Exposes an attached function that patches String with the 
 * appropriate tokenize and possibly other functions.
 */
Tokenizer.prototype.attach = function () {
    var self = this;

    String.prototype.tokenize = function () {
        return self.tokenize(this);
    };
};

/**
 * Tokenizes the given string into the appropriate form.
 */
Tokenizer.prototype.tokenize = function() {};

/*
 * Cleans the given string instead of tokenizing it by replacing 
 * certain values and scrubbing of certain invalid characters.
 */
Tokenizer.prototype.clean = function() {};

module.exports = Tokenizer;
