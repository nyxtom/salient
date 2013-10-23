var Tokenizer = require('../../lib/salient/tokenizers/tweet_tokenizer'),
    tokenizer = new Tokenizer();

describe('regexp_tokenizer', function () {

    it('should tokenize where possible on a given sample tweet', function () {
        expect(tokenizer.tokenize("RT @mparent77772: Should Obama's 'internet kill switch' power be curbed? http://bbc.in/hcVGoz"))
            .toEqual([ 'RT', '@mparent77772', ':', 'Should', 'Obama', '\'', 's', '\'', 'internet', 'kill', 'switch', '\'', 'power', 'be', 'curbed', '? ', 'http://bbc.in/hcVGoz' ]);
    });

    it('should tokenize where possible on emoticons', function () {
        expect(tokenizer.tokenize("RT @sampleusername: this is typical :)"))
            .toEqual([ 'RT', '@sampleusername', ':', 'this', 'is', 'typical', ':)' ]);
        expect(tokenizer.tokenize(tokenizer.clean("HTML entities &amp; other Web oddities can be an &aacute;cute <em class='grumpy'>pain</em> >:(")))
            .toEqual([ 'HTML', 'entities', ' & ', 'other', 'Web', 'oddities', 'can', 'be', 'an', 'ácute', 'pain', '>:(' ]);
    });

    it('should tokenize on cashtags, hashtags and usernames', function () {
        expect(tokenizer.tokenize('RT @username: $APL is #amazing!!!'))
            .toEqual([ 'RT', '@username', ':', '$APL', 'is', '#amazing', '!', '!', '!' ]);
    });

});
