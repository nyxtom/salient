var fs = require('fs'),
    readline = require('readline'),
    mongo = require('mongojs'),
    argv = require('optimist').argv;

var database = argv.database || "wordnet";
var host = argv.h || "localhost";
var username = argv.u || "";
var password = argv.p || "";
var collections = ["sentiword","synsets"];

var connection = host + "/" + database;
if (username && password) {
    connection = username + ":" + password + "@" + connection;
}

// Setup the mongo connection db
var db = mongo(connection, collections);

var rd = readline.createInterface({
    input: fs.createReadStream('./sentiwordnet-3.0.txt'),
    ouput: process.stdout,
    terminal: false
});

function Word(pos, id, posScore, negScore, synsets, gloss) {
    this._id = pos + id;
    this.pos = pos;
    this.posScore = posScore;
    this.negScore = negScore;
    this.sysnsets = synsets;
    this.gloss = gloss;
};

function Synset(synset, pos, posScore, negScore) {
    this._id = synset + '#' + pos;
    this.word = synset;
    this.posScore = posScore;
    this.negScore = negScore;
    this.score = posScore + negScore;
}

var words = [];
function init() {
    rd.on('line', function (line) {
        if (line.indexOf('#') != 0) {
            var items = line.split('\t');
            var pos = items[0];
            var id = items[1];
            var posScore = parseFloat(items[2]);
            var negScore = parseFloat(items[3]) * -1;
            var synsets = items[4].split(' ');
            var gloss = items[5];
            var word = new Word(pos, id, posScore, negScore, synsets, gloss);
            db.sentiword.save(word);
            for (var s = 0; s < synsets.length; s++) {
                var synset = synsets[s];
                var synsplit = synset.split('#');
                var text = synsplit[0];
                db.synsets.update({"_id":text + "#" + pos}, {"$inc":{"posScore":posScore, "negScore":negScore, "score":posScore + negScore}}, {upsert: true});
            }
        }
    });
    rd.on('close', function () {
        process.exit(0);
    });
};

init();
