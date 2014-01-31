
var PartOfSpeechTagger = require('./partofspeech_tagger');
var util = require('util'),
    path = require('path'),
    fs = require('fs');
var tt = require('treetagger');

var TreeTagger = function (options) {
    this.options = options || {};
    this.tagger = new tt(this.options);
    this.mapFile = path.join(__dirname, '../corpus/universal_tagset/en-ptb.map');
    this.mapUniversal = this.options.hasOwnProperty('mapUniversal') ? this.options.mapUniversal : true;
    this.loadMapping();
};

util.inherits(TreeTagger, PartOfSpeechTagger);

TreeTagger.prototype.loadMapping = function () {
    if (this.mapping) {
        return this.mapping;
    }

    this.mapping = {};
    var lines = fs.readFileSync(this.mapFile).toString().split('\n');
    for (var l = 0; l < lines.length; l++) {
        var line = lines[l];
        if (!line || line.trim().length == 0) {
            continue;
        }
        var items = line.split('\t');
        if (items.length != 2)
            continue;

        var btag = items[0];
        var utag = items[1];
        this.mapping[btag] = utag;
    }

    // add additional mappings for treetagger
    this.mapping['PP'] = 'ADP';
    this.mapping['PP$'] = 'ADP';
    this.mapping['NPS'] = 'PRON';
    
    return this.mapping;
};


/**
 * Prototype method for tagging a given string 
 * for parts of speech appropriately.
 */
TreeTagger.prototype.tag = function (tokens, callback) {
    var self = this;
    this.tagger.tag(tokens.join(' '), function (err, results) {
        var tags = [];
        if (results) {
            for (var i = 0; i < results.length; i++) {
                if (self.mapUniversal) {
                    if (!self.mapping[results[i].pos]) {
                        if (results[i].pos == 'SENT') {
                            tags.push('.');
                        }
                        else {
                            console.log(results[i]);
                        }
                    }
                    tags.push(self.mapping[results[i].pos]);
                }
                else {
                    tags.push(results[i].pos);
                }
            }
        }

        callback(err, tags);
    });
};

module.exports = TreeTagger;
