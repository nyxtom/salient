
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
    this.mapFile = path.join(__dirname, this.lang + '.wik.map');
    this.verbose = this.options.verbose || false;
    this.output = this.options.output || path.join(__dirname, util.format('%s.wik.vocab', this.lang));
    this.outputDist = this.options.outputDist || path.join(__dirname, util.format('%s.wik.dist', this.lang));
};

util.inherits(WiktionaryParser, events.EventEmitter);

WiktionaryParser.prototype.buildMap = function () {
    if (this.mapping) {
        return this.mapping;
    }

    this.mapping = {};
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

    return this.mapping;
};

WiktionaryParser.prototype.parse = function () {
    var self = this;
    var mappings = this.buildMap();
    var stream = fs.createReadStream(this.file);
    var vocab = {};
    var items = 0;
    var states = {};
    var stateIndex = 0;
    var xml = new XmlStream(stream);
    var pattern = /^=+\s*\{*([^=\[\]\{\}]*)\}*\s*=+/;
    var outputFile = fs.createWriteStream(this.output, { 'flags': 'a' });
    xml.on('updateElement: page', function (item) {
        if (item.ns == "0") { // main namespace
            var title = item.title; // word token
            var content = item.revision.text['$text'];
            var id = item.id;
            var headers = [];
            var lines = content.split('\n');
            for (var i = 0; i < lines.length; i++) {
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
                    if (typeof mappings[currentState] != 'undefined') {
                        var stateMap = mappings[currentState];
                        for (var s = 0; s < stateMap.length; s++) {
                            var state = stateMap[s];
                            if (typeof states[state] == 'undefined') {
                                states[state] = {};
                                states[state].c = 0;
                                states[state].i = stateIndex++;
                                states[state].s = state;
                            }
                            if (headers.indexOf(states[state]) < 0)
                                headers.push(states[state]);
                        }
                    }
                }
            }
            if (headers.length > 0) {
                var h = [];
                for (var hIndex = 0; hIndex < headers.length; hIndex++) {
                    h.push(headers[hIndex].i);
                    states[headers[hIndex].s].c++;
                }
                var v = { i: id, w: title, h: h };
                vocab[id] = v;
                self.emit('vocab', v, content);
                var outputLine = util.format('%s\t%s\t%s\n', v.i, v.w, v.h.join(','));
                outputFile.write(outputLine);
            }
            items++;
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write('Processed ' + items + ' total pages.');
            if (items % 2000 == 0) { 
                var dist = self.dist(states, vocab);
                if (self.verbose) {
                    self.printStates(dist);
                }
            }
        }
    });
    xml.on('end', function () {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        var dist = self.dist(states, vocab);
        if (self.verbose) {
            self.printStates(dist);
        }
    });
};

WiktionaryParser.prototype.dist = function (states, vocab) {
    var self = this;

    var uniCount = 0;
    var biCount = 0;
    var triCount = 0;
    var quadCount = 0;
    var plusCount = 0;
    var count = 0;
    for (var id in vocab) {
        count++;
        var w = vocab[id]; 
        if (w.h.length == 1) {
            uniCount++;
        }
        else if (w.h.length == 2) {
            biCount++;
        }
        else if (w.h.length == 3) {
            triCount++;
        }
        else if (w.h.length == 4) {
            quadCount++;
        }
        else if (w.h.length > 4) {
            plusCount++;
        }
    }

    var sortedStates = [];
    for (var s in states) {
        var item = states[s];
        item.s = s;
        item.p = Math.round(100 * (item.c / count));
        sortedStates.push(item);
    }
    sortedStates = sortedStates.sort(function (a, b) { 
        return b.c - a.c;
    });

    var dist = {};
    dist.sortedStates = sortedStates;
    dist.vocabCount = count;

    dist.uniState = uniCount;
    dist.uniStatePercent = Math.round(100 * (uniCount / count));
    dist.biState = biCount;
    dist.biStatePercent = Math.round(100 * (biCount / count));
    dist.triState = triCount;
    dist.triStatePercent = Math.round(100 * (triCount / count));
    dist.quadState = quadCount;
    dist.quadStatePercent = Math.round(100 * (quadCount / count));
    dist.plusState = plusCount;
    dist.plusStatePercent = Math.round(100 * (plusCount / count));

    if (self.outputDist) {
        var output = "";
        output += util.format('Total Vocabulary: %s\n', dist.vocabCount);
        output += util.format('Unambiguous: %s %s%\n', dist.uniState, dist.uniStatePercent);
        output += util.format('Dual: %s %s%\n', dist.biState, dist.biStatePercent);
        output += util.format('Tri: %s %s%\n', dist.triState, dist.triStatePercent);
        output += util.format('Quad: %s %s%\n', dist.quadState, dist.quadStatePercent);
        output += util.format('+4: %s %s%\n\n', dist.plusState, dist.plusStatePercent);
        output += "# The following displays the order of frequency and distribution\n";
        output += "# for all the mapped states for the given language {" + self.lang + "}\n\n";
        for (var i = 0; i < sortedStates.length; i++) {
            var state = sortedStates[i];
            output += util.format('%s\t%s\t%s\t%s%\n', state.i, state.s, state.c, state.p);
        }
        fs.writeFile(self.outputDist, output);
    }

    return dist;
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
