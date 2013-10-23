var Tokenizer = require('../../lib/salient/tokenizers/emoticon_tokenizer'),
    tokenizer = new Tokenizer();

describe('emoticon_tokenizer', function () {

    it('should tokenize where possible on emoticons', function () {
        expect(tokenizer.tokenize("RT @sampleusername: this is typical :)"))
            .toEqual([ ':)' ]);
        var text = tokenizer.clean("HTML entities & other Web oddities can be an &aacute;cute <em class='grumpy'>pain</em> >:(");
        expect(tokenizer.tokenize(text)).toEqual([ '>:(' ]);
    });

    it('should tokenize where possible on emoticons and return indices', function () {
        var tokenizer = new Tokenizer({ includeIndices: true });
        expect(tokenizer.tokenize("RT @sampleusername: this is typical :)"))
            .toEqual([ { v : ':)', indices : [ 36, 38 ] } ]);
        var text = tokenizer.clean("HTML entities & other Web oddities can be an &aacute;cute <em class='grumpy'>pain</em> >:(");
        expect(tokenizer.tokenize(text)).toEqual([ { v : '>:(', indices : [ 87, 90 ] } ]);
    });

});
