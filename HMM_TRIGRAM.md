### Building a Trigram Model

In order to build a trigram hmm model, you need a place to start that will be able to build a vocabulary with cooresponding distributed possible parts of speech per vocabulary term. Traditionally, this is done by using treebanks which contain example uses of various terms and their cooresponding parts of speech. Treebanks give you enough information to be able to derive a dictionary with the probability distribution of each part of speech for every term that is found in the treebank. As an alternative to this, you can leverage a source like wiktionary to download and derive a dictionary and determine all the types of parts of speech that a term occurs in a given language. Without the frequencies, the distribution will be evenly divided among the term, weighted additionally by the overall probability of that tag.

##### Parsing a Dictionary Source (Wiktionary)

To parse wiktionary, use the following command line with an XML export of the language page articles.
```
$ node bin/parsewik.js language-pages-articles.xml ./
```

This should generate 2 files documenting the overall vocabulary of the language and the part of speech distribution within that dictionary parsed from the wikipedia export.

```
$ cat bin/es.wik.dist

Total Vocabulary: 155391
Unambiguous: 148871 96%
Dual: 5841 4%
Tri: 552 0%
Quad: 96 0%
+4: 30 0%

# The following displays the order of frequency and distribution
# for all the mapped states for the given language {es}

0	NOUN	62431	40%
2	ADJ	45821	29%
6	PRON	37752	24%
1	VERB	12274	8%
3	ADV	2926	2%
4	X	623	0%
10	ADP	318	0%
7	CONJ	285	0%
5	NUM	253	0%
8	DET	66	0%
9	PRT	10	0%
11	.	0	0%
12	*	0	0%
```

##### Building a distribution from a tree bank source

Next, you'll need to acquire a treebank to build a trigram distribution model over the various parts of speech. A treebank may also help to enhance the vocabulary built off of the existing set of data downloaded from wiktionary or other dictionary sources. For example, the Brown Corpus is parsed and as a result of the output:

```
node bin/browncorpus.js ~/Public/brown
```

The output of this will generate 3 different files. `en-brown.tag.vocab`, `en-brown.tag.dist`, and `en-brown.sentences`. The output of the `en-brown.tag.vocab` is a vocabulary distribution similar to the one created by the wiktionary parser. The only difference is this particular vocabulary also includes part of speech term frequencies.

```
the     69971   DET/69969,X/4
,       58334   ./58334,X/2
.       49346   ./49347
of      36412   ADP/36411,X/3
and     28853   CONJ/28851,X/4
```

The second file `en-brown.tag.dist` contains part of speech tri-gram distributions, including end of sentence STOP and beginning of sentence prefix *.

```
VERB+ADP+DET    27583   22%
VERB+.  27385   22%
DET+NOUN+VERB   26952   22%
NOUN+NOUN+.     26015   20%
ADV+VERB        25236   20%
NUM     25006   18%
*+DET   24476   21%
*+*+DET 24476   21%
NOUN+VERB+VERB  23734   20%
VERB+PRT        22353   18%
ADP+NOUN+.      21934   18%
ADP+ADJ 21758   17%
.+NOUN  21168   16%
DET+NOUN+NOUN   21165   17%
```

Following this, a generated file for all the sentences will be generated in the appropriate penn treebank format.

```
The/DET Fulton/NOUN County/NOUN Grand/ADJ Jury/NOUN said/VERB Friday/NOUN an/DET investigation/NOUN of/ADP Atlanta's/NOUN recent/ADJ primary/NOUN election/NOUN produced/VERB ``/. no/DET evidence/NOUN ''/. that/ADP any/DET irregularities/NOUN took/VERB place/NOUN ./.
```

A simple set of options `--lines=1000 --skip=1000` will allow you to skip and select a number of lines from a corpus which can be used for cross validation of the data. This is important when actually building the hidden markov model as the distributions will most certainly vary with each corpus.

##### Merging Vocabularies

Given that the tree bank may cover less or more than the dictionary source, it would be advised to merge the vocabularies together in order to get better coverage of the language as well as the general frequency distribution of each term and the cooresponding parts of speech. You can check the coverage of two vocabularies with the following:

```
node bin/corpuscoverage.js en.wik.dist en.wik.vocab en-brown.tag.vocab
```

This will generate two files, `uncovered.corpus.vocab` and `covered.corpus.vocab` along with the output of how much of the corpus was found in the original dictionary source, how much was not found, and how much of the vocabulary was found in the corpus. Once you've figured out what needs to be merged, you can use the command:

```
node bin/mergevocabulary.js en.wik.vocab covered.corpus.vocab
```

This will generate `corpus.vocab` as an output of the merged vocabulary between the dictionary source and what was covered by the tree bank corpus. It is necessary to merge these items given that we want to include the frequency terms of items in which the tree bank have frequencies for where the dictionary does not. Additionally, you may want to consider just merging in the `uncovered.corpus.vocab` for good measure, but this depends on whether you want to exclude vocabulary terms to see how well the model performs.

##### Creating an N-Gram Model

Now that we have a sound vocabulary, we can create an n-gram model used by the Hidden Markov code. To do this we can simply run the command. The output of this will create a `model.json` serialized form of the Hidden Markov Model loaded with the vocabulary from both the dictionary and the tree bank source.

```
node bin/ngrammodel.js corpus.vocab
```

We can now use the `en-brown.tag.dist` (tag distribution from the tree bank) to create a hidden markov chain. This is easily done by using the command below. The output of this will create a `model.tagdist.json` serialized form of the Hidden Markov Model with the tag distribution and various estimated distributions all calculated for us.

```
node bin/hmmtags.js en-brown.tag.dist
```

##### Training/Cross Validation

In order to cross validate and accurately test our model, we need to select from a subset of samples in the tree bank or tree bank sources we have. In order to do this, we have to generate the `model.tagdist.json` by selecting from a subset of sentences.

```
node bin/browncorpus.js ~/Public/brown --lines=15000
```

This would help us create a training set initially for the tag distribution model that we can estimate on. We can generate another `model.tagdist.json` from the `hmmtags` command above from a different sample set. Ideally you will want to split up between a `training set`, `cross validation set`, and a `test set`. Once you have created these 3 tag distribution models you can then actually train the hidden markov model to pick the right weights for the model.

```
node bin/hmmtrain.js model.training-tagdist.json model.validation-tagdist.json model.test-tagdist.json
```

This will output the best lambda weight values to use for the hidden markov model. Once you have those, you can configure those into the HiddenMarkovModel via the model.`lambdaV`. The initial configuration is setup for english, but this can be overridden for any new model.

##### Testing the Model

Since we have 2 different files that represent parts of the same HiddenMarkovModel we will want to merge these files. Take a look at `bin/hmmloader.js` for a quick example on how to merge them together. The output of below should give you a unified output model `output.hmm.json` that you can then use to test.

```
node bin/hmmloader.js model.json model.tagdist.json en.hmm.json
```

Testing the accuracy of your model can be done against any of your tree banks sample sets or test sets. It is useful to use this in order to determine the overall precision and accuracy of what you've put together.

```
node bin/hmmtest.js en-brown.sentences en.hmm.json --lines=1000 --skip=10000
```

### Notes

It should be noted that most machine learning algorithms would be better suited in environments that can take advantage of many cores, such as in the case of GPU accelerated machine learning. Such things are necessary in order to speed up the learning rate as well as the task at hand given that many complex linear algebra operations can be done efficiently in parallel. As a result, this project is more of an example test case implementation for a wide-variety of machine learning and artificial intelligence problems. For more robust implementations, it is recommended that you glean from my implementations and others (i.e. by reference to Andrew Ng's Machine Learning course) and use that within the scope of your projects. However, there are other techniques such as map-reduce that may be able to improve the performance of running some of these operations within this package on multiple cores and multiple systems in parallel.

### License

Licensed under GPLv2

Copyright (c) 2014 Thomas Holloway (@nyxtom)
