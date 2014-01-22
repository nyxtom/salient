
function Vocabulary() {
    this.tree = {};
    this.terms = 0;
};

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

Vocabulary.prototype.get = function (token) {
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
};

Vocabulary.prototype.addTerm = function (token, data) {
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
};

module.exports = Vocabulary;
