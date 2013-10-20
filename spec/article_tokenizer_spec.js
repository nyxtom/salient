var Tokenizer = require('../lib/salient/tokenizers/article_tokenizer'),
    tokenizer = new Tokenizer();

describe('regexp_tokenizer', function () {

    it('should clean the input where possible', function () {
        expect(tokenizer.clean('<div><a href="http://www.google.com" data-prop="bleh">data here to clean</a></div>'))
              .toEqual('data here to clean');
    });

    it('should clean wiki-markup where possible and when-enabled', function () {
        var text = "In [[topology]], '''knot theory''' is the study of [[knot (mathematics)|mathematical knot]]s. While inspired by knots which appear in daily life in shoelaces and rope, a mathematician's knot differs in that the ends are joined together so that it cannot be undone. In mathematical language, a knot is an [[embedding]] of a [[circle]] in 3-dimensional [[Euclidean space]], '''R'''<sup>3</sup>. Two mathematical knots are equivalent if one can be transformed into the other via a deformation of '''R'''<sup>3</sup> upon itself (known as an [[ambient isotopy]]); these transformations correspond to manipulations of a knotted string that do not involve cutting the string or passing the string through itself.";
        var expectText = "In topology, '''knot theory''' is the study of mathematical knots. While inspired by knots which appear in daily life in shoelaces and rope, a mathematician's knot differs in that the ends are joined together so that it cannot be undone. In mathematical language, a knot is an embedding of a circle in 3-dimensional Euclidean space, '''R'''3. Two mathematical knots are equivalent if one can be transformed into the other via a deformation of '''R'''3 upon itself (known as an ambient isotopy); these transformations correspond to manipulations of a knotted string that do not involve cutting the string or passing the string through itself.";
        expect(tokenizer.clean(text)).toEqual(expectText);
    });

});
