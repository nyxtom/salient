## Libraries

Current libraries in review are with respect to their use in the project as a whole. Some of which may be necessary to tokenization, while others may be necessary to part of speech tagging and language modeling.

### TreeTagger
-------------
TreeTagger is a language independent part-of-speech tagger and a tool for analyzing text in general for extended lemma and pos information. It was developed by Helmut Schmid in the TC project at the Institute for Computational Linguistics of the University of Stuttgart. The TreeTagger has been successfully used to tag German, English, French, Italian, Dutch, Spanish, Bulgarian, Russian, Greek, Portuguese, Galician, Chinese, Swahili, Latin, Estonian and old French texts and is adaptable to other languages if a lexicon and a manually tagged training corpus are available.

**Sample output:**

```
word   pos   lemma 
The 	DT 	the 
TreeTagger 	NP 	TreeTagger 
is 	VBZ 	be 
easy 	JJ 	easy 
to 	TO 	to 
use 	VB 	use 
. 	SENT 	. 
```

### node-pstrscan
-------------
PStringScanner is a simple string tokenizer that provides for lexical scanning operations on a string.

It's the third port of the Ruby library into JavaScript. However, where the other ports concentrated on the interface, this one concentrates on speed.

The original Ruby version was written in C, and is very fast. This version, while not in C, is as fast on short strings (under 32 Kb of characters), and almost twice as fast on large strings (million+ characters) than the other ports.

**Quick Start:**

Scanning a string means keeping track of and advancing a position (a zero-based index into the source string) and matching regular expressions against the portion of the source string after the position.

```
var PStrScan = require("pstrscan");
var s = new PStrScan("This is a test");
s.scan(/\w+/);             // = "This"
s.scan(/\w+/);             // = null
s.scan(/\s+/);             // = " "
s.scan(/\s+/);             // = null
s.scan(/\w+/);             // = "is"
s.hasTerminated();         // = false
s.scan(/\s+/);             // = " "
s.scan(/(\w+)\s+(\w+)/);   // = "a test"
s.getMatch();              // = "a test"
s.getCapture(1);           // = "a"
s.getCapture(2);           // = "test"
s.hasTerminated();         // = true
```

### BabelNet
-------------
BabelNet is a multilingual lexicalized semantic network and ontology. BabelNet was automatically created by linking the largest multilingual Web encyclopedia - i.e. Wikipedia - to the most popular computational lexicon of the English language - i.e. WordNet. The integration is performed by means of an automatic mapping and by filling in lexical gaps in resource-poor languages with the aid of statistical machine translation. The result is an "encyclopedic dictionary" that provides concepts and named entities lexicalized in many languages and connected with large amounts of semantic relations. 

BabelNet (version 1.1.1) covers 6 European languages, namely: Catalan, French, German, English, Italian, and Spanish. BabelNet contains more than 5.5 million concepts and about 26 million word senses (regardless of their language). Each Babel synset contains 8.6 synonyms, i.e., word senses, on average, in any language. The semantic network includes all lexico-semantic relations from WordNet (hypernymy and hyponymy, meronymy and holonymy, antonymy and synonymy, etc., totaling around 364,000 relation edges) as well as an underspecified relatedness relation from Wikipedia (totally around 70 million relation edges).

#### Uses of BabelNet
Use cases of BabelNet will likely vary within the core applications, but it is very likely going to be useful in determining semantic relatedness for various common tasks within salient.io. The primary use case in word sense disambiguation will show useful in determing how to best categorize relevancy to a given query or in performing other tasks such as topic modeling. Further analysis can be done to determine how close a given query might relate to one or more unsupervised / categorized topics.

**Substitutions:** Same polarity (or even in the case of opposite polarity) substitutions can be derived by the polarity of a given set of synsets if two sets of documents are close enough to each other. This allows us to formalize and effectively summarize a seemingly large corpus of similar opinions into a distinct set of conclusions by substituting similar synsets.

**Deletions** can be performed where a given context can be made to be more succinct by removing synsets that have too many relations. This allows us to describe conclusions about seemingly wide variant opinions in order to find a common ground. If for instance many people describe various intents about **how** or ***where** or **why** their interaction is aimiable with a certain noun/object/product.. one can then derive a base conclusion that a given number of clustered individuals **like** that said product/place/noun/object.
