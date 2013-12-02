
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

});
