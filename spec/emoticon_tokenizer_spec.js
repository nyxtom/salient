var Tokenizer = require('../lib/salient/tokenizers/emoticon_tokenizer'),
    tokenizer = new Tokenizer();

describe('emoticon_tokenizer', function () {

    it('should tokenize where possible on emoticons', function () {
        expect(tokenizer.tokenize("RT @sampleusername: this is typical :)"))
            .toEqual([ ':)' ]);
        var text = tokenizer.clean("HTML entities & other Web oddities can be an &aacute;cute <em class='grumpy'>pain</em> >:(");
        expect(tokenizer.tokenize(text)).toEqual([ '>:(' ]);
    });

});
