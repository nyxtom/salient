
describe('salient', function () {

    it('should be able to load the module library', function () {
        var salient = require('./../');
        expect(salient.tokenizers).toNotEqual(undefined);
    });

});
