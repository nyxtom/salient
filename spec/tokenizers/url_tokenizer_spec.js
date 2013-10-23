var Tokenizer = require('../../lib/salient/tokenizers/url_tokenizer'),
    tokenizer = new Tokenizer();

describe('url_tokenizer', function () {

    it('should tokenize on urls', function () {
        var cleanText = '1 users just unfollowed me. I found out using this awesome #iPhone #app: http://bit.ly/Unfollowed. @TwitrManager';
        var tokens = tokenizer.tokenize(cleanText);
        expect(tokens).toEqual(["http://bit.ly/Unfollowed"]);
    });

    it('should tokenize on complicated urls like wiki', function () {
        var text = 'Some text with a http://en.wikipedia.org/wiki/Liverpool_F.C._(disambiguation) wikipedia url in it.';
        var tokens = tokenizer.tokenize(text);
        expect(tokens).toEqual(['http://en.wikipedia.org/wiki/Liverpool_F.C._(disambiguation)']);
    });

    it('should tokenize on urls with extra characters', function () {
        var text = "SECRET:  http://RELEASEYOURRETURNS.COM,.,.WHAT IS ROMNEY HIDING?  rptd @nwssssss";
        var tokens = tokenizer.tokenize(text);
        expect(tokens).toEqual(['http://RELEASEYOURRETURNS.COM']);
    });

    it('should tokenize on urls that have lots of information in them', function () {
        var text = "this is a test http://nwotruth.com/my-grandma-the-fracking-matriarch/?utm_source=feedburner&utm_medium=twitter&utm_campaign=Feed:+InformationTerrorism+(\"NWO+Feeds\"+via+Information+Terrorism can't you see it?";
        var tokens = tokenizer.tokenize(text);
        expect(tokens).toEqual(['http://nwotruth.com/my-grandma-the-fracking-matriarch/?utm_source=feedburner&utm_medium=twitter&utm_campaign=Feed:+InformationTerrorism']);
    });

    it('should tokenize on urls that have hidden text appended', function () {
        var text = "Some text with telegraph.co.uk/news: url hidden www.sun.com, inside it";
        expect(tokenizer.tokenize(text)).toEqual([ 'telegraph.co.uk/news', 'www.sun.com' ]);
        text = "77% discount on a http://bbc.co.uk, SwitchEasy Melt Case for iPhone 4/4S from http://DealsOnDirect.com...";
        expect(tokenizer.tokenize(text)).toEqual([ 'http://bbc.co.uk', 'http://DealsOnDirect.com' ]);
    });

});
