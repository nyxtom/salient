
var util = require('util'),
    path = require('path'),
    fs = require('fs');

var Glossary = require('./../glossary/glossary');

function BayesSentimentAnalyser(options) {
    this.options = options || {};
    this.lang = this.options.lang || "en";
    this.glossary = new Glossary(this.options);
    this.spacing = this.options.spacing || " ";
    this.mapping = this._loadMapping(this.options.sentimentMap || path.join(__dirname, '../../../bin/glossdata/' + this.lang + '.sentiment.map'));
    this.ngramMapping = this._nGramMap(this.mapping);
};

BayesSentimentAnalyser.prototype._nGramMap = function (mapping) {
    var unigramMapping = {};
    var bigramMapping = {};
    var trigramMapping = {};
    for (var term in mapping) {
        var terms = term.split(this.spacing);
        if (terms.length == 2) {
            if (!bigramMapping.hasOwnProperty(terms[0])) {
                bigramMapping[terms[0]] = {};
            }
            bigramMapping[terms[0]][terms[1]] = mapping[term];
        }
        else if (terms.length == 3) {
            if (!trigramMapping.hasOwnProperty(terms[0])) {
                trigramMapping[terms[0]] = {};
            }
            if (!trigramMapping[terms[0]].hasOwnProperty(terms[1])) {
                trigramMapping[terms[0]][terms[1]] = {};
            }
            trigramMapping[terms[0]][terms[1]][terms[2]] = mapping[term];
        }
        else {
            unigramMapping[terms] = mapping[term];
        }
    }

    return [unigramMapping, bigramMapping, trigramMapping];
};

BayesSentimentAnalyser.prototype._loadMapping = function (mapFile) {
    var mapping = {};
    var lines = fs.readFileSync(mapFile).toString().split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!line || line.trim().length == 0)
            continue;

        var items = line.trim().toLowerCase().split('\t');
        if (items.length == 2) {
            var score = parseInt(items[0]);
            var terms = items[1].split(',');
            for (var t = 0; t < terms.length; t++) {
                var term = terms[t];
                mapping[term] = score;
                if (this.glossary.lem) {
                    var lemItems = this.glossary.lem.lemmatize(term);
                    if (lemItems.length > 0) {
                        var lemTerm = lemItems[0].text.toLowerCase();
                        if (lemTerm != term) {
                            mapping[lemTerm] = score;
                        }
                    }
                }
            }
        }
    }

    return mapping;
};

BayesSentimentAnalyser.prototype._tagScorable = function (text) {
    this.glossary.parse(text);

    var current = this.glossary.root;
    var totalScored = 0.0;
    var total = 0.0;
    do {
        if (!current) {
            break;
        }

        if (!current.isFiltered) {
            if (this.mapping.hasOwnProperty(current.term)) {
                var score = this.mapping[current.term];
                current.score = score;
                current.isScorable = true;
                totalScored++;
                total += score;
            }
            else if (current.lemma && this.mapping.hasOwnProperty(current.lemma)) {
                var score = this.mapping[current.lemma];
                current.score = score;
                current.isScorable = true;
                totalScored++;
                total += score;
            }
            else if (current.distinct && this.mapping.hasOwnProperty(current.distinct)) {
                var score = this.mapping[current.distinct];
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
                    if (this.mapping.hasOwnProperty(current.orig.term)) {
                        score = this.mapping[current.orig.term];
                    }
                    else if (current.orig.lemma && this.mapping.hasOwnProperty(current.orig.lemma)) {
                        score = this.mapping[current.orig.lemma];
                    }
                    else if (current.orig.distinct && this.mapping.hasOwnProperty(current.orig.distinct)) {
                        score = this.mapping[current.orig.distinct];
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
                    if (this.mapping.hasOwnProperty(child.term)) {
                        score = this.mapping[child.term];
                    }
                    else if (child.lemma && this.mapping.hasOwnProperty(child.lemma)) {
                        score = this.mapping[child.lemma];
                    }
                    else if (child.distinct && this.mapping.hasOwnProperty(child.distinct)) {
                        score = this.mapping[child.distinct];
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

    return { terms: totalScored, score: total, value: (score / Math.max(totalScored, 1.0)) };
};

BayesSentimentAnalyser.prototype.classify = function (text) {
    this._tagScorable(text);

    var semClauseCursor;
    var semCursor;
    var scoredTerms = 0.0;
    var current = this.glossary.root;
    while (current) {
        if (current.isVerb) {
            var orientation = 1.0;
            var score = 0.0;
            if (current.isNeg) {
                orientation = -1.0;
            }

            if (current.isScorable) {
                score += current.score * orientation;
                scoredTerms++;
            }

            current.semScore = score;
            current.semOrientation = orientation;

            if (semClauseCursor && current.semScore != 0.0) {
                var amplifier = Math.abs(semClauseCursor.semScore);
                var clauseOrientation = semClauseCursor.semOrientation ? semClauseCursor.semOrientation : 1.0;
                current.semScore *= (amplifier * clauseOrientation);
                semClauseCursor = null;
            }

            semCursor = current;
            if (current.next && (current.next.isClause || current.next.isQTerm)) {
                semClauseCursor = current;
            }
            
            current = current.next;
            continue;
        }
        else if (current.isScorable) {
            if (semCursor && semCursor.semOrientation) {
                current.semOrientation = semCursor.semOrientation;
            }
            else {
                current.semOrientation = 1;
            }

            if (current.isNeg) {
                current.semOrientation = -1;
            }

            current.semScore = current.score * current.semOrientation;
            scoredTerms++;

            if (semClauseCursor) {
                var amplifier = Math.abs(semClauseCursor.semScore);
                var clauseOrientation = semClauseCursor.semOrientation ? semClauseCursor.semOrientation : 1.0;
                current.semScore *= amplifier * clauseOrientation;
                semClauseCursor = null;
            }

            if (current.next && (current.next.isClause || current.next.isQTerm)) {
                semClauseCursor = current;
            }
            else if (current.next && current.next.isTo) {
                semCursor = current;
                current = current.next;
                continue;
            }
        }
        else if (current.isNeg) {
            current.semOrientation = -1;
            semCursor = current;
            current = current.next;
            continue;
        }
        else if (current.isConjOr && semCursor) {
            semCursor = current;
            current = current.next;
            continue;
        }
        else if ((current.isAdp || current.isConj) && semCursor) {
            current.semOrientation = semCursor.semOrientation;
            semCursor = current;
            current = current.next;
            continue;
        }
        else if (current.next && current.next.isConj && semCursor) {
            current = current.next;
            continue;
        }
        else if (current.isTo && semCursor) {
            current = current.next;
            continue;
        }

        semCursor = null;
        current = current.next;
    }

    var polarity = 0.0;
    if (scoredTerms > 0) {
        var current = this.glossary.root;
        var totalScore = 0.0;
        while (current) {
            if (current.semScore) {
                totalScore += current.semScore;
            }
            current = current.next;
        }
        polarity = totalScore / scoredTerms;
    }

    return polarity;
};

module.exports = BayesSentimentAnalyser;
