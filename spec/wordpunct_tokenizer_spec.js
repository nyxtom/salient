var Tokenizer = require('../lib/salient/tokenizers/wordpunct_tokenizer'),
    tokenizer = new Tokenizer();

describe('wordpunct_tokenizer', function () {

    it('should tokenize on words and punctuation and money', function () {
        var cleanText = 'data, here to clean.Wouldn\'t you say so? I have $20.45, are you ok?';
        var tokens = tokenizer.tokenize(cleanText);
        expect(tokens).toEqual([ 'data', ',', 'here', 'to', 'clean', '.', 'Wouldn', '\'', 't', 'you', 'say', 'so', '? ', 'I', 'have', ' $', '20.45', ',', 'are', 'you', 'ok', '?' ]);
    });

    it('should tokenize on words and punctuation and numerics', function () {
        var cleanText = 'data, here to clean.Wouldn\'t you say so? I have 23.22! Are you ok?';
        var tokens = tokenizer.tokenize(cleanText);
        expect(tokens).toEqual([ 'data', ',', 'here', 'to', 'clean', '.', 'Wouldn', '\'', 't', 'you', 'say', 'so', '? ', 'I', 'have', '23.22', '!', 'Are', 'you', 'ok', '?' ]);
    });

    it('should tokenize on words and punctuation and many numerics', function () {
        var cleanText = 'data, here to clean.Wouldn\'t you say so? I have -23,323,234! Are you 2,234.00?';
        var tokens = tokenizer.tokenize(cleanText);
        expect(tokens).toEqual([ 'data', ',', 'here', 'to', 'clean', '.', 'Wouldn', '\'', 't', 'you', 'say', 'so', '? ', 'I', 'have', '-23,323,234', '!', 'Are', 'you', '2,234.00', '?' ]);
    });

});
