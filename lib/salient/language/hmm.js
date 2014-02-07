
var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    readline = require('readline');

var Vocabulary = require('./vocabulary');

function HiddenMarkovModel(options) {
    this.options = options || {};
    this.alpha = this.options.alpha || 0.2;
    this.terms = 0;
    this.lambdaV = [0.01, 0.41, 0.58]; // gram, bigram, trigram
    this.tags = {'0': 'NOUN', '1': 'VERB', '2': 'ADJ', '3': 'ADV', '4': 'X', '5': 'NUM', 
                 '6': 'PRON', '7': 'CONJ', '8': 'DET', '9': 'PRT', '10': 'ADP', '11': '.', '*': '*'
                };
    this.tagLength = 12;
};

HiddenMarkovModel.prototype.restore = function (file) {
    if (file.indexOf('~') == 0) {
        file = path.join(process.env['HOME'], file.substring(1));
    }
    if (file.indexOf('.json') < 0) {
        throw Error('Must be a valid json output');
    }

    // Set all appropriate local data
    var fileData = require(file);
    if (fileData.vocabulary) {
        this.vocabulary = new Vocabulary();
        this.vocabulary.restore(fileData.vocabulary);
    }
    if (fileData.tagFreq)
        this.tagFreq = fileData.tagFreq;
    if (fileData.data)
        this.data = fileData.data;
    if (fileData.vocabularyTagDistribution)
        this.vocabularyTagDistribution = fileData.vocabularyTagDistribution;
    if (fileData.vocabularyTagClasses)
        this.vocabularyTagClasses = fileData.vocabularyTagClasses;
    if (fileData.vocabularyTagProbability)
        this.vocabularyTagProbability = fileData.vocabularyTagProbability;
    if (fileData.alpha)
        this.alpha = fileData.alpha;
    if (fileData.options)
        this.options = fileData.options;
    if (fileData.terms)
        this.terms = fileData.terms;
    if (fileData.lambdaV)
        this.lambdaV = fileData.lambdaV;
    if (fileData.tagGramDistribution)
        this.tagGramDistribution = fileData.tagGramDistribution;
    if (fileData.totalTags)
        this.totalTags = fileData.totalTags;
    if (fileData.tagClasses)
        this.tagClasses = fileData.tagClasses;
};

/**
 * Computes the cross-validation error by determing a simple summation of log probabilities 
 * times the actual frequency within the validation hidden markov model. This should allow 
 * us to graph the maximum log probability score based on the configured lambda parameters.
 */
HiddenMarkovModel.prototype.crossValidate = function (validationHMM) {
    var total = 0;
    for (var tag in this.tagGramDistribution) {
        var len = tag.split('+').length;

        if (len == 3) {
            var item = this.tagGramDistribution[tag];
            var logp = item.logp;
            var freq = 0;
            if (validationHMM.tagGramDistribution.hasOwnProperty(tag)) {
                freq = validationHMM.tagGramDistribution[tag].freq;
            }

            total += (freq * logp);
        }
    }

    this.validationScore = total;
    return this.validationScore;
};

/**
 * Estimates the probability distribution of a given tag sequence 
 * over its appropriate predetermined tags using a backoff model.
 */
HiddenMarkovModel.prototype.estimateTagDistribution = function () {
    if (!this.tagGramDistribution) {
        throw Error("Must load a tag sequence distribution first");
    }

    var tagDistribution = this.tagGramDistribution;
    for (var tag in tagDistribution) {
        var item = tagDistribution[tag];
        
        // Estimate parameters q for the given n-gram distribution
        // this can be done by first calculating the distribution 
        var itemFrequency = item.freq;
        var tags = item.tag.split('+');
        var minus1 = tags.slice(1);
        var minus1Freq = 0;
        if (minus1.length > 0) {
            // use count of the distribution
            var gram = minus1.join('+');
            if (tagDistribution.hasOwnProperty(gram)) {
                minus1Freq = tagDistribution[gram].freq;
            }
        }
        else {
            minus1Freq = this.totalTags;
        }

        // Calculate maximum likelihood of the given distribution
        if (item.freq > 0 && minus1Freq > 0) {
            item.ml = item.freq / minus1Freq;
        }
    }

    for (var tag in tagDistribution) {
        var item = tagDistribution[tag];
        var tags = item.tag.split('+');
        item.p = 0.0;
        for (var t = 1; t <= tags.length; t++) {
            var gram = tags.slice(tags.length - t).join('+');
            if (gram && tagDistribution.hasOwnProperty(gram)) {
                var gramItem = tagDistribution[gram];
                if (gramItem.hasOwnProperty('ml')) {
                    var lambda = this.lambdaV[t - 1];
                    item.p += lambda * gramItem.ml;
                }
            }
        }

        item.logp = Math.log(item.p);
    }
};

/**
 * Estimates the probability distribution of a given vocabulary 
 * over its appropriate tags and equivalence classes.
 */
HiddenMarkovModel.prototype.estimateVocabulary = function () {
    if (!this.data) {
        throw Error("Must load a vocabulary distribution first");
    }

    // Iterate over the equivalence classes available to generate a local array
    // usable for easy retrieval of the pos tags themself
    var tagClasses = [];
    var allStates = [];
    for (var i = 0, l = this.vocabularyTagClasses.length; i < l; i++) {
        var cls = this.vocabularyTagClasses[i];
        var posItems = cls.split(',');
        var pos = [];
        for (var p = 0; p < posItems.length; p++) {
            var posItem = posItems[p];
            pos.push(parseInt(posItem));
        }
        tagClasses[i] = pos;

        if (posItems.length == 1) {
            allStates.push(pos);
        }
    }

    this.tagClasses = tagClasses;
    this.vocabularyTagProbability = [];

    // iterate over the vocabulary and use the 
    // vocabulary tag distribution to estimate 
    // the probability of a tag given a word
    for (var posEquivIndex = 0; posEquivIndex < this.tagClasses.length; posEquivIndex++) {
        var pos = this.tagClasses[posEquivIndex];
        var tagClassFreq = this.vocabularyTagDistribution[posEquivIndex];
        var tagEqProb = {};
        var posProb = [];
        if (tagClassFreq) {
            // Estimate the probability for each 
            // tag that this item can be assigned as 
            var total = 0;
            for (var i = 0; i < pos.length; i++) {
                // since we initialize the tag class and distributions
                // based on the initial number of tags, all equivalence 
                // classes will be based on these numbers, so these should
                // be immediately accessible by index
                var p = pos[i]; 
                var tagFreq = this.vocabularyTagDistribution[p];

                var eqProb = 0;
                if (tagFreq) {
                    eqProb = tagClassFreq / tagFreq; // P(eqcls w.r.t. t) = Freq(eqcls) / Freq(t)
                    eqProb *= this.alpha;
                    eqProb = Math.log(eqProb);
                }

                tagEqProb[p] = eqProb;
                total += tagEqProb[p];
            }

            // divide each tag frequency equivalence probability 
            // by the aggregate sum of all of them
            for (var i = 0; i < pos.length; i++) {
                var p = pos[i];
                var prob = 1 / pos.length;
                posProb.push(prob);
            }
        }

        this.vocabularyTagProbability[posEquivIndex] = posProb;
    };
    
    // finally add the class state for all common base states
    allStates.sort();
    var total = 0;
    var items = [];
    this.tagFreq = {};
    for (var i = 0; i < allStates.length; i++) {
        var tagFreq = this.vocabularyTagDistribution[allStates[i]];
        if (tagFreq) {
            var tag = this.tags[allStates[i].toString()];
            this.tagFreq[tag] = tagFreq;
            items.push(allStates[i]);
            total += tagFreq;
        }
    }

    var probs = [];
    for (var i = 0; i < items.length; i++) {
        var tagFreq = this.vocabularyTagDistribution[items[i]];
        var prob = tagFreq / total;
        probs.push(prob);
    }

    if (items && probs) {
        this.tagClasses.push(items);
        this.vocabularyTagProbability.push(probs);
    }
};

/**
 * Loads the given vocabulary and n-gram tag distribution files.
 */
HiddenMarkovModel.prototype.load = function (vocabFile, tagGramDistFile, callback) {
    this.loadVocab(vocabFile, function () {
        this.loadTagDist(tagGramDistFile, callback);
    });
};

/**
 * Loads the given n-gram tag distribution file which should 
 * include all possible grams (up to n-grams) and their relevant 
 * frequency distributions that were found within a tagged corpus.
 */
HiddenMarkovModel.prototype.loadTagDist = function (tagDistFile, callback) {
    var self = this;

    this.tagGramDistribution = {};
    this.totalTags = 0;

    var inputStream = fs.createReadStream(tagDistFile);
    var rl = readline.createInterface({ input: inputStream, terminal: false });
    rl.on('line', function (line) {
        var items = line.trim().split('\t');
        if (items.length < 3) {
            line = null;
            return;
        }

        // tag+tag+tag    freq    distribution%
        var item = {};
        item.tag = items[0];
        item.freq = parseInt(items[1]);

        self.tagGramDistribution[item.tag] = item;

        // Aggregate all tag frequencies
        if (item.tag.split('+').length == 1) {
            self.totalTags += item.freq;
        }
    });
    rl.on('close', function () {
        callback();
    });
};

/**
 * Loads the given vocabulary file into memory. This should allow 
 * us to automatically create a proper vocabulary and vocabulary 
 * tag distribution model. We will filter out duplicate entries 
 * and be able to perform further reduction techniques here. In 
 * addition, the vocabulary tag distribution will give us an 
 * idea how how many times a particular part of speech occurs 
 * as well as how many times a word ends up with a set of tags 
 * (noted as our equivalence classes).
 */
HiddenMarkovModel.prototype.loadVocab = function (vocabFile, tagCount, callback) {
    var self = this;

    this.vocabulary = new Vocabulary();
    this.data = { pos: [], posFreq: [], eqCls: [] };
    this.vocabularyTagDistribution = [];
    this.vocabularyTagClasses = [];

    // Pre-calculate the tag distribution according to the number of tags
    // use the default universal tag set count of 12
    // (0 = NOUN, 1 = VERB, 2 = ADJ, 3 = ADV, 4 = X, 5 = NUM, 6 = PRON, 7 = PRT, 8 = CONJ, 9 = DET, 10 = ADP, 11 = .)
    if (typeof tagCount == 'function') {
        callback = tagCount;
        tagCount = 12;
    }
    else if (typeof tagCount == 'undefined') {
        tagCount = 12;
    }

    for (var i = 0; i < tagCount; i++) {
        this.vocabularyTagClasses.push(i.toString());
        this.vocabularyTagDistribution[i] = 0;
    }

    var inputStream = fs.createReadStream(vocabFile);
    var rl = readline.createInterface({ input: inputStream, terminal: false });
    var index = 0;
    rl.on('line', function (line) {
        var items = line.trim().split('\t');
        if (items.length < 3) {
            items.push('11');
        }

        // id   vocab   pos,pos    pos-freq,pos-freq
        var item = { pos: [] };
        var token = items[1].toLowerCase();
        var posItems = items[2].split(',');
        var sortedPos = [];
        for (var p = 0; p < posItems.length; p++) {
            item.pos.push(parseInt(posItems[p]));
            sortedPos.push(item.pos[p]);
        }

        if (item.pos.length == 1) {
            if (isNaN(item.pos[0])) {
                return;
            }
        }

        if (items.length == 4) {
            var posFreqItems = items[3].split(',');
            var posFreq = [];
            for (var k = 0; k < posFreqItems.length; k++) {
                var f = parseInt(posFreqItems[k]);
                posFreq.push(f);
            }
            item.posFreq = posFreq;
        }

        var existingIndex = self.vocabulary.get(token);
        if (existingIndex) {
            var aposIndex = self.data.pos[existingIndex];
            var aposClass = self.vocabularyTagClasses[aposIndex];
            var apos = aposClass.split(',');
            var aposFreq = self.data.posFreq[existingIndex];
            var result = self.mergeVocabulary(apos, aposFreq, item);
            item = result;
        }

        // For each equivalance class, where the pos that a term 
        // falls into (i.e. if a term falls into just having a single 
        // NOUN associated with it), then use that as an equivalence class 
        // where we can count up the times that type of class occurs
        var pos = item.pos;
        var equivalenceClass = sortedPos.join(',');
        var equivalenceIndex = self.vocabularyTagClasses.indexOf(equivalenceClass);
        if (equivalenceIndex < 0) {
            equivalenceIndex = self.vocabularyTagClasses.length;
            self.vocabularyTagClasses.push(equivalenceClass);
            self.vocabularyTagDistribution[equivalenceIndex] = 0;
        }
        self.vocabularyTagDistribution[equivalenceIndex]++;

        // For each part of speech tag associated with the term
        // increment a frequency for that kind of tag
        for (var k = 0; k < pos.length; k++) {
            var p = pos[k].toString();
            var pEquivClassIndex = self.vocabularyTagClasses.indexOf(p);
            if (pEquivClassIndex < 0) {
                pEquivClassIndex = self.vocabularyTagClasses.length;
                self.vocabularyTagClasses.push(p);
                self.vocabularyTagDistribution[pEquivClassIndex] = 0;
            }
            self.vocabularyTagDistribution[pEquivClassIndex]++;
        }

        if (existingIndex) {
            self.data.pos[existingIndex] = equivalenceIndex;
            if (item.posFreq)
                self.data.posFreq[existingIndex] = item.posFreq;
        }
        else {
            self.data.pos[self.terms] = equivalenceIndex;
            if (item.posFreq) {
                self.data.posFreq[self.terms] = item.posFreq;
            }
            self.vocabulary.addTerm(token, self.terms++);
        }

        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write('Processed ' + (index++) + ' total items');
        posItems = null;
        items = null;
        line = null;
    });
    rl.on('close', function () {
        self.vocabulary.computeHash();
        callback();
    });
};

/**
 * Merges the two terms in the case there was a kind of duplicate entry 
 * in the list of vocabulary terms (such that due to casing or other 
 * lemma rules that may apply).
 */
HiddenMarkovModel.prototype.mergeVocabulary = function (apos, aposFreq, b) {
    var mergedItem = {};
    var useFrequency = false;

    // Select the pos and pos frequencies from a
    var newPos = {};
    for (var i = 0; i < apos.length; i++) {
        var aPosTag = apos[i];
        var freq = 1;
        if (aposFreq) {
            useFrequency = true;
            freq = aposFreq[i];
        }

        if (newPos.hasOwnProperty(aPosTag)) {
            newPos[aPosTag] += freq;
        }
        else {
            newPos[aPosTag] = freq;
        }
    }

    // Select the pos and pos frequencies from b
    for (var i = 0; i < b.pos.length; i++) {
        var bPosTag = b.pos[i];
        var freq = 1;
        if (b.posFreq) {
            useFrequency = true;
            freq = b.posFreq[i];
        }

        if (newPos.hasOwnProperty(bPosTag)) {
            newPos[bPosTag] += freq;
        }
        else {
            newPos[bPosTag] = freq;
        }
    }

    mergedItem.pos = [];
    if (useFrequency)
        mergedItem.posFreq = [];

    // Set all appropriate pos items
    for (var pItem in newPos) {
        mergedItem.pos.push(parseInt(pItem));
        if (useFrequency) {
            mergedItem.posFreq.push(newPos[pItem]);
        }
    }

    mergedItem.pos = mergedItem.pos.sort();
    return mergedItem;
};

/**
 * Implements the standard viterbi algorithm for calculating the 
 * most probable path given the k-th order markov chain applies. 
 * This should use the given tokens as an observation sequence 
 * in order to determine the most probable tags for the tokens.
 */
HiddenMarkovModel.prototype.viterbi = function (tokens) {
    var states = [];
    var stateProb = [];
    for (var k = 0; k < tokens.length; k++) {
        var token = tokens[k].toLowerCase();

        var isNumeric = false;
        var isMentionHashTag = false;
        var isUrl = false;
        var isRepeatedPunct = false;
        if (token.match(/^\d+\%?/)) {
            isNumeric = true;
        }
        else if (token.match(/^@[A-Za-z0-9_\-]+/) || token.match(/^#\w+/)) {
            isMentionHashTag = true;
        }
        else if (token.indexOf('http://') == 0) {
            isUrl = true;
        }
        else if (token.match(/^[!.=\-:”“"?,(){}\[\]*]+/)) {
            isRepeatedPunct = true;
        }

        if (!isNumeric && !isMentionHashTag && !isUrl && !isRepeatedPunct) {
            var vocabIndex = this.vocabulary.get(token);
            var eqIndex = this.tagClasses.length - 1;

            if (vocabIndex) {
                eqIndex = this.data.pos[vocabIndex];
            }

            var tagProbK = this.vocabularyTagProbability[eqIndex];

            var stateK = this.tagClasses[eqIndex];
            var tags = [];

            for (var s = 0; s < stateK.length; s++) {
                var state = stateK[s].toString();
                tags.push(this.tags[state]);
            }

            if (vocabIndex) {
                var posFreqV = this.data.posFreq[vocabIndex];
                if (posFreqV && tags.length == posFreqV.length) {
                    var newTagProbK = [];
                    var total = 0.0;
                    for (var i = 0; i < tags.length; i++) {
                        var posFreq = posFreqV[i];
                        if (this.tagFreq.hasOwnProperty(tags[i])) {
                            var prob = (posFreq / this.tagFreq[tags[i]]);
                            total += prob;
                            newTagProbK.push(prob);
                        }
                    }

                    for (var i = 0; i < newTagProbK.length; i++) {
                        newTagProbK[i] = newTagProbK[i] / total;
                    }

                    if (newTagProbK.length == tags.length) {
                        tagProbK = newTagProbK;
                    }
                }
            }

            states.push(tags);
            stateProb.push(tagProbK);
        }
        else if(isNumeric) {
            states.push(['NUM']);
            stateProb.push([1]);
        }
        else if (isMentionHashTag) {
            states.push(['X']);
            stateProb.push([1]);
        }
        else if (isUrl) {
            states.push(['X']);
            stateProb.push([1]);
        }
        else if (isRepeatedPunct) {
            states.push(['.']);
            stateProb.push([1]);
        }
    }

    // Initialize the base state where pi(0,*,*) = 1 and pi(0,u,v) = 0 for all (u,v)
    // such that u != * or v != *
    var pi = [{ '*': { '*': 1 }}];
    var path = [];
    for (var labelU in this.tags) {
        var tagU = this.tags[labelU];
        if (tagU == '*')
            continue;
        pi[0][tagU] = {};
        for (var labelV in this.tags) {
            var tagV = this.tags[labelV];
            if (tagV == '*')
                continue;
            pi[0][tagU][tagV] = 0;
        }
    }

    /*
    var allStates = {};
    var lastDistribution = this.tagClasses[this.tagClasses.length - 1];
    for (var l = 0; l < lastDistribution.length; l++) {
        var item = lastDistribution[l][0].toString();
        var prob = this.vocabularyTag[this.tagClasses.length - 1][l];
        allStates[this.tags[item]] = prob;
    }*/

    for (var k = 1; k <= tokens.length; k++) {
        var tempPath = {};
        var tempPi = {};
        var prevPi = pi[k-1];
        var statesU = this.getPossibleStates(k-1, states, '*');
        var statesV = this.getPossibleStates(k, states, '*');
        var statesW = this.getPossibleStates(k-2, states, '*');

        // Get the emission probabiity for the word token at k - 1
        var emissionsV = stateProb[k-1];

        for (var uIndex = 0; uIndex < statesU.length; uIndex++) {
            var u = statesU[uIndex];
            tempPi[u] = {};
            tempPath[u] = {};
            for (var vIndex = 0; vIndex < statesV.length; vIndex++) {
                var v = statesV[vIndex];
                var emissionV = emissionsV[vIndex];
                var argMax = undefined;
                for (var wIndex = 0; wIndex < statesW.length; wIndex++) {
                    var w = statesW[wIndex];
                    var trigram = w + '+' + u + '+' + v;
                    var trigramDist = this.tagGramDistribution[trigram];
                    if (!trigramDist)
                        trigramDist = { logp: Math.log(0.000001) };

                    var transitionQ = trigramDist.logp;
                    var logEmissionV = Math.log(emissionV);
                    if (logEmissionV == 0) {
                        logEmissionV = -1;
                    }

                    var prob = prevPi[w][u] * transitionQ * logEmissionV;
                    if (!argMax || prob < argMax.p) {
                        argMax = { 'p': prob, 'u': u, 'v': v, 'k': k, 'w': w };
                    }
                }

                if (!argMax) {
                    continue;
                }

                tempPi[u][v] = argMax.p;
                tempPath[u][v] = argMax.w;
            }
        }

        pi.push(tempPi);
        path.push(tempPath);
    }

    var prevPi = pi[pi.length - 1];
    var maxArg;
    for (var u in prevPi) {
        for (var v in prevPi[u]) {
            var stopGram = u + '+' + v + "+STOP";
            var distProb = 1;
            if (this.tagGramDistribution.hasOwnProperty(stopGram)) {
                distProb = Math.log(this.tagGramDistribution[stopGram].p);
                if (distProb == 0) {
                    distProb = Math.log(0.9999999);
                }
            }
            else {
                distProb = Math.log(0.000001);
            }

            var prob = prevPi[u][v] * distProb;
            if (!maxArg || maxArg.p < prob) {
                maxArg = { u: u, v: v, p: prob };
            }
        }
    }

    // store the best tag sequence in reverse for brevity, and invert the 
    // backpointers list as well during this processing
    var y = [ maxArg.v, maxArg.u ];
    path = path.reverse();

    // in each case,
    // the following best tag, is the one listed under the backpointer 
    // for the current best known tag
    var currentBestY = maxArg.v;
    var currentBestY1 = maxArg.u;
    for (var k = 0; k < path.length; k++) {
        var tempCurrentBest = path[k][currentBestY1][currentBestY];
        currentBestY = currentBestY1;
        currentBestY1 = tempCurrentBest;
        if (tempCurrentBest != "*")
            y.push(tempCurrentBest);
    }

    y = y.reverse();

    return { 'y': y, 'x': tokens };
};

HiddenMarkovModel.prototype.getPossibleStates = function (k, states, defaultState) {
    if (k < 1) {
        return [defaultState];
    }
    else {
        return states[k-1];
    }
};

module.exports = HiddenMarkovModel;
