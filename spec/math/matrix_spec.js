
var salient = require('./../../');

describe('matrix', function () {

    it('should be able to load .dat files such that they describe a single matrix variable', function () {
        var m = salient.math.Matrix.load('./spec/math/weights1.dat');
        var dim = m.dimensions();
        expect(dim.rows).toEqual(25);
        expect(dim.cols).toEqual(401);

        m = salient.math.Matrix.load('./spec/math/weights2.dat');
        dim = m.dimensions();
        expect(dim.rows).toEqual(10);
        expect(dim.cols).toEqual(26);
    });

    it('should be able to reshape and unroll values', function () {
        var m1 = $M([[1,2,3],[4,5,6]]);
        var reshaped = salient.math.Matrix.reshape([1,4,2,5,3,6], 2, 3).unroll().reshape(2,3);
        expect(m1.eql(reshaped)).toEqual(true);
    });

});
