
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
module.exports.classifiers.LogisticRegression = require('./classifiers/logistic_regression');
module.exports.regression = {};
module.exports.regression.LinearRegression = require('./regression/linear_regression');
module.exports.math = {};
module.exports.math.Matrix = require('./math/matrix');
module.exports.math.Vector = require('./math/vector');
module.exports.normalizers = {};
module.exports.normalizers.MeanNormalizer = require('./normalizers/mean_normalizer');
module.exports.neuralnetworks = {};
module.exports.neuralnetworks.NeuralNetwork = require('./neuralnetworks/neuralnetwork');
module.exports.crossvalidation = {};
module.exports.crossvalidation.CrossValidate = require('./crossvalidation/crossvalidate');
module.exports.wiktionary = {};
module.exports.wiktionary.WiktionaryParser = require('./wiktionary/wikparser');
module.exports.corpus = {};
module.exports.corpus.BrownCorpus = require('./corpus/brown');
module.exports.corpus.PennTreeBank = require('./corpus/penn');
module.exports.corpus.TwitterTreeBank = require('./corpus/twitter');
module.exports.corpus.IULATreeBank = require('./corpus/iula');
module.exports.language = {};
module.exports.language.HiddenMarkovModel = require('./language/hmm');
module.exports.tagging = {}
module.exports.tagging.HmmTagger = require('./tagging/hmm_tagger');
module.exports.tagging.TreeTagger = require('./tagging/treetagger');
module.exports.glossary = {};
module.exports.glossary.Glossary = require('./glossary/glossary');
module.exports.sentiment = {};
module.exports.sentiment.BayesSentimentAnalyser = require('./sentiment/bayesanalyser');
module.exports.sentiment.SentiwordnetAnalyser = require('./sentiment/sentiwordnet_analyser');
module.exports.crawlers = {};
module.exports.crawlers.ContentCrawler = require('./crawlers/content_crawler');
module.exports.crawlers.SitemapCrawler = require('./crawlers/sitemap_crawler');
module.exports.graph = {};
module.exports.graph.DocumentGraph = require('./graph/document');
