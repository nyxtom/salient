
var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    walk = require('walk');

var Mapping = require('./mapping');

function BrownCorpus(file, options) {
    this.options = options || {};
    
    if (file.indexOf('~') == 0) {
        file = path.join(process.env['HOME'], file.substring(1));
    }

    this.fileName = file;
    this.output = this.options.output || path.join(__dirname, 'en-brown.tag.vocab')
    this.outputDist = this.options.output || path.join(__dirname, 'en-brown.tag.dist')
    this.outputSentences = this.options.outputSentences || path.join(__dirname, 'en-brown.sentences');
    this.skipLines = this.options.skipLines || 0;
    this.limitLines = this.options.limitLines || 0;
    this.mapping = Mapping.load(path.join(__dirname, '/universal_tagset/en-brown.map'));
};

BrownCorpus.prototype.parse = function () {
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

BrownCorpus.prototype.suffix = function (token, length, minLength) {
    if (token.indexOf('\'') >= 0) {
        return token.substring(token.indexOf('\''));
    }
    else if (token.indexOf('`') >= 0) {
        return token.substring(token.indexOf('`'));
    }

    return token;
};

BrownCorpus.prototype.loadFiles = function (files) {
    var mapping = this.mapping;
    var sentences = [];
    var tags = {};
    var vocab = {};
    var startTime = new Date().getTime();
    var skipLines = 0;
    var limitLines = 0;
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var lines = fs.readFileSync(file).toString().split('\n');
        for (var l = 0; l < lines.length; l++) {
            var line = lines[l];
            if (line && line.trim().length > 0) {
                // Ensure that we can artificially skip a number of lines
                if (this.skipLines > 0 && skipLines < this.skipLines) {
                    skipLines++;
                    continue;
                }

                // Ensure that we can artificially limit the number of 
                // lines we wish to process
                if (this.limitLines > 0) {
                    if (limitLines < this.limitLines) {
                        limitLines++;
                    }
                    else {
                        break;
                    }
                }

                line = line.trim();
                var newLine = [];
                var items = line.split(' ');
                var lineTags = {};

                // iterate over the token/tags 
                var prevTag = "*";
                var prevTag2 = "*";
                for (var k = 0; k < items.length; k++) {
                    var item = items[k];
                    var token = item.split('/');
                    if (token && token.length == 2) {
                        var word = token[0].toLowerCase();
                        var suffix = this.suffix(word);
                        if (typeof vocab[word] == 'undefined') {
                            vocab[word] = { f: 0, t: {} };
                        }
                        vocab[word].f++;

                        // Update the suffix into the vocabulary if appropriate
                        if (word != suffix) {
                            if (typeof vocab[suffix] == 'undefined') {
                                vocab[suffix] = { f: 0, t: {} };
                            }
                            vocab[suffix].f++;
                        }


                        var tag = token[1].toUpperCase();
                        if (typeof mapping[tag] != 'undefined') {
                            tag = mapping[tag];

                            // Append the tag to the list of possible tags found on the given word
                            if (typeof vocab[word].t[tag] == 'undefined') {
                                vocab[word].t[tag] = 1;
                            }
                            vocab[word].t[tag]++;

                            // update the tag associated with the suffix
                            if (word != suffix) {
                                if (typeof vocab[suffix].t[tag] == 'undefined') {
                                    vocab[suffix].t[tag] = 1;
                                }
                                vocab[suffix].t[tag]++;
                            }

                            if (typeof lineTags[tag] == 'undefined') {
                                lineTags[tag] = 1;
                            }

                            if (prevTag) {
                                var bitag = prevTag + "+" + tag;
                                if (typeof lineTags[bitag] == 'undefined') {
                                    lineTags[bitag] = 1;
                                }
                                lineTags[bitag]++;

                                if (prevTag2) {
                                    var tritag = prevTag2 + "+" + prevTag + "+" + tag;
                                    if (typeof lineTags[tritag] == 'undefined') {
                                        lineTags[tritag] = 1; 
                                    }
                                    lineTags[tritag]++;
                                }

                                prevTag2 = prevTag;
                            }
                            lineTags[tag]++;
                            prevTag = tag;
                        }
                        newLine.push(token[0] + "/" + tag);
                    }
                }

                var bitag = prevTag + "+STOP";
                var tritag = prevTag2 + "+" + prevTag + "+STOP";
                if (!lineTags.hasOwnProperty("STOP"))
                    lineTags["STOP"] = 1;

                if (!lineTags.hasOwnProperty(bitag))
                    lineTags[bitag] = 1;

                if (!lineTags.hasOwnProperty(tritag))
                    lineTags[tritag] = 1;
                
                lineTags["STOP"]++;
                lineTags[bitag]++;
                lineTags[tritag]++;

                // iterate over the found tags for the given example
                // and update the aggregate tags for the document frequency
                for (var t in lineTags) {
                    if (typeof tags[t] == 'undefined') {
                        tags[t] = { f: 0, df: 0 };
                    }

                    tags[t].f += lineTags[t];
                    tags[t].df++;
                }

                sentences.push(newLine.join(' '));
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

BrownCorpus.prototype.dist = function (tags) {
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

module.exports = BrownCorpus;
