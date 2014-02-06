
var salient = require('./../../');

describe('glossary', function () {
    it('should be able to parse a sentence', function () {
        var glossary = new salient.glossary.Glossary();
        glossary.parse('Some corn farmers are going against the grain by growing fruits and vegetables.');
    });
    it('should be able to parse and derive concepts', function () {
        var glossary = new salient.glossary.Glossary();
        glossary.parse('Some corn farmers are going against the grain by growing fruits and vegetables.');
        var concepts = glossary.concepts();
        expect(concepts).toEqual(['Some corn farmers', 'the grain', 'fruits', 'vegetables']);
    });
    it('should be able to parse and detect relations', function () {
        var glossary = new salient.glossary.Glossary();
        glossary.parse('Some corn farmers are going against the grain by growing fruits and vegetables.');
        var relations = glossary.relations();
        expect(relations).toEqual(['Some corn farmers going against the grain']);
    });
});
