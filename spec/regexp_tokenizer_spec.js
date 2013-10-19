var Tokenizer = require('../lib/salient/tokenizers/regexp_tokenizer'),
    tokenizer = new Tokenizer({ pattern: /\W+/ });

describe('regexp_tokenizer', function () {
    it('should tokenize strings', function () {
        expect(tokenizer.tokenize('these are things')).toEqual(['these','are','things']);
    });

    it('should tokenize strings via attached string method', function () {
        tokenizer.attach();
        expect('these are things'.tokenize()).toEqual(['these','are','things']);
    });

    it('should pre-empatively find nothing when no match exists', function () {
        tokenizer.pattern = /#[A-Za-z]+/;
        tokenizer.triggerChar = '#'.charCodeAt(0);
        var result = 'these are things without hashtags'.tokenize();
        expect(result).toEqual([]);
        expect(tokenizer.match).toEqual(undefined);
    });

    it('should clean the input where possible', function () {
        var t = new Tokenizer({ cleanPattern: /<\/?[A-Za-z]*>/g });
        expect(t.clean('<text>data here to clean</text>')).toEqual('data here to clean');
    });

    it('should not clean when no trigger character exists', function () {
        var t = new Tokenizer({ cleanPattern: /<\?[A-Za-z]*>/g, cleanTriggerChar: '<' });
        var result = t.clean('this should not have to run the clean routine');
        expect(result).toEqual('this should not have to run the clean routine');
        expect(tokenizer.cleanMatch).toEqual(undefined);
    });

});
