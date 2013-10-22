var Tokenizer = require('../lib/salient/tokenizers/wordpunct_tokenizer'),
    tokenizer = new Tokenizer();

describe('wordpunct_tokenizer', function () {

    it('should tokenize on words and punctuation', function () {
        var cleanText = 'data, here to clean.Wouldn\'t you say so? I have $20.45, are you ok?';
        var tokens = tokenizer.tokenize(cleanText);
        expect(tokens).toEqual([ 'data', ',', 'here', 'to', 'clean', '.', 'Wouldn', '\'', 't', 'you', 'say', 'so', '? ', 'I', 'have', '$20.45', ',', 'are', 'you', 'ok', '?' ]);
    });

});
