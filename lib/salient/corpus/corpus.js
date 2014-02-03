
var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    walk = require('walk');

var Mapping = require('./mapping');

function Corpus(file, mapName, options) {
    this.options = options || {};

    if (file.indexOf('~') == 0) {
        file = path.join(process.env['HOME'], file.substring(1));
    }

    this.fileName = file;
    this.mapName = mapName;
    this.mapping = Mapping.load(path.join(__dirname, '/universal_tagset/' + mapName + '.map'));
    this.output = this.options.output || path.join(__dirname, mapName + '.tag.vocab')
    this.outputDist = this.options.output || path.join(__dirname, mapName + '.tag.dist')
    this.outputSentences = this.options.outputSentences || path.join(__dirname, mapName + '.sentences');
    this.perLine = this.options.hasOwnProperty('perLine') ? this.options.perLine : false;
};

Corpus.prototype.parse = function () {
    var self = this;
    var walker = walk.walk(this.fileName, { followLinks: false });
    var files = [];
    walker.on('file', function (root, stat, next) {
        files.push(root + "/" + stat.name);
        next();
    });
    walker.on('end', function () {
        self.files = files;
        self.loadFiles(self.files);
    });
};

Corpus.prototype.suffix = function (token, length, minLength) {
    if (token.indexOf('\'') >= 0) {
        return token.substring(token.indexOf('\''));
    }
    else if (token.indexOf('`') >= 0) {
        return token.substring(token.indexOf('`'));
    }

    return token;
};

Corpus.prototype.loadFiles = function (files) {
    var self = this;
    var sentences = [];
    var tags = {};
    var vocab = {};
    var startTime = new Date().getTime();
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var lines = fs.readFileSync(file).toString().split('\n');
        var state = null; 
        for (var l = 0; l < lines.length; l++) {
            var line = lines[l];
            var isEmpty = !line || line.trim().length == 0;
            if (isEmpty && state && state.hasOwnProperty("tokens")) {
                state.empty = true;
            }
            if (line && line.trim().length > 0) {
                if (!state || state.empty || self.perLine) {
                    if (state && state.empty) {
                        self.updateState(state, null, "STOP");
                        self.storeState(tags, sentences, state);
                    }
                    state = {};
                    state.tokens = [];
                    state.tags = {};
                    state.prevTag = "*";
                    state.prevTag2 = "*";
                }

                line = line.trim();
                var tokenTagPairs = self.parseLine(line);
                for (var p = 0; p < tokenTagPairs.length; p++) {
                    var tokenTagPair = tokenTagPairs[p];
                    var word = tokenTagPair[0];
                    var suffix = self.suffix(word);
                    var tag = tokenTagPair[1];
                    
                    // Add the vocabulary word and tag increments
                    // for both the word and the suffix (should they be different)
                    self.addVocabularyTag(vocab, word, tag);
                    if (word != suffix)
                        self.addVocabularyTag(vocab, suffix, tag);

                    self.updateState(state, word, tag);
                }
            }
        }
    }

    for (var t in tags) {
        var idf = Math.log(sentences.length / (1 + tags[t].df));
        var tf = tags[t].f;
        tags[t].idf = idf;
        tags[t].tfidf = Math.round(tf * idf);
        tags[t].dist = Math.round(100 * tags[t].df / sentences.length);
    }

    var sortedTags = this.dist(tags);
    for (var i = 0; i < sortedTags.length; i++) {
        var t = sortedTags[i];
        var line = util.format('%s\t%s\t%s%\n', t.t, t.f, t.dist);
        fs.appendFileSync(this.outputDist, line);
    }

    var sortedVocab = [];
    for (var v in vocab) {
        var tags = [];
        for (var t in vocab[v].t) {
            tags.push(t + "/" + vocab[v].t[t]);
        }
        var item = vocab[v];
        item.v = v;
        item.tags = tags;
        sortedVocab.push(item);
    }
    sortedVocab = sortedVocab.sort(function (a, b) { return b.f - a.f });
    for (var i = 0; i < sortedVocab.length; i++) {
        var item = sortedVocab[i];
        var line = util.format('%s\t%s\t%s\n', item.v, item.f, item.tags.join(','));
        fs.appendFileSync(this.output, line);
    }

    for (var i = 0; i < sentences.length; i++) {
        var item = sentences[i];
        fs.appendFileSync(this.outputSentences, item + '\n');
    }

    var endTime = new Date().getTime();
    console.log(util.format('Wrote %s distributions from %s sentences to %s (in %sms)', sortedTags.length, sentences.length, 
                this.output, (endTime - startTime)));
};

Corpus.prototype.dist = function (tags) {
    var d = [];
    for (var t in tags) {
        var item = tags[t];
        item.t = t;
        d.push(item);
    }

    return d.sort(function (a, b) {
        return b.f - a.f;
    });
};

Corpus.prototype.storeState = function (tags, sentences, state) {
    for (var t in state.tags) {
        if (!tags.hasOwnProperty(t)) {
            tags[t] = { f: 0, df: 0 };
        }

        tags[t].f += state.tags[t];
        tags[t].df++;
    }

    sentences.push(state.tokens.join(' '));
};

Corpus.prototype.addStateTag = function (state, tag) {
    if (!state.tags.hasOwnProperty(tag)) {
        state.tags[tag] = 1;
    }
    state.tags[tag]++;
};

Corpus.prototype.updateState = function (state, word, tag) {
    if (word) {
        state.tokens.push(word + "/" + tag);
    }
    this.addStateTag(state, tag);
    if (state.prevTag) {
        var bitag = state.prevTag + "+" + tag;
        this.addStateTag(state, bitag);
    }
    if (state.prevTag2 && state.prevTag) {
        var tritag = state.prevTag2 + "+" + state.prevTag + "+" + tag;
        this.addStateTag(state, tritag);
    }

    state.prevTag2 = state.prevTag;
    state.prevTag = tag;
};

Corpus.prototype.addVocabularyTag = function (vocab, word, tag) {
    if (!vocab.hasOwnProperty(word)) {
        vocab[word] = { f: 0, t: {} };
    }
    vocab[word].f++;

    if (!vocab[word].t.hasOwnProperty(tag)) {
        vocab[word].t[tag] = 1;
    }
    vocab[word].t[tag]++;
}

Corpus.prototype.parseLine = function (line) {
    // [ token/POS token/POS ]
    // token/POS
    // token/POS token/POS
    if (line.indexOf('[') == 0 && line.indexOf(']') == line.length) {
        line = line.substring(1, line.length - 1).trim();
    }

    var tokenPairs = line.split(' ');
    var tokenTagPairs = [];
    for (var i = 0; i < tokenPairs.length; i++) {
        var tokenPair = tokenPairs[i].split('/');
        if (tokenPair.length == 2) {
            var token = tokenPair[0].toLowerCase();
            var tag = tokenPair[1].toUpperCase();
            if (this.mapping.hasOwnProperty(tag)) {
                tag = this.mapping[tag];
            }

            tokenTagPairs.push([token, tag]);
        }
    }

    return tokenTagPairs;
};

module.exports = Corpus;
