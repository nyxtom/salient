
var util = require('util');

function Word(term, tag, i, mapping, lemma) {
    this.term = term;
    if (this.term.toLowerCase() != this.term) {
        this.distinct = this.term.toLowerCase();
    }
    if (this.term.match(/^#\w+/)) {
        this.isHashtag = true;
        this.term = this.term.substring(1);
        if (this.distinct) {
            this.distinct = this.distinct.substring(1);
        }
    }
    this.tag = tag;
    this.position = i;
    this.children = [];
    this.spacing = " ";
    this.negation = "not";
    this.lemma = lemma;
    this._updateState(mapping);
}

Word.prototype.copy = function (mapping) {
    var result = new Word(this.term, this.tag, this.position, mapping, this.lemma);
    for (var item in this) {
        if (item == 'spacing' || item == 'negation' || item == 'next' || item == 'children' || item == 'orig' || typeof(item) == 'function')
            continue;

        result[item] = this[item];
    }
    return result;
};

Word.prototype.toJSON = function () {
    var result = {};
    for (var item in this) {
        if (item == 'spacing' || item == 'negation' || item == 'next')
            continue;

        if (this[item] && typeof(this[item]) != 'function') {
            if (item == 'children') {
                if (this[item].length > 0) {
                    result[item] = [];
                    for (var i = 0; i < this[item].length; i++) {
                        result[item][i] = this[item][i].toJSON();
                    }
                }
            }
            else if (item == 'orig') {
                result[item] = this[item].toJSON();
            }
            else {
                result[item] = this[item];
            }
        }
    }
    return result;
};

Word.prototype.format = function () {
    return this.term + ' ' + this.tag + (this.isLink ? ' LINK': '') 
            + (this.isCop ? ' COP' : '')
            + (this.isUrl ? ' URL' : '') 
            + (this.isMention ? ' MENTION' : '') 
            + (this.isHashtag ? ' HASHTAG' : '')
            + (this.isNeg ? ' NEG' : '') 
            + (this.isTempOrTimeNoun ? ' TIMENOUN' : '');
};

Word.prototype.filter = function (mapping, ngramMapping) {
    // collapse contraction
    if (this.next && this.next.isContract) {
        this.mergeLeft(mapping);
        return 0;
    }

    // correct adp-non-scorable context
    if (this.isSubjectPron && this.next && this.next.isAdpNonScorable) {
        this.next.tag = "VERB";
        this.next.isAdp = false;
        this.next.isAdpNonScorable = false;
    }

    // check filtered items and assign them
    var filters = this.checkFiltered(ngramMapping);
    if (filters > -1) {
        this.isFiltered = true;
        var current = this;
        for (var i = 0; i < filters; i++) {
            if (current.next) {
                current = current.next;
            }
            current.isFiltered = true;
        }
        return filters + 1;
    }
    else if (this.isAdpNonScorable) {
        this.isFiltered = true;
    }

    return 1;
};

Word.prototype.collapse = function (mapping, ngramMapping) {
    // check linkings to collapse
    var times = this.checkMap(ngramMapping, 'link');
    if (times > 0) {
        for (var i = 0; i < times; i++) {
            this.mergeLeft(mapping);
        }
        return true;
    }
    times = this.checkMap(ngramMapping, 'cop');
    if (times > 0) {
        for (var i = 0; i < times; i++) {
            this.mergeLeft(mapping);
        }
        return true;
    }

    // Join all determiner cases where possible
    if (this.isDet && this.next) {
        var next = this.next;
        if (next.isDet || next.isAdj || next.isAdv || next.isNoun || next.isVerb) {
            this.mergeRight(mapping);
            return true;
        }
        else if (next.isVerb && !next.isLink && next.next && (next.next.isAdj || next.next.isNoun)) {
            this.mergeRight(mapping);
            this.mergeRight(mapping);
            return true;
        }
    }
};

Word.prototype.checkFiltered = function (mapping) {
    var times = this.checkMap(mapping, 'stop');
    if (times < 0) {
        times = this.checkMap(mapping, 'names');
    }
    return times;
};

Word.prototype.checkMap = function (mapping, prop) {
    // check quadgram for the term
    var term = this.distinct || this.term;
    if (this.next && this.next.next && this.next.next.next && mapping[prop][3].hasOwnProperty(term)) {
        var nextTerm = this.next.distinct || this.next.term;
        if (mapping[prop][3][term].hasOwnProperty(nextTerm)) {
            var nextNextTerm = this.next.next.distinct || this.next.next.term;
            if (mapping[prop][3][term][nextTerm].hasOwnProperty(nextNextTerm)) {
                var nextNextNextTerm = this.next.next.next.distinct || this.next.next.next.term;
                if (mapping[prop][3][term][nextTerm][nextNextTerm].hasOwnProperty(nextNextNextTerm)) {
                    // successful stop-term found in quadrigram
                    return 3;
                }
            }
        }
    }
    // check trigram
    if (this.next && this.next.next && mapping[prop][2].hasOwnProperty(term)) {
        var nextTerm = this.next.distinct || this.next.term;
        if (mapping[prop][2][term].hasOwnProperty(nextTerm)) {
            var nextNextTerm = this.next.next.distinct || this.next.next.term;
            if (mapping[prop][2][term][nextTerm].hasOwnProperty(nextNextTerm)) {
                // successful stop-term found in trigram
                return 2;
            }
        }
    }
    // check bigram
    if (this.next && mapping[prop][1].hasOwnProperty(term)) {
        var nextTerm = this.next.distinct || this.next.term;
        if (mapping[prop][1][term].hasOwnProperty(nextTerm)) {
            // successful stop-term found in trigram
            return 1;
        }
    }
    // check unigram
    if (mapping[prop][0].hasOwnProperty(term)) {
        // successful stop-term found in trigram
        return 0;
    }

    return -1;
};

Word.prototype.chunk = function (mapping) {
    if (this.isUrl || this.isMention || this.isHashtag)
        return false;

    // correct adj-link to noun-link
    if (this.isAdjCard && this.next && this.next.isLink) {
        this.tag = "NOUN";
        this.isNoun = true;
        delete this.isAdjCard;
        delete this.isAdj;
        return false;
    }
    
    // join all to-phrase chunks
    if (this.isTo && this.next && this.next.isVerb) {
        this.mergeRight(mapping);
        return true;
    }

    // join linking or copulae verb phrases
    if (this.isLink && this.next && this.next.isLink) {
        this.mergeLeft(mapping);
        return true;
    }

    // join copulae verb phrases
    if (this.isCop && this.next && this.next.isCop) {
        this.mergeLeft(mapping);
        return true;
    }

    // join verb phrases (non-linking)
    if (this.isVerb && !this.isLink && this.next && this.next.isVerb && !this.next.isLink && !this.next.isAdv) {
        this.mergeLeft(mapping);
        return true;
    }

    // join verb-to-verb phrases (non-linking)
    if (this.isVerb && !this.isLink && this.next && this.next.isTo && this.next.next && this.next.next.isVerb && 
        !this.next.next.isLink && !this.next.next.isAdv) {
        this.mergeLeft(mapping);
        this.mergeLeft(mapping);
        return true;
    }

    // linking negation
    if (this.isLink && this.next && this.next.isNeg) {
        this.mergeLeft(mapping);
        return true;
    }

    // negated verb
    if (this.isNeg && !this.isLink && this.next && this.next.isVerb && !this.next.isLink && !this.next.isAdv) {
        this.mergeRight(mapping);
        return true;
    }

    // special case of linking verb (verb - temporal/time noun - verb) wherein (verb verb is a linking phrase with an injected timenoun)
    // this is true for english in cases such as: should rarely be, should now be...etc
    if (this.isVerb && this.next && this.next.isTempOrTimeNoun && this.next.next && this.next.next.isVerb) {
        var bigramSpec = this.term + this.spacing + this.next.next.term;
        if (this.checkLinking(mapping, bigramSpec)) {
            this.mergeLeft(mapping);
            this.mergeLeft(mapping);
            this.isLink = true;
            return true;
        }
    }

    // adverb verb
    if (this.isAdv && this.next && this.next.isVerb && !this.next.isLink) {
        this.mergeRight(mapping);
        return true;
    }

    // adverb adverb
    if (this.isAdv && this.next && this.next.isAdv) {
        this.mergeLeft(mapping);
        return true;
    }

    // adverb prt
    if (this.isAdv && this.next && this.next.isPrt) {
        this.mergeLeft(mapping);
        return true;
    }

    // adverb adject
    if (this.isAdv && this.next && !this.next.isLink && this.next.isAdj) {
        this.mergeRight(mapping);
        return true;
    }

    // adverb noun
    if (this.isAdv && this.next && this.next.isNoun && (!this.next.isHashtag && !this.next.isUrl && !this.next.isMention)) {
        this.mergeRight(mapping);
        return true;
    }

    // adj adj
    if (this.isAdjCard && this.next && this.next.isAdjCard) {
        this.mergeRight(mapping);
        return true;
    }

    // adj noun
    if (this.isAdjCard && this.next && this.next.isNoun) {
        this.mergeRight(mapping);
        return true;
    }

    // adj verb
    if (this.isAdjCard && this.next && (this.next.isVerb || this.next.isAdv) && !this.next.isLink) {
        if (this.next.next && this.next.next.isLink) {
            this.mergeLeft(mapping);
            return true;
        }
    }

    // noun adj
    if (this.isNoun && this.next && this.next.isAdjCard) {
        this.mergeLeft(mapping);
        return true;
    }

    // noun-noun
    if (this.isNoun && this.next) {
        var next = this.next;
        if (next.isNoun && (!next.isHashtag && !next.isUrl && !next.isUrl)) {
            if (this.isTempOrTimeNoun && next.isTempOrTimeNoun) {
                this.mergeLeft(mapping);
                return true;
            }
            else if (!this.isTempOrTimeNoun && !next.isTempOrTimeNoun) {
                if (this.isNeg) {
                    this.mergeRight(mapping);
                    return true;
                }
                else {
                    this.mergeLeft(mapping);
                    return true;
                }
            }
        }
    }

    return false;
};

Word.prototype.bigram = function () {
    if (this.next) {
        var format = this.term + this.spacing;
        if (this.distinct)
            format = this.distinct + this.spacing;
        if (this.next.distinct)
            format += this.next.distinct;
        else
            format += this.next.term;
        return format;
    }
    else return "";
};

Word.prototype.trigram = function () {
    if (this.next && this.next.next) return this.bigram() + this.spacing + this.next.next.term;
    else return "";
};

Word.prototype.quadrigram = function () {
    if (this.next && this.next.next && this.next.next.next) return this.trigram() + this.spacing + this.next.next.next.term;
    else return "";
};

Word.prototype.fivegram = function () {
    if (this.next && this.next.next && this.next.next.next && this.next.next.next.next) return this.quadrigram() + this.spacing + this.next.next.next.next.term;
    else return "";
};

Word.prototype._updateState = function (mapping) {
    var lowerTerm = this.term.toLowerCase();
    this.isUrl = this.isUrl || this.term.indexOf('http') == 0;
    this.isMention = this.hasOwnProperty('isMention') ? this.isMention : this.term.match(/^@[A-Za-z0-9\-_]+/) ? true : false;
    this.isPron = this.tag == 'PRON';
    this.isAdv = this.tag == 'ADV';
    this.isAdp = this.tag == 'ADP';
    this.isPrt = this.tag == 'PRT';
    this.isTo = this.hasOwnProperty('isTo') ? this.isTo : mapping['to'].hasOwnProperty(lowerTerm);
    this.beginsDet = this.hasOwnProperty('beginsDet') ? this.beginsDet : this.isDet;
    this.isVerb = this.isVerb || this.tag == 'VERB' || this.isLink || this.isCop;
    this.isSubjectPron = this.hasOwnProperty('isSubjectPron') ? this.isSubjectPron : (this.isPron && mapping['subjp'].hasOwnProperty(lowerTerm));
    this.isAdpNonScorable = this.hasOwnProperty('isAdpNonScorable') ? this.isAdpNonScorable : mapping['adp0'].hasOwnProperty(lowerTerm);
    this.isContract = this.hasOwnProperty('isContract') ? this.isContract : mapping['contr'].hasOwnProperty(lowerTerm);
    this.checkTerms(mapping, lowerTerm);
    this.isConjOr = this.hasOwnProperty('isConjOr') ? this.isConjOr : (this.isConj && mapping['or'].hasOwnProperty(lowerTerm));
};

Word.prototype.checkTerms = function (mapping, term, inspectRight, takeLeft) {
    var lowerTerm = term.toLowerCase();
    this.isDet = this.tag == 'DET';
    this.isConj = this.tag == 'CONJ';
    this.isAdj = this.tag == 'ADJ';
    this.isNum = this.tag == 'NUM';
    this.isAdjCard = this.isNum || this.isAdj;
    this.isQTerm = this.hasOwnProperty('isQTerm') ? this.isQTerm : mapping['ques'].hasOwnProperty(lowerTerm);
    this.isQToken = this.hasOwnProperty('isQToken') ? this.isQToken : this.term.indexOf('?') > -1;
    this.isNoun = this.tag == 'NOUN' || this.tag == 'PRON' || this.isUrl || this.isHashtag || this.isMention;
    this.isNeg = this.isNeg || (inspectRight && this.next.isNeg) || this.checkNegation(mapping, lowerTerm);
    this.isCop = inspectRight ? ((this.isCop && this.next.isCop) || this.checkCopulae(mapping, lowerTerm)) : this.isCop || this.checkCopulae(mapping, lowerTerm);
    this.isLink = inspectRight ? ((this.isLink && this.next.isLink) || this.checkLinking(mapping, lowerTerm)) : this.isLink || this.checkLinking(mapping, lowerTerm);
    this.isTempOrTimeNoun = inspectRight ? (takeLeft ? this.isTempOrTimeNoun : this.next.isTempOrTimeNoun) : (this.isTempOrTimeNoun || this.checkTimeNouns(mapping, lowerTerm));
    this.isCoordNegation = this.hasOwnProperty('isCoordNegation') ? this.isCoordNegation : ((this.isConj || this.isAdv) && mapping['coor*'].hasOwnProperty(lowerTerm));
    this.isClause = this.hasOwnProperty('isClause') ? this.isClause : (this.isAdp && mapping['clause'].hasOwnProperty(lowerTerm));
    this.isAmplifier = ((this.isAdjCard || this.isAdv || this.isNoun || this.isPrt) && (this.next || this.children) && mapping['ampl'].hasOwnProperty(lowerTerm));
};

Word.prototype.checkTimeNouns = function (mapping, term) {
    return mapping['timen'].hasOwnProperty(term);
};

Word.prototype.checkNegation = function (mapping, term) {
    return mapping['*'].hasOwnProperty(term) || mapping['link*'].hasOwnProperty(term);
};

Word.prototype.checkLinking = function (mapping, term) {
    return mapping['link'].hasOwnProperty(term) || mapping['link*'].hasOwnProperty(term);
};

Word.prototype.checkCopulae = function (mapping, term) {
    return mapping['cop'].hasOwnProperty(term);
};

Word.prototype.checkStopTerm = function (mapping, term) {
    return mapping['stop'].hasOwnProperty(term);
};

Word.prototype.mergeLeft = function (mapping) {
    this.joinNext(mapping, true);
};

Word.prototype.mergeRight = function (mapping) {
    this.joinNext(mapping, false);
};

Word.prototype.joinNext = function (mapping, takeLeft) {
    if (this.next) {
        if (this.children.length == 0)
            this.orig = this.copy(mapping);

        if (this.next.children.length == 0) {
            this.children.push(this.next.copy(mapping));
        }
        else {
            for (var i = 0; i < this.next.children.length; i++) {
                this.children.push(this.next.children[i]);
            }
        }

        var concat = false;
        if (this.next.isContract)
            concat = true;

        if (!this.hasOwnProperty('termMap')) {
            this.termMap = [];
            this.termMap.push(this.term);
        }

        this.termMap.push(this.next.term);
        this.term = concat ? (this.term + this.next.term) : (this.term + this.spacing + this.next.term);
        if (this.distinct && this.next.distinct) {
            this.distinct = concat ? (this.distinct + this.next.distinct) : (this.distinct + this.spacing + this.next.distinct);
        }
        else if (this.distinct && !this.next.distinct) {
            this.distinct = concat ? (this.distinct + this.next.term) : (this.distinct + this.spacing + this.next.term);
        }
        else if (!this.distinct && this.next.distinct) {
            this.distinct = concat ? (this.term + this.next.distinct) : (this.term + this.spacing + this.next.distinct);
        }
        if (this.lemma && this.next.lemma)
            this.lemma = concat ? (this.lemma + this.next.lemma) : (this.lemma + this.spacing + this.next.lemma);

        if (this.isDet && !takeLeft) {
            this.distinct = this.next.distinct || this.next.term;
        }

        this.beginsDet = this.beginsDet || this.isDet;
        this.beginsPron = this.beginsPron || this.isPron;
        this.tag = takeLeft ? this.tag : this.next.tag;
        this.checkTerms(mapping, this.term, true, takeLeft);
        this.isAdv = takeLeft ? this.isAdv : this.next.isAdv;
        this.isAdp = takeLeft ? this.isAdp : this.next.isAdp;
        this.isPron = takeLeft ? this.isPron : this.next.isPron;
        this.endsDet = this.next.isDet;
        this.isVerb = takeLeft ? this.isVerb : this.next.isVerb;
        this.isFiltered = this.isFiltered && this.next.isFiltered;
        if (!this.isFiltered) {
            delete this.isFiltered;
        }

        // Forward link to the following word after that
        var newNext = this.next.next;
        if (!newNext) {
            delete this.next;
        }
        else {
            this.next = newNext;
        }
    }
};

module.exports = Word;
