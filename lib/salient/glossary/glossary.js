
var fs = require('fs'),
    path = require('path'),
    util = require('util');

var HmmTagger = require('../tagging/hmm_tagger');
var Tokenizer = require('../tokenizers/tweet_tokenizer');
var Word = require('../language/word');

function Glossary(options) {
    this.options = options || {};
    this.lang = this.options.lang || "en";
    this.tagger = new HmmTagger(this.options);
    this.tokenizer = new Tokenizer(this.options);
    this.mapping = this._loadMapping(this.options.glossMap || path.join(__dirname, '../../../bin/glossdata/' + this.lang + '.gloss.map'));
};

Glossary.prototype._loadMapping = function (mapFile) {
    var mapping = {};
    var lines = fs.readFileSync(mapFile).toString().split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!line || line.trim().length == 0)
            continue;

        var item = line.trim().split('\t');
        if (item.length == 2) {
            mapping[item[0]] = item[1].split(',');
        }
    }
    return mapping;
};

Glossary.prototype.parse = function (text) {
    // reset root term
    if (this.root) {
        delete this.root;
    }
    
    var tokens = this.tokenizer.tokenize(text);
    var results = this.tagger.tag(tokens);
    var prevWord;
    for (var i = 0; i < results.length; i++) {
        var w = new Word(tokens[i], results[i], i, this.mapping);
        if (prevWord) {
            prevWord.next = w;
        }
        prevWord = w;

        if (!this.root) {
            this.root = w;
        }
    }

    this.collapse(false);
    this.collapse(true);
};

Glossary.prototype.collapse = function (chunk) {
    var initial = true;
    var current = this.root;
    var keepCurrent = false;
    while (keepCurrent || current.next) {
        if (!keepCurrent && !initial) {
            current = current.next;
        }
        else {
            initial = false;
            keepCurrent = false;
        }

        if (!current)
            break;

        if (!chunk)
            keepCurrent = current.collapseLinks(this.mapping);
        else
            keepCurrent = current.chunk(this.mapping);
    }
};

Glossary.prototype.concepts = function () {
    var concepts = [];
    var current = this.root;

    do {
        if (current.isNoun) {
            concepts.push(current.format());
        }
        current = current.next;
    } while (current);

    return concepts;
};

module.exports = Glossary;
