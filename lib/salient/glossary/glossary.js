
var fs = require('fs'),
    path = require('path'),
    util = require('util');

var HmmTagger = require('../tagging/hmm_tagger');
var Tokenizer = require('../tokenizers/tweet_tokenizer');
var Word = require('../language/word');

function Glossary(options) {
    this.options = options || {};
    this.lang = this.options.lang || "en";
    this.spacing = this.options.spacing || " ";
    this.tagger = new HmmTagger(this.options);
    this.tokenizer = new Tokenizer(this.options);
    this.mapping = this._loadMapping(this.options.glossMap || path.join(__dirname, '../../../bin/glossdata/' + this.lang + '.gloss.map'));
    this.ngramMapping = this._nGramMapping(this.mapping);
    this.tagTime = 0.0;
    this.tokenTime = 0.0;
    this.collapseTime = 0.0;
};

Glossary.prototype._nGramMapping = function (mapping) {
    var newMap = {};
    for (var prop in mapping) {
        var item = mapping[prop];
        var unigram = {};
        var bigram = {};
        var trigram = {};
        var quadgram = {};
        for (var term in item) {
            var terms = term.split(this.spacing);
            if (terms.length == 2) {
                if (!bigram.hasOwnProperty(terms[0])) {
                    bigram[terms[0]] = {};
                }
                bigram[terms[0]][terms[1]] = 1;
            }
            else if (terms.length == 3) {
                if (!trigram.hasOwnProperty(terms[0])) {
                    trigram[terms[0]] = {};
                }
                if (!trigram[terms[0]].hasOwnProperty(terms[1])) {
                    trigram[terms[0]][terms[1]] = {};
                }
                trigram[terms[0]][terms[1]][terms[2]] = 1;
            }
            else if (terms.length == 4) {
                if (!quadgram.hasOwnProperty(terms[0])) {
                    quadgram[terms[0]] = {};
                }
                if (!quadgram[terms[0]].hasOwnProperty(terms[1])) {
                    quadgram[terms[0]][terms[1]] = {};
                }
                if (!quadgram[terms[0]][terms[1]].hasOwnProperty(terms[2])) {
                    quadgram[terms[0]][terms[1]][terms[2]] = {};
                }
                quadgram[terms[0]][terms[1]][terms[2]][terms[3]] = 1;
            }
            else {
                unigram[term] = 1;
            }
        }
        newMap[prop] = [unigram,bigram,trigram,quadgram];
    }

    return newMap;
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
            var splitItems = item[1].split(',');
            var map = {};
            for (var l = 0; l < splitItems.length; l++) {
                map[splitItems[l]] = 1;
            }
            mapping[item[0]] = map;
        }
    }
    return mapping;
};

Glossary.prototype.parse = function (text, ignoreChunking) {
    // reset root term
    if (this.root) {
        delete this.root;
    }
    
    var time = new Date().getTime();
    text = this.tokenizer.clean(text);
    var tokens = this.tokenizer.tokenize(text);
    var endTime = new Date().getTime();
    this.tokenTime += (endTime - time);
    this.terms = tokens.length;
    var results = this.tagger.tag(tokens);
    var newEndTime = new Date().getTime();
    this.tagTime += (newEndTime - endTime);
    var prevWord;
    for (var i = 0; i < results.length; i++) {
        if (!tokens[i]) {
            continue;
        }

        var w = new Word(tokens[i], results[i], i, this.mapping);
        if (prevWord) {
            prevWord.next = w;
        }
        prevWord = w;

        if (!this.root) {
            this.root = w;
        }
    }

    this.filter();
    this.collapse(false);
    if (!ignoreChunking)
        this.collapse(true);
    this.collapseTime += (new Date().getTime());
};

Glossary.prototype.filter = function () {
    var initial = true;
    var current = this.root;
    var keepCurrent = false;
    do {
        var skip = current.filter(this.mapping, this.ngramMapping);
        if (skip > 0) {
            for (var i = 0; i < skip; i++) {
                current = current.next;
            }
        }
    } while (current);
};

Glossary.prototype.collapse = function (chunk) {
    var initial = true;
    var current = this.root;
    var keepCurrent = false;
    while (keepCurrent || (current && current.next)) {
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
            keepCurrent = current.collapse(this.mapping, this.ngramMapping);
        else
            keepCurrent = current.chunk(this.mapping);
    }
};

Glossary.prototype.unfiltered = function () {
    var unfiltered = [];
    var current = this.root;

    do {
        if (!current.isFiltered && current.tag != '.') {
            unfiltered.push(current.distinct || current.term);
        }
        current = current.next;
    } while (current);

    return unfiltered;
}

Glossary.prototype.concepts = function () {
    var concepts = [];
    var current = this.root;

    do {
        if ((current.isNoun || current.isHashtag || current.isMention || current.isUrl) && !current.isTempOrTimeNoun && !current.isSubjectPron) {
            concepts.push(current.distinct || current.term);
        }
        else if (current.isDet && current.next && current.next.isVerb && current.next.next && current.next.next.isNoun) {
            concepts.push((current.next.distinct || current.next.term) + current.spacing + (current.next.next.distinct || current.next.next.term));
            current = current.next.next;
        }
        current = current.next;
    } while (current);

    return concepts;
};

Glossary.prototype.format = function () {
    var concepts = [];
    var current = this.root;

    do {
        concepts.push(current.format());
        current = current.next;
    } while (current);

    return concepts;
};

Glossary.prototype.toJSON = function () {
    var current = this.root;
    var words = [];

    do {
        words.push(current.toJSON());
        current = current.next;
    } while (current);

    return words;
};

Glossary.prototype.itemIndex = function (i) {
    var current = this.root;
    var index = 0;

    while (current && index < i) {
        current = current.next;
        index++;
    }

    if (!current)
        return undefined;
    else
        return current.toJSON();
};

Glossary.prototype.relations = function () {
    var results = [];
    var current = this.root;

    do {
        if ((current.isNoun || current.isHashtag || current.isMention || current.isUrl)) {
            var relations = [];
            // N-V-[N|A]
            if (current.next && current.next.isVerb && current.next.next && 
                    (current.next.next.isNoun || current.next.next.isAdjCard)) {
                if (!current.isSubjectPron)
                    relations.push(current.term); // N
                relations.push(current.next.term); // V
                relations.push(current.next.next.term); // N
                if (current.next.next.next && current.next.next.next.isAdp && current.next.next.next.next.isNoun) {
                    relations.push(current.next.next.next.term); // ADP
                    relations.push(current.next.next.next.next.term); // N
                    current = current.next.next.next.next;
                }
                else {
                    current = current.next.next;
                }
            }
            // N-V-ADP-[N|A]
            else if (current.next && current.next.isVerb && current.next.next && current.next.next.isAdp &&  current.next.next.next && 
                    (current.next.next.next.isNoun || current.next.next.next.isAdjCard)) {
                if (!current.isSubjectPron)
                    relations.push(current.term); // N
                relations.push(current.next.term); // V
                relations.push(current.next.next.term); // ADP
                relations.push(current.next.next.next.term); // N
                current = current.next.next.next;
            }
            // N-L-V-[N|A]
            else if (current.next && current.next.isLink && current.next.next && current.next.next.isVerb && current.next.next.next && 
                    (current.next.next.next.isNoun || current.next.next.next.isAdjCard)) {
                if (!current.isSubjectPron)
                    relations.push(current.term); // N
                if (current.next.isNeg) //[N]
                    relations.push(current.next.negation + current.next.spacing);
                relations.push(current.next.next.term); // V
                relations.push(current.next.next.next.term); // N

                if (current.next.next.next.next && current.next.next.next.next.isAdp && current.next.next.next.next.next && current.next.next.next.next.next.isNoun) {
                    relations.push(current.next.next.next.next.term); // ADP
                    relations.push(current.next.next.next.next.next.term); // N
                    current = current.next.next.next.next.next;
                }
                else {
                    current = current.next.next.next;
                }
            }
            // N-L-V-ADP-[N|A]
            else if (current.next && current.next.isLink && current.next.next && current.next.next.isVerb && current.next.next.next && 
                    current.next.next.next.isAdp && current.next.next.next.next && 
                    (current.next.next.next.next.isNoun || current.next.next.next.next.isAdjCard)) {
                if (!current.isSubjectPron)
                    relations.push(current.term);
                if (current.next.isNeg)
                    relations.push(current.next.negation + current.next.spacing);
                relations.push(current.next.next.term);
                relations.push(current.next.next.next.term);
                relations.push(current.next.next.next.next.term);
                current = current.next.next.next.next;
            }
            else if (current.next && current.next.isAdp && current.next.next && current.next.next.isNoun) {
                relations.push(current.term);
                relations.push(current.next.term);
                relations.push(current.next.next.term);
                current = current.next.next.next;
            }
            else if (current.next && current.next.isVerb && current.next.next && current.next.next.isDet && 
                    current.next.next.next && current.next.next.next.isVerb && current.next.next.next.next && 
                    current.next.next.next.next.isNoun) {
                relations.push(current.term);
                relations.push(current.next.term);
                relations.push(current.next.next.term);
                relations.push(current.next.next.next.term);
                relations.push(current.next.next.next.next.term);
                current = current.next.next.next.next;
            }

            if (relations.length > 0)
                results.push(relations.join(current.spacing));
        }
        current = current.next;
    } while (current);

    return results;
};

module.exports = Glossary;
