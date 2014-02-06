
var util = require('util');

function Word(term, tag, i, mapping) {
    this.term = term;
    if (this.term.toLowerCase() != this.term) {
        this.distinct = this.term.toLowerCase();
    }
    this.tag = tag;
    this.position = i;
    this.children = [];
    this.spacing = " ";
    this.negation = "not";
    this._updateState(mapping);
}

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

Word.prototype.collapseLinks = function (mapping) {
    // collapse contractions
    if (this.next && this.next.isContract) {
        this.mergeLeft(mapping);
        return true;
    }

    // check bigram linking
    var bigram = this.bigram();
    if (bigram && this.checkLinking(mapping, bigram)) {
        this.mergeLeft(mapping);
        return true;
    }

    // check trigram linking
    var trigram = this.trigram();
    if (trigram && this.checkLinking(mapping, trigram)) {
        this.mergeLeft(mapping);
        this.mergeLeft(mapping);
        return true;
    }

    // check quadrigram linking
    var quadrigram = this.quadrigram();
    if (quadrigram && this.checkLinking(mapping, quadrigram)) {
        this.mergeLeft(mapping);
        this.mergeLeft(mapping);
        this.mergeLeft(mapping);
        return true;
    }

};

Word.prototype.chunk = function (mapping) {
    if (this.isUrl || this.isMention || this.isHashtag)
        return false;

    // Join all determiner cases where possible
    if (this.isDet && this.next) {
        var next = this.next;
        if (next.isDet || next.isAdj || next.isAdv || next.isNoun) {
            this.mergeRight(mapping);
            return true;
        }
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
                this.mergeLeft(mapping);
                return true;
            }
        }
    }

    return false;
};

Word.prototype.bigram = function () {
    if (this.next) return this.term + this.spacing + this.next.term;
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
    this.isHashtag = this.hasOwnProperty('isHashtag') ? this.isHashtag : this.term.match(/^#\S+/) ? true : false;
    this.isPron = this.tag == 'PRON';
    this.isAdv = this.tag == 'ADV';
    this.isAdp = this.tag == 'ADP';
    this.isPrt = this.tag == 'PRT';
    this.isTo = this.hasOwnProperty('isTo') ? this.isTo : mapping['to'].indexOf(lowerTerm) > -1;
    this.beginsDet = this.hasOwnProperty('beginsDet') ? this.beginsDet : this.isDet;
    this.isVerb = this.isVerb || this.tag == 'VERB' || this.isLink || this.isCop;
    this.isConjOr = this.hasOwnProperty('isConjOr') ? this.isConjOr : (this.isConj && mapping['or'].indexOf(lowerTerm) > -1);
    this.isSubjectPron = this.hasOwnProperty('isSubjectPron') ? this.isSubjectPron : (this.isPron && mapping['subjp'].indexOf(lowerTerm) > -1);
    if (!this.hasOwnProperty('termReplace') && this.isNeg && mapping['rep*'].indexOf(lowerTerm) > -1) {
        this.termReplace = mapping['rep*'][mapping['rep*'].length - 1];
    }
    this.isContract = this.hasOwnProperty('isContract') ? this.isContract : mapping['contr'].indexOf(lowerTerm) > -1;
    this.checkTerms(mapping, lowerTerm);
};

Word.prototype.checkTerms = function (mapping, term, inspectRight, takeLeft) {
    var lowerTerm = term.toLowerCase();
    this.isDet = this.tag == 'DET';
    this.isConj = this.tag == 'CONJ';
    this.isAdj = this.tag == 'ADJ';
    this.isNum = this.tag == 'NUM';
    this.isAdjCard = this.isNum || this.isAdj;
    this.isQTerm = this.hasOwnProperty('isQTerm') ? this.isQTerm : mapping['ques'].indexOf(lowerTerm) > -1;
    this.isQToken = this.hasOwnProperty('isQToken') ? this.isQToken : this.term.indexOf('?') > -1;
    this.isNoun = this.tag == 'NOUN' || this.tag == 'PRON' || this.isUrl || this.isHashtag || this.isMention;
    this.isNeg = this.isNeg || (inspectRight && this.next.isNeg) || this.checkNegation(mapping, lowerTerm);
    this.isCop = inspectRight ? ((this.isCop && this.next.isCop) || this.checkCopulae(mapping, lowerTerm)) : this.isCop || this.checkCopulae(mapping, lowerTerm);
    this.isLink = inspectRight ? ((this.isLink && this.next.isLink) || this.checkLinking(mapping, lowerTerm)) : this.isLink || this.checkLinking(mapping, lowerTerm);
    this.isStopTerm = inspectRight ? (this.isStopTerm && this.next.isStopTerm) || this.checkStopTerm(mapping, lowerTerm) : (this.isStopTerm || this.checkStopTerm(mapping, lowerTerm));
    this.isTempOrTimeNoun = inspectRight ? (takeLeft ? this.isTempOrTimeNoun : this.next.isTempOrTimeNoun) : (this.isTempOrTimeNoun || this.checkTimeNouns(mapping, lowerTerm));
    this.isCoordNegation = this.hasOwnProperty('isCoordNegation') ? this.isCoordNegation : ((this.isConj || this.isAdv) && mapping['coor*'].indexOf(lowerTerm) > -1);
    this.isClause = this.hasOwnProperty('isClause') ? this.isClause : (this.isAdp && mapping['clause'].indexOf(lowerTerm) > -1);
};

Word.prototype.checkTimeNouns = function (mapping, term) {
    return mapping['timen'].indexOf(term) > -1;
};

Word.prototype.checkNegation = function (mapping, term) {
    return mapping['*'].indexOf(term) > -1 || mapping['link*'].indexOf(term) > -1;
};

Word.prototype.checkLinking = function (mapping, term) {
    return mapping['link'].indexOf(term) > -1 || mapping['link*'].indexOf(term) > -1;
};

Word.prototype.checkCopulae = function (mapping, term) {
    return mapping['cop'].indexOf(term) > -1;
};

Word.prototype.checkStopTerm = function (mapping, term) {
    return mapping['stop'].indexOf(term) > -1;
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
            this.orig = new Word(this.term, this.tag, this.position, mapping);

        if (this.next.children.length == 0) {
            this.children.push(new Word(this.next.term, this.next.tag, this.next.position, mapping));
        }
        else {
            for (var i = 0; i < this.next.children.length; i++) {
                this.children.push(this.next.children[i]);
            }
        }

        var concat = false;
        if (this.next.isContract)
            concat = true;

        this.term = concat ? (this.term + this.next.term) : (this.term + this.spacing + this.next.term);

        this.tag = takeLeft ? this.tag : this.next.tag;
        this.checkTerms(mapping, this.term, true, takeLeft);
        this.isAdv = takeLeft ? this.isAdv : this.next.isAdv;
        this.isAdp = takeLeft ? this.isAdp : this.next.isAdp;
        this.isPron = takeLeft ? this.isPron : this.next.isPron;
        this.endsDet = this.next.isDet;
        this.isVerb = takeLeft ? this.isVerb : this.next.isVerb;

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
