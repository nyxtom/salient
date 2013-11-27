
var Vector = require('sylvester').Vector;

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

Vector.sigmoid = function () {
    return Matrix.sigmoid(this);
};

module.exports = Vector;
