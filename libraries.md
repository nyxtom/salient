## Libraries

Current libraries in review are with respect to their use in the project as a whole. Some of which may be necessary to tokenization, while others may be necessary to part of speech tagging and language modeling.

### TreeTagger
TreeTagger is a language independent part-of-speech tagger and a tool for analyzing text in general for extended lemma and pos information. It was developed by Helmut Schmid in the TC project at the Institute for Computational Linguistics of the University of Stuttgart. The TreeTagger has been successfully used to tag German, English, French, Italian, Dutch, Spanish, Bulgarian, Russian, Greek, Portuguese, Galician, Chinese, Swahili, Latin, Estonian and old French texts and is adaptable to other languages if a lexicon and a manually tagged training corpus are available.

**Sample output:**

```
word   pos 	lemma 
The 	DT 	the 
TreeTagger 	NP 	TreeTagger 
is 	VBZ 	be 
easy 	JJ 	easy 
to 	TO 	to 
use 	VB 	use 
. 	SENT 	. 
```

### node-pstrscan
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
