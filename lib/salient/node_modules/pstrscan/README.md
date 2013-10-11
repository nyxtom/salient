## PStringScanner

### Overview

**PStringScanner** is a simple string tokenizer that provides for lexical scanning operations on a string.

It's the _third_ port of the [Ruby  library](http://corelib.rubyonrails.org/classes/StringScanner.html) into JavaScript. However, where the other ports concentrated on the interface, this one concentrates on **speed**.

The original Ruby version was written in C, and is very fast. This version, while not in C, is as fast on short strings (under 32 Kb of characters), and almost **twice as fast** on large strings (million+ characters) than the other ports.

### Installation

~~~
npm install -g pstrscan
~~~

### Quick start

Scanning a string means keeping track of and advancing a position (a zero-based index into the source string) and matching regular expressions against the portion of the source string after the position.

~~~js
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
~~~

### Documentation

The [interface should be familiar](http://sstephenson.github.com/strscan-js/) to those familiar with the [original library](http://corelib.rubyonrails.org/classes/StringScanner.html), and the one originally ported to [JavaScript/Node](http://sstephenson.github.com/strscan-js/). There are some slight differences, but you should be able to gleam those from the [source file](https://github.com/jhamlet/node-pstrscan/blob/master/lib/pstrscan.js).

### To Do

1.  More documentation specific to this implementation.
2.  Add a more comprehensive `unscan` history/capability.