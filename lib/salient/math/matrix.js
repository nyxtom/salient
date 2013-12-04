
var Matrix = require('sylvester').Matrix;
var fs = require('fs');

/**
 * Returns a vector of each column's standard deviation.
 */
Matrix.prototype.std = function () {
    var dim = this.dimensions();
    var mMean = this.mean();
    var r = [];
    for (var i = 1; i <= dim.cols; i++) {
        var meanDiff = this.col(i).subtract(mMean.e(i));
        meanDiff = meanDiff.elementMultiply(meanDiff);
        r.push(Math.sqrt(meanDiff.sum() / dim.rows));
    }
    return $V(r);
};

Matrix.prototype.maxIndex = function () {
    var m = 0,
    i = this.elements.length,
    nj = this.elements[0].length,
    j;

    var maxI = -1;
    var maxJ = -1;
    while (i--) {
        j = nj;
        while (j--) {
            if (Math.abs(this.elements[i][j]) > Math.abs(m)) {
                m = this.elements[i][j];
                maxI = i + 1;
                maxJ = j + 1;
            }
        }
    }

    return { value: m, row: maxI, col: maxJ };
};

/**
 * Reshapes the given vector or array of elements into the given 
 * matrix dimensions of rows and columns.
 *
 * @param {Vector|Array} vector: The array to reshape into a matrix.
 * @param {Number} rows: Number of rows in the matrix
 * @param {Number} cols: Number of columns in the matrix.
 */
Matrix.reshape = function (vector, rows, cols) {
    var elements = null;
    if (vector.elements) {
        elements = vector.elements;
    }
    else {
        elements = vector;
    }

    var matrix = Matrix.Zeros(rows, cols); 
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            var index = (c * rows) + r;
            matrix.elements[r][c] = elements[index];
        }
    }

    return matrix;
};

/**
 * Derivative of sigmoid or logistic function.
 *
 * @param {Vector|Matrix|Number} z: The item to calculate sigmoid.
 */
Matrix.sigmoidGradient = function (z) {
    var sig = Matrix.sigmoid(z);
    if (sig.elements) {
        return sig.elementMultiply(sig.multiply(-1).add(1));
    }
    else {
        return sig * (1 - sig);
    }
};

/**
 * Derivative of sigmoid or logistic function.
 */
Matrix.prototype.sigmoidGradient = function () {
    return Matrix.sigmoidGradient(this);
};

/**
 * Sigmoid or logistic function represents the bounded differentiable 
 * real function for all real input values showing the cumulative distribution 
 * between 0 and 1 given the input value Z.
 *
 * @param {Vector|Matrix|Number} z: The item to calculate sigmoid.
 */
Matrix.sigmoid = function (z) {
    if (!z.elements) {
        return (1.0 / (1 + Math.exp(-1.0 * z)));
    }
    else {
        var rows = z.rows();
        var cols = z.cols();
        var result = Matrix.Zeros(rows,cols).elements;
        for (var i = 1; i <= rows; i++) {
            for (var j = 1; j <= cols; j++) {
                var e = z.e(i,j);
                result[i-1][j-1] = Matrix.sigmoid(e);
            }
        }
        return $M(result);
    }
};

/**
 * Sigmoid or logistic function represents the bounded differentiable 
 * real function for all real input values showing the cumulative distribution 
 * between 0 and 1 given the input value Z.
 */
Matrix.prototype.sigmoid = function () {
    return Matrix.sigmoid(this);
};

Matrix.tanhGradient = function (z) {
    var v = Matrix.tanh(z);
    if (v.elements) {
        return v.elementMultiply(v).multiply(-1).add(1);
    }
    else {
        return 1 - (v * v);
    }
};

Matrix.prototype.tanhGradient = function () {
    return Matrix.tanhGradient(this);
};

/**
 * Hyperbolic tangent as a symmetric alternative to the logistic function.
 *
 * @param {Vector|Matrix|Number} z: The item to calculate sigmoid.
 */
Matrix.tanh = function (z) { 
    if (!z.elements) {
        return (Math.exp(z) - Math.exp(-z)) / (Math.exp(z) + Math.exp(-z));
    }
    else {
        var rows = z.rows();
        var cols = z.cols();
        var result = Matrix.Zeros(rows,cols).elements;
        for (var i = 1; i <= rows; i++) {
            for (var j = 1; j <= cols; j++) {
                var e = z.e(i,j);
                result[i-1][j-1] = Matrix.tanh(e);
            }
        }
        return $M(result);
    }
};

/**
 * Hyperbolic tangent as a symmetric alternative to the logistic function.
 */
Matrix.prototype.tanh = function () {
    return Matrix.tanh(this);
};

/**
 * Loads a .dat matlab file that consists of matrix data.
 *
 * @param {String} dat: location to the data file containing the matrix data.
 */
Matrix.load = function (dat) {
    var lines = fs.readFileSync(dat).toString().split('\n').map(function (x, i) { return x.trim() });
    lines = lines.filter(function (x, i) { return x.length > 0 && x.indexOf('#') < 0 });
    var elements = [];
    for (var l = 0; l < lines.length; l++) {
        var items = lines[l].split(' ').map(function (x) { return parseFloat(x); });
        elements.push(items);
    }
    return $M(elements);
};

module.exports = Matrix;
