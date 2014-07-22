
var fs = require('fs'),
    path = require('path'),
    XmlStream = require('./xml-stream'),
    util = require('util'),
    events = require('events');

function WiktionaryParser(file, options) {
    events.EventEmitter.call(this);
    this.options = options || {};
    this.file = file;
    if (!file) {
        throw Error("Must provide a valid wiktionary corpus to derive a vocabulary from");
    }

    // Expand the home directory appropriately if necessary
    if (this.file.indexOf('~') == 0) {
        var p = process.env['HOME'];
        this.file = path.join(p, this.file.substring(1));
    }
    var name = path.basename(this.file);
    this.lang = name.substring(0, 2);
    this.languageMapping = { 'en': 'english' };
    this.language = this.languageMapping[this.lang];
    this.mapFile = path.join(__dirname, this.lang + '.wik.map');
    this.verbose = this.options.verbose || false;
    this.output = this.options.output || path.join(__dirname, util.format('%s.wik.vocab', this.lang));
    this.outputDist = this.options.outputDist || path.join(__dirname, util.format('%s.wik.dist', this.lang));
    this.writtenTo = 0;
    this.distribution = {};
    this.states =
    {
        'NOUN': { c: 0, i: 0, s: 'NOUN' },
        'VERB': { c: 0, i: 1, s: 'VERB' },
        'ADJ': { c: 0, i: 2, s: 'ADJ' },
        'ADV': { c: 0, i: 3, s: 'ADV' },
        'X': { c: 0, i: 4, s: 'X' },
        'NUM': { c: 0, i: 5, s: 'NUM' },
        'PRON': { c: 0, i: 6, s: 'PRON' },
        'CONJ': { c: 0, i: 7, s: 'CONJ' },
        'DET': { c: 0, i: 8, s: 'DET' },
        'PRT': { c: 0, i: 9, s: 'PRT' },
        'ADP': { c: 0, i: 10, s: 'ADP' },
        '.': { c: 0, i: 11, s: '.' },
        '*': { c: 0, i: 12, s: '*' }
    };
};

util.inherits(WiktionaryParser, events.EventEmitter);

WiktionaryParser.prototype.buildMap = function () {
    if (this.mapping) {
        return this.mapping;
    }

    this.mapping = {};
    if (fs.existsSync(this.mapFile)) {
        var lines = fs.readFileSync(this.mapFile).toString().split('\n');
        for (var i = 0; i < lines.length; i++) {
            var lineItems = lines[i].split('->');
            if (lineItems.length != 2) {
                continue;
            }
            var pattern = lineItems[0].trim();
            var mapTo = lineItems[1].trim();
            if (typeof this.mapping[pattern] == 'undefined') {
                this.mapping[pattern] = [mapTo];
            }
            else {
                var existingMap = this.mapping[pattern];
                existingMap.push(mapTo);
                this.mapping[pattern] = existingMap;
            }
        }
    }
    else {
        this.printHeadings = true;
    }

    return this.mapping;
};

WiktionaryParser.prototype.parse = function () {
    var self = this;
    var mappings = this.buildMap();
    var stream = fs.createReadStream(this.file);
    var vocab = {};
    self.items = 0;
    self.vocabCount = 0;
    var xml = new XmlStream(stream);
    var pattern = /^=+\s*\{*([^=\[\]\{\}]*)\}*\s*=+/;
    var categoryPattern = /^\[+Category:.*\]+/;
    var wait = 0;
    var language = this.languageMapping[this.lang];
    xml.on('updateElement: page', function (item) {
        if (item.ns == "0") { // main namespace
            var title = item.title; // word token
            var content = item.revision.text['$text'];
            var id = item.id;
            var headers = [];
            var lines = content.split('\n');
            var breakSegment = false;
            var foundLanguage = false || !this.language;
            for (var i = 0; i < lines.length; i++) {
                if (breakSegment) {
                    break;
                }
                var line = lines[i];
                var match = line.match(pattern);
                if (match && match.length > 1) {
                    var currentState = match[1].toLowerCase().trim();
                    var substates = currentState.split(':');
                    if (substates.length > 1) {
                        currentState = substates[0];
                    }
                    substates = currentState.split('・');
                    if (substates.length > 1) {
                        currentState = substates[0];
                    }
                    substates = currentState.split('|');
                    if (substates.length > 1) {
                        if (substates[0] == self.lang) {
                            currentState = substates[1];
                        }
                        else {
                            currentState = substates[0];
                        }
                    }
                    if (currentState == self.language) {
                        foundLanguage = true;
                    }
                    if (!self.printHeadings && foundLanguage && typeof mappings[currentState] != 'undefined') {
                        var stateMap = mappings[currentState];
                        for (var s = 0; s < stateMap.length; s++) {
                            var state = stateMap[s];
                            if (headers.indexOf(self.states[state]) < 0)
                                headers.push(self.states[state]);
                        }
                    }
                    else if (self.printHeadings) {
                        if (!self.mapping.hasOwnProperty(currentState)) {
                            self.mapping[currentState] = 0;
                        }

                        self.mapping[currentState]++;
                    }
                }
                else {
                    match = line.match(categoryPattern);
                    if (match && foundLanguage) { // break out of page
                        breakSegment = true;
                    }
                }
                line = null;
            }
            if (foundLanguage && headers.length > 0) {
                var h = [];
                for (var hIndex = 0; hIndex < headers.length; hIndex++) {
                    h.push(headers[hIndex].i);
                    self.states[headers[hIndex].s].c++;
                }
                var v = { i: self.vocabCount++, w: title, h: h };
                vocab[v.i] = v;
                self.updateDist(v);
                self.emit('vocab', v, content);
            }
            else if (!foundLanguage) {
                console.log('\t', title);
            }
            content = null;
            title = null;
            item = null;
            self.items++;
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write('Processed ' + self.items + ' total pages, found ' + self.vocabCount + ' entries.');
            if (self.items % 2000 == 0) {
                var dist = self.dist(self.states, vocab);
                if (self.verbose) {
                    self.printStates(dist);
                }
                vocab = {};
            }
        }
    });
    xml.on('end', function () {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        var dist = self.dist(self.states, vocab);
        if (self.verbose) {
            self.printStates(dist);
        }
        if (self.printHeadings) {
            console.log(self.mapping);
        }
    });
};

WiktionaryParser.prototype.updateDist = function (v) {
    var self = this;
    var dist = self.distribution;
    if (!dist.uniState) {
        dist.uniState = 0;
        dist.biState = 0;
        dist.triState = 0;
        dist.quadState = 0;
        dist.plusState = 0;
    }

    dist.vocabCount = self.vocabCount;

    if (v.h.length == 1) {
        dist.uniState++;
    }
    else if (v.h.length == 2) {
        dist.biState++;
    }
    else if (v.h.length == 3) {
        dist.triState++;
    }
    else if (v.h.length == 4) {
        dist.quadState++;
    }
    else if (v.h.length > 4) {
        dist.plusState++;
    }

    dist.uniStatePercent = Math.round(100 * (dist.uniState / self.vocabCount));
    dist.biStatePercent = Math.round(100 * (dist.biState / self.vocabCount));
    dist.triStatePercent = Math.round(100 * (dist.triState / self.vocabCount));
    dist.quadStatePercent = Math.round(100 * (dist.quadState / self.vocabCount));
    dist.plusStatePercent = Math.round(100 * (dist.plusState / self.vocabCount));
};

WiktionaryParser.prototype.dist = function (states, vocab) {
    var self = this;

    var i = self.writtenTo;
    for (; i < self.vocabCount; i++) {
        if (typeof vocab[i] != 'undefined') {
            var v = vocab[i];
            var outputLine = util.format('%s\t%s\t%s\n', i, v.w, v.h.join(','));
            fs.appendFileSync(self.output, outputLine);
            self.writtenTo++;
        }
    }

    var sortedStates = [];
    for (var s in states) {
        var item = states[s];
        item.s = s;
        item.p = Math.round(100 * (item.c / self.vocabCount));
        sortedStates.push(item);
    }
    sortedStates = sortedStates.sort(function (a, b) {
        return b.c - a.c;
    });

    self.distribution.sortedStates = sortedStates;

    if (self.outputDist) {
        var output = "";
        output += util.format('Total Vocabulary: %s\n', self.distribution.vocabCount);
        output += util.format('Unambiguous: %s %s%\n', self.distribution.uniState, self.distribution.uniStatePercent);
        output += util.format('Dual: %s %s%\n', self.distribution.biState, self.distribution.biStatePercent);
        output += util.format('Tri: %s %s%\n', self.distribution.triState, self.distribution.triStatePercent);
        output += util.format('Quad: %s %s%\n', self.distribution.quadState, self.distribution.quadStatePercent);
        output += util.format('+4: %s %s%\n\n', self.distribution.plusState, self.distribution.plusStatePercent);
        output += "# The following displays the order of frequency and distribution\n";
        output += "# for all the mapped states for the given language {" + self.lang + "}\n\n";
        for (var i = 0; i < sortedStates.length; i++) {
            var state = sortedStates[i];
            output += util.format('%s\t%s\t%s\t%s%\n', state.i, state.s, state.c, state.p);
        }
        output += util.format("%s\t%s\t%s\t%s\n", 11, ".", "X", "X%");
        fs.writeFileSync(self.outputDist, output);
    }


    return self.distribution;
};

WiktionaryParser.prototype.printStates = function (dist) {
    console.log(distribution.sortedStates);
    var format = 'Total: %s, 1: %s (%s%), 2: %s (%s%), 3: %s (%s%), 4: %s (%s%), +4: %s (%s%)';
    var log = util.format(format, dist.vocabCount,
            dist.uniState, dist.uniStatePercent,
            dist.biState, dist.biStatePercent,
            dist.triState, dist.triStatePercent,
            dist.quadState, dist.quadStatePercent,
            dist.plusState, dist.plusStatePercent);
    console.log(log);
};

module.exports = WiktionaryParser;
