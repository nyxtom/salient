
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
    this.tagTime = 0.0;
    this.classifyTime = 0.0;
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
    var time = new Date().getTime();
    do {
        if (!current) {
            break;
        }

        // check bigrams (distinct or simple bigram)
        var bigramSkip = false;
        var distinctBigram = null;
        if (current.termMap && current.termMap.length > 1 && current.next) {
            var last = current.termMap[current.termMap.length - 1];
            var next = current.next.term;
            if (current.next.distinct) {
                next = current.next.distinct;
            }

            distinctBigram = last + current.spacing + next;
        }

        var embeddedBigrams = {};
        var foundEmbedded = false;
        if (current.termMap && current.termMap.length > 1) {
            for (var i = 0; i < current.termMap.length - 1; i++) {
                var embeddedBigram = current.termMap[i] + current.spacing + current.termMap[i+1];
                if (this.mapping.hasOwnProperty(embeddedBigram)) {
                    embeddedBigrams[embeddedBigram] = this.mapping[embeddedBigram];
                    foundEmbedded = true;
                }
            }
        }

        var bigram = current.bigram();
        if (this.mapping.hasOwnProperty(bigram)) {
            var score = this.mapping[bigram];
            current.score = score / 2.0;
            current.isScorable = true;
            current.next.score = score / 2.0;
            current.next.isScorable = true;
            totalScored += 2;
            total += score;
            current = current.next;
            bigramSkip = true;
        }
        // use the term map to iterate over bigrams beginning at the end of the term map
        else if (this.mapping.hasOwnProperty(distinctBigram)) {
            var score = this.mapping[distinctBigram];
            current.score = score / 2.0;
            current.isScorable = true;
            current.next.score = score / 2.0;
            current.next.isScorable = true;
            totalScored += 2;
            total += score;
            current = current.next;
            bigramSkip = true;
        }

        if (!current.isFiltered && !bigramSkip) {
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
                        if (child.isNeg && current.orig && current.orig.isNeg && current.isNeg) {
                            // negated negation (i.e. don't forget..etc)
                            delete current.isNeg;
                        }
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
                        if (i == 0 && current.orig && current.orig.isAmplifier && current.orig.score < 0) {
                            current.orig.score *= -1;
                            localScore += (current.orig.score); // correct for amplified context
                            total += (current.orig.score); // correct for amplified context
                            score *= current.orig.score / 2.0;
                        }
                        else if (i > 0 && current.children[i - 1].isAmplifier && current.children[i - 1].score < 0) {
                            current.children[i - 1].score *= -1;
                            localScore += (current.children[i - 1].score); // correct for amplified context
                            total += (current.children[i - 1].score); // correct for amplified context
                            score *= current.children[i - 1].score / 2.0;
                        }
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
                    current.score = (localScore / Math.max(localCount, 1.0));
                }
                else if (foundEmbedded) {
                    var totalScore = 0.0;
                    var totalFound = 0.0;
                    for (var e in embeddedBigrams) {
                        var score = embeddedBigrams[e];
                        totalFound++;
                        totalScore += score;
                    }
                    current.score = totalScore / totalFound;
                    current.isScorable = true;
                    totalScored++;
                    total += current.score;
                }
            }
        }
        current = current.next;
    } while (current);

    this.tagTime += (new Date().getTime() - time);
    return { terms: totalScored, score: total, value: (score / Math.max(totalScored, 1.0)) };
};

BayesSentimentAnalyser.prototype.classify = function (text) {
    this._tagScorable(text);
    var endTime = new Date().getTime();

    var semClauseCursor;
    var semCursor;
    var scoredTerms = 0.0;
    var current = this.glossary.root;
    var negation = false;
    while (current) {
        if (current.isVerb) {
            var orientation = 1.0;
            var score = 0.0;
            if (current.isNeg) {
                orientation = -1.0;
                if (semCursor && semCursor.isNeg) {
                    orientation = 1.0;
                }
            }
            else if (semCursor && semCursor.semOrientation) {
                orientation = semCursor.semOrientation;
            }

            if (current.isScorable) {
                score += current.score * orientation;
                scoredTerms++;
            }

            current.semScore = score;
            current.semOrientation = orientation;

            if (semClauseCursor && current.semScore != 0.0 && semClauseCursor.semScore) {
                var amplifier = Math.abs(semClauseCursor.semScore);
                var clauseOrientation = semClauseCursor.semOrientation ? semClauseCursor.semOrientation : 1.0;
                current.semScore *= (amplifier * clauseOrientation);
                semClauseCursor = null;
            }

            semCursor = current;
            if (current.next && (current.next.isClause || current.next.isQTerm)) {
                semClauseCursor = current;
            }
            
            if (current.next && current.next.isTo) {
                current = current.next.next;
            }
            else {
                current = current.next;
            }
            continue;
        }
        else if (current.isScorable) {
            // maintain context only in cases where the verb phrase of a semantic cursor is eliticing emotional context
            var maintainContext = false;
            if (semCursor && semCursor.isVerb && semCursor.children && semCursor.children.length > 0 && 
                semCursor.children[semCursor.children.length - 1].isScorable) {
                    maintainContext = true;
            }

            if (!maintainContext && current.isNoun && current.isScorable && current.beginsDet && semCursor && !semClauseCursor) {
                if (current.isNeg)
                    current.semOrientation = -1;
                else
                    current.semOrientation = 1;

                current.semScore = current.score * current.semOrientation;
                scoredTerms++;
                current = current.next;
                continue;
            }

            if (semCursor && semCursor.semOrientation) {
                current.semOrientation = semCursor.semOrientation;
            }
            else {
                current.semOrientation = 1;
            }

            if (current.isNeg) {
                current.semOrientation = -1;
                if (semCursor && semCursor.isNeg) {
                    current.semOrientation = 1.0;
                }
            }

            current.semScore = current.score * current.semOrientation;
            // correct when the current semantic cursor has a positive orientation and should adjust the negative orientation of this term
            if (current.score < 0 && current.semOrientation == 1 && semCursor && semCursor.score > 0 && semCursor.semOrientation == 1) {
                current.origSemScore = current.semScore;
                current.semScore *= -1;
            }
            scoredTerms++;

            if (semClauseCursor) {
                var amplifier = Math.abs(semClauseCursor.semScore);
                var clauseOrientation = semClauseCursor.semOrientation ? semClauseCursor.semOrientation : 1.0;
                if (amplifier) {
                    current.semScore *= amplifier * clauseOrientation;
                }
                else if (clauseOrientation) {
                    current.semScore *= clauseOrientation;
                }
                semClauseCursor = null;
            }

            if (current.next && (current.next.isClause || current.next.isQTerm)) {
                semClauseCursor = current;
            }
            else if (current.next && current.next.isConjOr) {
                semCursor = current;
                current = current.next;
                continue;
            }
            else if (current.next && current.next.isTo) {
                semCursor = current;
                current = current.next;
                continue;
            }
        }
        else if (current.isNeg) {
            current.semOrientation = -1;
            if (semCursor && semCursor.isNeg) {
                current.semOrientation = 1;
            }
            semCursor = current;
            current = current.next;
            continue;
        }
        else if (current.isConjOr && semCursor) {
            current.semOrientation = semCursor.semOrientation;
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
        else if (current.isNoun && semCursor && semCursor.semOrientation && current.next && current.next.isScorable) {
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
        var finalOrientation = 1;
        while (current) {
            if (current.isAmplifier && current.semScore && current.next && current.next.semScore) {
                totalScore += (Math.abs(current.semScore) * current.next.semScore) / 2.0;
            }
            else if (current.semScore) {
                totalScore += current.semScore;
                if (current.isHashtag && current.origSemScore) {
                    current.semScore = current.origSemScore;
                    delete current.origSemScore;
                }
                if (totalScore >= 0 && current.semScore < 0 && current.isHashtag) {
                    finalOrientation = -1;
                }
                else if (totalScore <= 0 && current.semScore > 0 && current.isHashtag) {
                    finalOrientation = 0;
                }
            }
            else if (current.isHashtag && current.semOrientation == -1) {
                finalOrientation = -1;
            }
            current = current.next;
        }
        if ((finalOrientation == -1 && totalScore >= 0) || (finalOrientation == 0 && totalScore < 0)) {
            // typically tweets include hashtags that often signify ironic twists
            // or summarize the overall sentiment of an entire text, use this 
            // as a key for further classification
            totalScore *= -1;
            if (totalScore == 0) {
                totalScore = -1;
            }

            this.glossary.isNegatedOrientation = true;
        }
        polarity = totalScore / scoredTerms;
    }

    this.classifyTime += ((new Date().getTime() - endTime));

    return polarity;
};

module.exports = BayesSentimentAnalyser;
