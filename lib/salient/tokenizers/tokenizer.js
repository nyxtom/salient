
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

module.exports = Tokenizer;
