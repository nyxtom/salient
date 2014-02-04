
var perfect = require('./mphf');
var RadixTree = require('./radixtree');

function Vocabulary() {
    this.tree = {};
//    this.tokens = [];
    this.terms = 0;
//    this.radix = new RadixTree();
};

/*
Vocabulary.prototype.enumerate = function (callback, tree) {
    var root = tree || this.tree;
    for (var t in root) {
        var node = root[t];
        if (node._$) {
            callback(node._$);
        }

        this.enumerate(callback, node);
    }
};
*/

Vocabulary.prototype.restore = function (vocabData) {
    if (vocabData.tables)
        this.tables = vocabData.tables;
    /*
    if (vocabData.radix)
        this.radix.rootNode = vocabData.radix.rootNode;
        */
};

Vocabulary.prototype.computeHash = function () {
    this.tables = perfect.create(this.tree);
    delete this.tree;

    /*
    this.tokens = this.tokens.sort();
    for (var i = 0; i < this.tokens.length; i++) {
        var token = this.tokens[i];
        //this.radix.insert(token);
    }
    delete this.tokens;
    */
};

Vocabulary.prototype.get = function (token) {
    /*
    var exists = false;
    if (this.radix) {
        exists = this.radix.find(token);
    }
    if (!exists)
        return undefined;
        */

    if (this.tables) {
        return perfect.lookup(this.tables[0], this.tables[1], token);
    }
    else if (this.tree.hasOwnProperty(token)) {
        return this.tree[token];
    }
    else {
        return undefined;
    }
    /*
    var root = this.tree;
    for (var ii = 0, ll = token.length; ii < ll; ii++) {
        var c = token[ii];

        if (!root.hasOwnProperty(c)) {
            return undefined;
        }

        root = root[c];
    }

    if (!root._$) {
        return undefined;
    }

    return root._$;
    */
};

Vocabulary.prototype.addTerm = function (token, data) {
    /*
    var root = this.tree;
    for (var ii = 0, ll = token.length; ii < ll; ii++) {
        var c = token[ii];

        if (!root.hasOwnProperty(c)) {
            root[c] = {};
        }
        root = root[c];

        if (ii == ll-1) {
            if (!root._$) {
                this.terms++;
            }
            root._$ = data || 1;
        }
    }
    */
    if (!this.tree.hasOwnProperty(token)) {
        this.terms++;
    //    this.tokens.push(token);
    }
    this.tree[token] = data;
};

module.exports = Vocabulary;
