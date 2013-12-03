
var Vector = require('sylvester').Vector;
var Matrix = require('./matrix');

Vector.prototype.div = function (item) {
    if (typeof item == 'number') {
        return this.map(function (v, i) {
            return v / item;
        });
    }
    else {
        return this.elementDivide(item);
    }
};

Vector.prototype.reshape = function (r, c) {
    return Matrix.reshape(this.elements, r, c);
};

Vector.sigmoid = function () {
    return Matrix.sigmoid(this);
};

module.exports = Vector;
