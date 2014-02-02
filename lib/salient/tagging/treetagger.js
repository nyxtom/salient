
var PartOfSpeechTagger = require('./partofspeech_tagger'),
    Mapping = require('./../corpus/mapping');
var util = require('util'),
    path = require('path'),
    fs = require('fs');
var tt = require('treetagger');

var TreeTagger = function (options) {
    this.options = options || {};
    this.tagger = new tt(this.options);
    this.mapUniversal = this.options.hasOwnProperty('mapUniversal') ? this.options.mapUniversal : true;
    this.mapping = Mapping.load(path.join(__dirname, '../corpus/universal_tagset/en-ptb.map'));
};

util.inherits(TreeTagger, PartOfSpeechTagger);

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
