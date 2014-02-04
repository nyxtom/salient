/*!
 * gaddag.js
 * Copyright(c) 2012 hillerstorm <progr@mmer.nu>
 */
var fs = require('fs');

function str (node) {
    var s, label;

    if (node.$) {
        s = '1';
    } else {
        s = '0';
    }

    for (label in node.e) {
        if (node.e.hasOwnProperty(label)) {
            s += '_' + label + '_' + node.e[label].id;
        }
    }

    return s;
}

module.exports = function () {
    var nextId = 0,
        previousWord = '';
    this.root = { id: nextId++, e: {}, $: 0 };
    uncheckedNodes = [],
    minimizedNodes = {};

    function minimize (downTo) {
        var i, tuple,
            childKey, node;

        for (i = uncheckedNodes.length-1; i > downTo-1; i--) {
            tuple = uncheckedNodes.pop();
            childKey = str(tuple.child);
            node = minimizedNodes[childKey];
            if (node) {
                tuple.parent.e[tuple.letter] = node;
            } else {
                minimizedNodes[childKey] = tuple.child;
            }
        }
    }

    this.insert = function (word) {
        var commonPrefix = 0, i,
            node, slicedWord, nd, ltr;

        for (i = 0; i < Math.min(word.length, previousWord.length); i++) {
            if (word[i] !== previousWord[i]) {
                break;
            }
            commonPrefix += 1;
        }

        minimize(commonPrefix);
        if (uncheckedNodes.length === 0) {
            node = this.root;
        } else {
            node = uncheckedNodes[uncheckedNodes.length-1].child;
        }

        slicedWord = word.slice(commonPrefix);
        for (i = 0; i < slicedWord.length; i++) {
            nd = { id: nextId++, e: {}, $: 0 };
            ltr = slicedWord[i].toUpperCase();
            node.e[ltr] = nd;
            uncheckedNodes.push({
                parent: node,
                letter: ltr,
                child: nd
            });
            node = nd;
        }
        node.$ = 1;
        previousWord = word;
    }

    this.finish = function () {
        minimize(0);
        delete uncheckedNodes;
        delete minimizedNodes;
        delete previousWord;
        this.minify(this.root);
    }

    this.minify = function (node) {
        delete node.id;
        if (!node.$) {
            delete node.$;
        }

        for (var edge in node.e) {
            this.minify(node.e[edge]);
        }
    };

    // Finds a word, returns 1 if the word was found, 0 otherwise
    this.find = function (word) {
        var node = this.root,
            i, letter;

        for (i = 0; i < word.length; i++) {
            letter = word[i].toUpperCase();
            if (!node.e[letter]) {
                return 0;
            }
            node = node.e[letter];
        }
        return node.$;
    };

    // Returns the subtree matching the letter given
    this.get = function (letter) {
        return this.root.e[letter.toUpperCase()];
    };
};
