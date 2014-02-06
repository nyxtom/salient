
var salient = require('./..');
var analyser = new salient.sentiment.BayesSentimentAnalyser();
analyser.classify('I love this iPad');
