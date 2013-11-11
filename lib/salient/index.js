
/**
 * Module imports for tokenizers
 */

module.exports.tokenizers = {};
module.exports.tokenizers.ArticleTokenizer = require('./tokenizers/article_tokenizer');
module.exports.tokenizers.TweetTokenizer = require('./tokenizers/tweet_tokenizer');
module.exports.tokenizers.UrlTokenizer = require('./tokenizers/url_tokenizer');
module.exports.tokenizers.EmoticonTokenizer = require('./tokenizers/emoticon_tokenizer');
module.exports.tokenizers.RegExpTokenizer = require('./tokenizers/regexp_tokenizer');
module.exports.tokenizers.WordPunctTokenizer = require('./tokenizers/wordpunct_tokenizer');
module.exports.tokenizers.Tokenizer = require('./tokenizers/tokenizer');
module.exports.classifiers = {};
module.exports.classifiers.BayesClassifier = require('./classifiers/bayes_classifier');
module.exports.regression = {};
module.exports.regression.LinearRegression = require('./regression/linear_regression');
