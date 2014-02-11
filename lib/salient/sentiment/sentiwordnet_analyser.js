
var util = require('util'),
    path = require('path'),
    fs = require('fs');

var Glossary = require('./../glossary/glossary');
var BayesSentimentAnalyser = require('./bayesanalyser');

function SentiwordnetAnalyser(options) {
    this.options = options || {};
    this.lang = this.options.lang || "en";
    this.glossary = new Glossary(this.options);
    this.spacing = this.options.spacing || " ";
    this.posMap = { 'a': 'ADJ', 'n': 'NOUN', 'r': 'ADV', 'v': 'VERB' };
    this.mapping = this._loadMapping(this.options.sentimentMap || path.join(__dirname, '../../../bin/glossdata/' + this.lang + '.sentwordnet.map'));
    this.ngramMapping = this._nGramMap(this.mapping);
    this.tagTime = 0.0;
    this.classifyTime = 0.0;
};

util.inherits(SentiwordnetAnalyser, BayesSentimentAnalyser);

SentiwordnetAnalyser.prototype._loadMapping = function (mapFile) {
    var mapping = {}; // term: { pos: avgposscore-avgnegscore }
    var lines = fs.readFileSync(mapFile).toString().split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!line || line.indexOf('#') == 0 || line.trim().length == 0) {
            continue;
        }

        // # POS   ID      PosScore        NegScore        SynsetTerms     Gloss
        var items = line.trim().split('\t');
        var pos = items[0];
        pos = this.posMap[pos];
        var posScore = parseFloat(items[2]);
        var negScore = parseFloat(items[3]);
        var synsetTerms = items[4];

        if (!synsetTerms) {
            console.log(line);
            continue;
        }
        var terms = synsetTerms.split(' ');
        for (var t = 0; t < terms.length; t++) {
            var term = terms[t].split('#')[0];
            // multi_word_phrase
            term = term.split('_').join(this.glossary.spacing);
            if (!mapping.hasOwnProperty(term)) {
                mapping[term] = {};
            }
            if (!mapping[term].hasOwnProperty(pos)) {
                mapping[term][pos] = { 'pos': [], 'neg': [] };
            }
            mapping[term][pos].pos.push(posScore);
            mapping[term][pos].neg.push(negScore);
        }
    }

    // Iterate over all terms to calculate the average score
    for (var term in mapping) {
        for (var pos in mapping[term]) {
            var item = mapping[term][pos];
            var avgPositive = 0.0;
            var avgNegative = 0.0;
            if (item.pos && item.pos.length > 0) {
                avgPositive = item.pos.reduce(function (a, b) { return a + b; }) / item.pos.length;
            }
            if (item.neg && item.neg.length > 0) {
                avgNegative = item.neg.reduce(function (a, b) { return a + b; }) / item.neg.length;
            }

            var result = avgPositive - avgNegative;
            mapping[term][pos] = result;
        }
    }

    return mapping;
};

SentiwordnetAnalyser.prototype._tagScorable = function (text) {
    this.glossary.parse(text);

    var current = this.glossary.root;
    var totalScored = 0.0;
    var total = 0.0;
    var time = new Date().getTime();
    do {
        if (!current) {
            break;
        }

        // check bigrams (distinct or simple bigram)
        var bigramSkip = false;
        var distinctBigram = null;
        if (current.termMap && current.termMap.length > 1 && current.next && current.next.term) {
            var last = current.termMap[current.termMap.length - 1];
            var next = current.next.term;
            if (current.next.distinct) {
                next = current.next.distinct;
            }

            distinctBigram = last + current.spacing + next;
        }

        var bigram = current.bigram();
        if (bigram && this.mapping.hasOwnProperty(bigram)) {
            var speechScore = this.mapping[bigram];
            var score;
            if (speechScore.hasOwnProperty(current.tag)) {
                score = speechScore[current.tag];
            }
            else if (speechScore.hasOwnProperty(current.next.tag)) {
                score = speechScore[current.tag];
            }
            if (score) {
                current.score = score / 2.0;
                current.isScorable = true;
                current.next.score = score / 2.0;
                current.next.isScorable = true;
                totalScored += 2;
                total += score;
                current = current.next;
                bigramSkip = true;
            }
        }
        // use the term map to iterate over bigrams beginning at the end of the term map
        else if (distinctBigram && this.mapping.hasOwnProperty(distinctBigram)) {
            var speechScore = this.mapping[distinctBigram];
            var score;
            if (!current.next) {
                console.log(distinctBigram);
            }
            if (speechScore.hasOwnProperty(current.tag)) {
                score = speechScore[current.tag];
            }
            else if (speechScore.hasOwnProperty(current.next.tag)) {
                score = speechScore[current.next.tag];
            }
            if (score) {
                current.score = score / 2.0;
                current.isScorable = true;
                current.next.score = score / 2.0;
                current.next.isScorable = true;
                totalScored += 2;
                total += score;
                current = current.next;
                bigramSkip = true;
            }
        }

        if (!current.isFiltered && !bigramSkip) {
            if (this.mapping.hasOwnProperty(current.term) && this.mapping[current.term].hasOwnProperty(current.tag)) {
                var score = this.mapping[current.term][current.tag];
                current.score = score;
                current.isScorable = true;
                totalScored++;
                total += score;
            }
            else if (current.lemma && this.mapping.hasOwnProperty(current.lemma) && this.mapping[current.lemma].hasOwnProperty(current.tag)) {
                var score = this.mapping[current.lemma][current.tag];
                current.score = score;
                current.isScorable = true;
                totalScored++;
                total += score;
            }
            else if (current.distinct && this.mapping.hasOwnProperty(current.distinct) && this.mapping[current.distinct].hasOwnProperty(current.tag)) {
                var score = this.mapping[current.distinct][current.tag];
                current.score = score;
                current.isScorable = true;
                totalScored++;
                total += score;
            }
            else if (current.children && current.children.length > 0) {
                var localCount = 0.0;
                var localScore = 0.0;
                var count = 0.0;

                // check the original term (count towards score is it is not a negation term)
                if (current.orig && !current.orig.isFiltered && !current.orig.isNeg) {
                    count++;
                    var score = null;
                    if (this.mapping.hasOwnProperty(current.orig.term) && this.mapping[current.orig.term].hasOwnProperty(current.orig.tag)) {
                        score = this.mapping[current.orig.term][current.orig.tag];
                    }
                    else if (current.orig.lemma && this.mapping.hasOwnProperty(current.orig.lemma) && this.mapping[current.orig.lemma].hasOwnProperty(current.orig.tag)) {
                        score = this.mapping[current.orig.lemma][current.orig.tag];
                    }
                    else if (current.orig.distinct && this.mapping.hasOwnProperty(current.orig.distinct) && this.mapping[current.orig.distinct].hasOwnProperty(current.orig.tag)) {
                        score = this.mapping[current.orig.distinct][current.orig.tag];
                    }

                    if (score) {
                        current.orig.score = score;
                        current.orig.isScorable = true;
                        current.isScorable = true;
                        localScore += score;
                        localCount++;
                        totalScored++;
                        total += score;
                    }
                }

                // iterate over the child elements
                for (var i = 0; i < current.children.length; i++) {
                    count++;
                    var child = current.children[i];
                    if (child.isFiltered || child.isNeg) {
                        continue;
                    }

                    var score = null;
                    if (this.mapping.hasOwnProperty(child.term) && this.mapping[child.term].hasOwnProperty(child.tag)) {
                        score = this.mapping[child.term][child.tag];
                    }
                    else if (child.lemma && this.mapping.hasOwnProperty(child.lemma) && this.mapping[child.lemma].hasOwnProperty(child.tag)) {
                        score = this.mapping[child.lemma][child.tag];
                    }
                    else if (child.distinct && this.mapping.hasOwnProperty(child.distinct) && this.mapping[child.distinct].hasOwnProperty(child.tag)) {
                        score = this.mapping[child.distinct][child.tag];
                    }

                    if (score) {
                        child.score = score;
                        child.isScorable = true;
                        current.isScorable = true;
                        localScore += score;
                        localCount++;
                        totalScored++;
                        total += score;
                    }
                }

                // set the current score to the relative distribution
                if (localCount > 0) {
                    current.isScorable = true;
                    current.score = (localScore / Math.max(count, 1.0));
                }
            }
        }
        current = current.next;
    } while (current);

    this.tagTime += (new Date().getTime() - time);
    return { terms: totalScored, score: total, value: (score / Math.max(totalScored, 1.0)) };
};

module.exports = SentiwordnetAnalyser;
