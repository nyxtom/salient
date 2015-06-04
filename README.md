# salient
salient is a natural language processing and machine learning toolkit. Salient contains many common tasks from sentiment analysis, part of speech tagging, tokenization, neural networks, regression analysis, wiktionary parsing, logistic regression, language modeling, mphf, radix trees, vocabulary building and the potential for more awesomeness. It can be used for many classification tasks, categorization, and many common text processing tasks all in node.js :D

```
npm install salient
```

## Features

* Sentiment Analysis (includes negation semantics, amplifiers, sarcasm detection)
* Various Machine Learning Algorithms with regularization, cross validation, learning curves, normalization
* Neural Networks (Feedforward N-Layers with Y-Units)
* Logistic Regression
* Linear Regression
* Language Modeling (minimal perfect hashing, gaddag, radix trees, tries)
* Hidden Markov Models
* Tri-gram HMM Part of Speech Tagger
* Wiktionary Parsing
* Tokenization (Tweets, URLS, Word Puncutation, RegExp, Emoticons, Wiki Articles, HTML)
* Corpus Parsing / Building
* Brown Corpus Parsing / Analyzer
* Penn TreeBank Corpus Parsing / Analyzer
* Twitter TreeBank Corpus Parsing / Analyzer
* IULA Spanish LSP TreeBank Parsing / Analyzer
* Universal Part of Speech Tagset Mappings
* Tree Tagger Part of Speech Tagger
* Text Analyzer (concepts, relations (concept-relationship-concept), filtering, stop-words, tagging)
* Corpus Coverage Testing
* Vocabulary Merging
* Sentiment Terms
* Web Crawling
* Document Search (backed by Redis)

## Tokenization

There are plenty of libraries that perform tokenization, this library is
no different, the only exception is that this library will also do some
tokenization steps necessary to cleanup random HTML, XML, Wiki, Twitter
and other sources. More examples are in the `specs` directory. Tokenizers
in salient are built on top of each other and include the following:

* **Tokenizer** (lib/salient/tokenizers/tokenizer.js) `abstract`
* **RegExpTokenizer** (lib/salient/tokenizers/regexp_tokenizer.js) `extends: Tokenizer`

```
var salient = require('salient');
var tokenizer = new salient.tokenizers.RegExpTokenizer({ pattern: /\W+/ });
tokenizer.tokenize('these are things');
> ['these', 'are', 'things']
  
```
  	  
* **UrlTokenizer** (lib/salient/tokenizers/url_tokenizer.js) `extends: Tokenizer`
  * Leverages [twitter-text](https://github.com/twitter/twitter-text)

```
var salient = require('salient');
var tokenizer = new salient.tokenizers.UrlTokenizer();
tokenizer.tokenize('Some text a http://en.wikipedia.org/wiki/Liverpool_F.C._(disambiguation) wikipedia url in it.');
> ['http://en.wikipedia.org/wiki/Liverpool_F.C._(disambiguation)']
  
```

* **WordPunctTokenizer** (lib/salient/tokenizers/wordpunct_tokenizer.js) `extends: RegExpTokenizer`
  * Handles Time, Numerics (including 1st, 2nd..etc), numerics with commas/decimals/percents, $, words with hyphenations, words with and without accepts, with and without apostrophes, punctuations and optional emoticon preservation.
  
```
var salient = require('salient');
var tokenizer = new salient.tokenizers.WordPunctTokenizer();
tokenizer.tokenize('From 12:00 am-11:59 pm. on Nov. 12th, you can make donation online to support Wylie Center.')
> [ 'From', '12:00 am', '-', '11:59 pm.', 'on', 'Nov', '.', '12th', ',', 'you', 'can', 'make', 'donation', 'online', 'to', 'support', 'Wylie', 'Center', '.' ]

// preserve emoticons
tokenizer = new salient.tokenizers.WordPunctTokenizer({ preserveEmoticons: true })
tokenizer.tokenize('data, here to clean.Wouldn\'t you say so? :D I have $20.45, are you ok? >:(');
> [ 'data', ',', 'here', 'to', 'clean', '.', 'Wouldn', '\'', 't', 'you', 'say', 'so', '? ', ':D', 'I', 'have', ' $', '20.45', ',', 'are', 'you', 'ok', '?', '>:(' ]

``` 

* **EmoticonTokenizer** (lib/salient/tokenizers/emoticon_tokenizer.js) `extends: RegExpTokenizer`
  * Handles basic emoticons pattern shown in the given file
  
```
var salient = require('salient');
var tokenizer = new salient.tokenizers.EmoticonTokenizer();
tokenizer.tokenize('RT @sampleusername: this is typical :)')
> [ ':)' ]
```

* **ArticleTokenizer** (lib/salient/tokenizers/article_tokenizer.js) `extends: Tokenizer`
  * Includes: **UrlTokenizer**, **WordPunctTokenizer**, **RegExpTokenizer**
  * Leverages: [underscore](http://underscorejs.org/)
  
```
var salient = require('salient');
var tokenizer = new salient.tokenizers.ArticleTokenizer({ compressWhitespace: true });
var text = "In 1927, working with this diagrammatic form of knots, [[J.W. Alexander]] and G. B. Briggs, and independently [[Kurt Reidemeister]], demonstrated that two knot diagrams belonging to the same knot can be related by a sequence of three kinds of moves on the diagram, shown below. These operations, now called the '''Reidemeister moves''', are:" + 
'<ol style="list-style-type:upper-Roman">' + 
'\r\n        <li> Twist and untwist in either direction.</li>' + 
'\r\n        <li> Move one strand completely over another.</li>' + 
'\r\n        <li> Move a strand completely over or under a crossing.</li>' + 
'        </ol>' + 
'' + 
'    {| align="center" style="text-align:center"' + 
"        |+ '''Reidemeister moves'''" + 
'        |- style="padding:1em"' + 
"        | [[Image:Reidemeister move 1.png|130px|]] [[File:Frame left.png]] || [[Image:Reidemeister move 2.png|210px]]" + 
"        |-" + 
"        | <u>Type I</u> || <u>Type II</u>" + 
'        |- style="padding:1em"' + 
'        | colspan="2" | [[Image:Reidemeister move 3.png|360px]]' + 
'        |-' + 
'        | colspan="2" | <u>Type III</u>' + 
"        |}";
tokenizer.clean(text);
> "In 1927, working with this diagrammatic form of knots, J.W. Alexander and G. B. Briggs, and independently Kurt Reidemeister, demonstrated that two knot diagrams belonging to the same knot can be related by a sequence of three kinds of moves on the diagram, shown below. These operations, now called the '''Reidemeister moves''', are: Twist and untwist in either direction. Move one strand completely over another. Move a strand completely over or under a crossing."
```

* **TweetTokenizer** (lib/salient/tokenizers/tweet_tokenizer.js) `extends: ArticleTokenizer`
  * Leverages: [underscore](http://underscorejs.org/), [twitter-text](https://github.com/twitter/twitter-text)
  
```
var salient = require('salient');
var tokenizer = new salient.tokenizers.TweetTokenizer();
tokenizer.tokenize('RT @sampleusername: this is typical :)')
> [ 'RT', '@sampleusername', ':', 'this', 'is', 'typical', ':)' ]
```

## Part of Speech Tagging

Part of speech tagging is done primarily through the use of the trigram hidden-markov model. While there are many methods used since then, Trigram HMM, seems to be the easiest to implement while maintaining an effective accuracy. This was built through the use of several resources online including bootstrapping the vocabulary using Wiktionary (https://www.wiktionary.org/). This is a common alternative technique to the unsupervised learning technique by providing a bit of an edge to the model with an existing dictionary of sorts. In some cases, the dictionary can be generated from a part of speech corpus (sometimes manually or automatically tagged). 

On top of Wiktionary, I am using several corpus to build the English language model including: **Brown Corpus**, **Penn TreeBank**, **Twitter TreeBank**. These treebanks provide a resource for calculating and training the model for supervised learning cases. The actually tagging portion is done using the Viterbi path finding algorithm implemented for all standard models. The spanish model is trained using the **IULA Spanish LSP TreeBank**. You will notice both models are stored in the [bin](https://github.com/nyxtom/salient/tree/master/bin/) directory.

More information is provided on the building of this model in [Trigram Hidden Markov Model Part of Speech Tagger](https://github.com/nyxtom/salient/blob/master/HMM_TRIGRAM.md).

```
var salient = require('salient');
var hmmTagger = new salient.tagging.HmmTagger();
hmm.tag([ 'How', 'are', 'you', 'doing', 'today', '?', 'The', 'weather', 'looks', 'beautiful', 'today', '!' ]);
> [ 'ADV', 'VERB', 'PRON', 'VERB', 'NOUN', '.', 'DET', 'NOUN', 'VERB', 'ADJ', 'NOUN', '.' ]
```

## Glossary
Glossary is sometimes used for looking up concepts, terms or relationships between terms. This is far from perfect, but it gives a good usecase for some information retrieval. You may find other libraries do this better, but I'm currently using this part of the library to build towards sentiment analysis use cases. 

Glossary has things that I found useful when building the sentiment analysis portion which include catalogging things like copulae verbs, linking verbs, terms that are often filtered (i.e. stop terms), question terms, time sensitive nouns, amplifiers, clauses, coordinating conjunctions, negations, conditionals (ORs), and contractions. All these proved very useful in the sentiment analysis stage where the particular algorithm I implemented is described in more detail below.

As you can see in the code sample below, I have done a bit of chunking for terms and with some common filtering rules I can combine filtered terms, determiners with their nouns..etc. Additionally, the output of glossary helps me debug when something gets parsed oddly. Nevertheless, with this utility I can follow the flow of logic in a given sentence and make it easier to look at relationships between terms.

```
var salient = require('salient');
var glossary = new salient.glossary.Glossary();
glossary.parse("This is going to be an awesome test");

{ term: 'This is going to be',
  distinct: 'is going to be',
  tag: 'VERB',
  children:
   [ { term: 'is',
       tag: 'VERB',
       position: 1,
       isVerb: true,
       isQTerm: true,
       isCop: true,
       isLink: true,
       isFiltered: true },
     { term: 'going', tag: 'VERB', position: 2, isVerb: true },
     { term: 'to',
       tag: 'PRT',
       position: 3,
       isPrt: true,
       isTo: true,
       isFiltered: true },
     { term: 'be',
       tag: 'VERB',
       position: 4,
       isVerb: true,
       isFiltered: true } ],
  beginsDet: true,
  isVerb: true,
  orig:
   { term: 'This',
     distinct: 'this',
     tag: 'DET',
     isDet: true,
     isFiltered: true },
  termMap: [ 'This', 'is', 'going', 'to', 'be' ] }
{ term: 'an awesome test',
  tag: 'NOUN',
  position: 5,
  children:
   [ { term: 'awesome',
       tag: 'ADJ',
       position: 6,
       isAdj: true,
       isAdjCard: true },
     { term: 'test',
       tag: 'NOUN',
       position: 7,
       isNoun: true,
       isCop: true } ],
  beginsDet: true,
  isNoun: true,
  orig:
   { term: 'an',
     tag: 'DET',
     position: 5,
     isDet: true,
     isFiltered: true },
  termMap: [ 'an', 'awesome', 'test' ],
  distinct: 'awesome test' }

```

The flow of logic is further helped when I include negations of any sort show below. The inclusion of a negation breaks the flow of our logic and instead negates the rest of our sentence. This is explored further in the sentiment analysis stage of the library.

```
var salient = require('salient');
var glossary = new salient.glossary.Glossary();
glossary.parse("This is never going to be an awesome test");

{ term: 'This is',
  distinct: 'is',
  tag: 'VERB',
  children:
   [ { term: 'is',
       tag: 'VERB',
       position: 1,
       isVerb: true,
       isQTerm: true,
       isCop: true,
       isLink: true,
       isFiltered: true } ],
  beginsDet: true,
  isVerb: true,
  isFiltered: true,
  orig:
   { term: 'This',
     distinct: 'this',
     tag: 'DET',
     isDet: true,
     isFiltered: true },
  termMap: [ 'This', 'is' ] }
{ term: 'never',
  tag: 'ADV',
  position: 2,
  isAdv: true,
  isNeg: true }
{ term: 'going to be',
  tag: 'VERB',
  position: 3,
  children:
   [ { term: 'to',
       tag: 'PRT',
       position: 4,
       isPrt: true,
       isTo: true,
       isFiltered: true },
     { term: 'be',
       tag: 'VERB',
       position: 5,
       isVerb: true,
       isFiltered: true } ],
  isVerb: true,
  isLink: true,
  orig: { term: 'going', tag: 'VERB', position: 3, isVerb: true },
  termMap: [ 'going', 'to', 'be' ] }
{ term: 'an awesome test',
  tag: 'NOUN',
  position: 6,
  children:
   [ { term: 'awesome',
       tag: 'ADJ',
       position: 7,
       isAdj: true,
       isAdjCard: true },
     { term: 'test',
       tag: 'NOUN',
       position: 8,
       isNoun: true,
       isCop: true } ],
  beginsDet: true,
  isNoun: true,
  orig:
   { term: 'an',
     tag: 'DET',
     position: 6,
     isDet: true,
     isFiltered: true },
  termMap: [ 'an', 'awesome', 'test' ],
  distinct: 'awesome test' }

```

## Sentiment Analysis
The approach I took to sentiment analysis builds on top of a rather simple naive bayes approach. The naive bayes approach is such that we have a set of buckets which are classified between varying degrees of positive and negative and neutral. The terms in each category should be up to n-gram terms. The sentiment algorithm combines the use of amplifiers (terms that tend to amplify or show additional excitement on an existing term; i.e. 'crazy good'). 

It makes use of most of the features obtained from the glossary above (including negations). The analyzer will look for scorable terms that our bayes buckets specify, it will look for LCS (longest common substring) and determine whether the terms are even scorable due to varying rules due to filtering. Once we've effectively scored all the possible terms in our text, we can go through the text once again in a node by node sequence (using a finite state machine) to detect things like conditionals, negations, semantic clauses, amplifiers, inclusions (AND), or final orientation terms such as hashtags which may negate the entire text (common in the case of sarcastic tweets). 

Finally, once we've determined the final polarity of our text, we give it a cumulative score. This process also identifies semantic orientation on a per term basis, which means we can go back and actually see the orientation of individual terms.

```
var salient = require('salient');
var analyser = new salient.sentiment.BayesSentimentAnalyser();
analyser.classify("That product will never be good at disappointing their users")
> 1.5
analyser.classify("I love how Wall Street screwed things up")
> -1.5
analyser.classify("I'm dying to have a snickers bar")
> 1
analyser.classify("I am loving the 10-second page loads on this site #not")
> -2
```

While the above test cases are cool, it doesn't mean this is some super magical system that can get it right all the time. Language is complex and finicky - and sentiment analysis requires inductive reasoning along with a load of other AI problems. However, that being said, you should see a reasonable amount of cases are shown in [bin/tests](https://github.com/nyxtom/salient/tree/master/bin/tests).

## Notes

It should be noted that most machine learning algorithms would be better suited in environments that can take advantage of many cores, such as in the case of GPU accelerated machine learning. Such things are necessary in order to speed up the learning rate as well as the task at hand given that many complex linear algebra operations can be done efficiently in parallel. As a result, this project is more of an example test case implementation for a wide-variety of machine learning and artificial intelligence problems. For more robust implementations, it is recommended that you glean from my implementations and others (i.e. by reference to Andrew Ng's Machine Learning course) and use that within the scope of your projects. However, there are other techniques such as map-reduce that may be able to improve the performance of running some of these operations within this package on multiple cores and multiple systems in parallel.

## License

Licensed under GPLv2

Copyright (c) 2015 Thomas Holloway (@nyxtom)