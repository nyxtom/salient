var Tokenizer = require('../lib/salient/tokenizers/article_tokenizer'),
    tokenizer = new ArticleTokenizer();

describe('regexp_tokenizer', function () {

    it('should clean the input where possible', function () {
        expect(tokenizer.clean('<div><a href="http://www.google.com" data-prop="bleh">data here to clean</a></div>'))
              .toEqual('data here to clean');
    });

});
