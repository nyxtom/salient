
var redis = require("redis");
var Glossary = require("./../glossary/glossary"),
    object = require("./../object"),
    async = require('async');

// Default options for the document graph
var defaultOptions = {
    redisPort: 6379,
    redisHost: "localhost",
    redisDb: 0,
    docPrefix: "doc",
    separator: ":" 
};

var TOTAL = "t";
var NEXT = "<-next";
var WEIGHT = "w";

// DocumentGraph represents a client for processing documents 
// in order to process document text in order to build a graph of 
// connections between document ids, text, parts of speech context 
// and the language as it is presented through the data.
function DocumentGraph(options) {
    this.options = object.extend(defaultOptions, options || {});
    this._gloss = new Glossary();
    this._redisClient = redis.createClient(this.options.redisPort, this.options.redisHost);
    this._redisClient.select(this.options.redisDb);
};

DocumentGraph.prototype._fmt = function() {
    var args = [];
    for (var i in arguments) {
        if (arguments[i] && arguments[i].tag) {
            args.push(arguments[i].tag.toLowerCase());
            args.push(arguments[i].distinct || arguments[i].term.toLowerCase());
        } else if (arguments[i] && arguments[i].length && arguments[i].length > 0) {
            args.push(arguments[i]);
        }
    }
    return args.join(this.options.separator);
};

// _incrEdges will increment the total number on the given key, followed by 
// adding/updating the edge weight between the id <-> key. If there is a previous 
// key node present, then we will update/add the edge between the previous key 
// and the newly provided present key, followed by returning the new key.
DocumentGraph.prototype._incrEdges = function (id, key, prevKey) {
    // increment total frequency on the key
    this._redisClient.incrby(this._fmt(TOTAL, key), 1);
    
    // increment/add an edge: id -> key
    // increment/add an edge: id <- key
    this._redisClient.zincrby(id, 1, key);
    this._redisClient.zincrby(key, 1, id);

    // increment/add edge from prevKey -> key (directed edge)
    if (prevKey) {
        this._redisClient.zincrby(this._fmt(NEXT, prevKey), 1, key);
    }

    return key;
};

// readDocument will parse the text, tokenize, and tag it to build a 
// directed and undirected graph of the given document id to various 
// directed nodes that form the structure of the document text. Edge 
// weights are determined by a simple frequency scalar.
DocumentGraph.prototype.readDocument = function (id, text) {
    // increment the total number of documents found
    this._redisClient.incrby(this._fmt(TOTAL, this.options.docPrefix), 1);

    // parse the text (tokenize, tag..etc)
    this._gloss.parse(text);
    var current = this._gloss.root;
    var prev = null;
    do {
        var s = current.toJSON();
        if (!s.children && !s.orig) {
            // increment total and add/incr bidirectional edges for current node
            prev = this._incrEdges(id, this._fmt(s), prev);
        } else {
            if (s.orig && s.children) {
                // increment total and add bidirectional edge weight for original node
                prev = this._incrEdges(id, this._fmt(s.orig), prev);

                for (var i = 0; i < s.children.length; i++) {
                    // increment total and add/incr bidirectional edges on child
                    prev = this._incrEdges(id, this._fmt(s.children[i]), prev);
                }
            }
        }

        current = current.next;
    } while (current);
};

// _computeWeights will ensure that all provided terms have their tfidf computed 
// with respect to the given document identifier before returning to callback.
DocumentGraph.prototype._computeWeights = function (id, terms, callback) {
    // compute the tfidf for all terms in this document
    var self = this;
    async.every(terms, function (item, cb) {
        self.TFIDF(id, item, function (err, result) {
            if (err) {
                cb(false);
            } else {
                self._redisClient.zadd(self._fmt(WEIGHT, id), result.tfidf, item, function (err, success) {
                    cb(success);
                });
            }
        });
    }, callback);
};

// Ensures that all terms in the given document id are indexed and computed for tfidf
DocumentGraph.prototype._indexWeightsById = function (id, callback) {
    var self = this;
    this._redisClient.zrange(id, 0, -1, function (err, results) {
        if (!results) {
            callback(false);
            return;
        }

        self._computeWeights(id, results, callback);
    });
};

// Measures the cosine similarity between two different documents by 
// looking up all the features that represent a given document id, 
// and for each edge, we will compute them as weighted features.
DocumentGraph.prototype.CosineSimilarity = function (id1, id2, callback) {
    var self = this;
    var id1_scores = {};
    var id2_scores = {};
    var ids = [];
    self._redisClient.zrange(this._fmt(WEIGHT, id1), 0, -1, 'WITHSCORES', function (err, id1_results) {
        if (err) {
            callback(err, null);
            return;
        }

        self._redisClient.zrange(self._fmt(WEIGHT, id2), 0, -1, 'WITHSCORES', function (err, id2_results) {
            if (err) {
                callback(err, null);
                return;
            }

            var id1_sum = 0;
            while (id1_results.length) {
                var id = id1_results.shift();
                var score = parseInt(id1_results.shift());
                id1_scores[id] = score;
                if (ids.indexOf(id) < 0) {
                    ids.push(id);
                }

                id1_sum += (score * score);
            }

            var id2_sum = 0;
            while (id2_results.length) {
                var id = id2_results.shift();
                var score = parseInt(id2_results.shift());
                id2_scores[id] = score;
                if (ids.indexOf(id) < 0) {
                    ids.push(id);
                }

                id2_sum += (score * score);
            }

            var dotsum = 0;
            for (var i = 0; i < ids.length; i++) {
                var id = ids[i];
                if (id1_scores.hasOwnProperty(id) && id2_scores.hasOwnProperty(id)) {
                    dotsum += (id1_scores[id] * id2_scores[id]);
                }
            }

            var magnitude = (Math.sqrt(id1_sum) * Math.sqrt(id2_sum));
            var sim = dotsum / magnitude;
            callback(null, sim);
            return;
        });
    });
};

// TFIDF will return the term frequency - inverse-document frequency of the 
// given arguments. Should the document id be passed in as well, then we will get 
// the tf-idf relative to the given document. Otherwise, we will return the aggregate
// on the given term itself.
DocumentGraph.prototype.TFIDF = function (id, key, callback) {
    // Ensure that we can overload for ('text here', function (err, result)...)
    if (!callback && typeof text == 'function') {
        callback = text;
        text = id;
        id = undefined;
    }

    // Get the total frequency of the given term
    var totalDocKey = this._fmt(TOTAL, this.options.docPrefix);
    var totalKey = this._fmt(TOTAL, key);

    // Executes and handles results returned from the multi redis command below
    var execResults = function(err, results) {
        if (err) {
            callback(err);
            return;
        }
        
        var keyFrequency = parseInt(results[0]);
        var docFrequency = parseInt(results[1]);
        var keyDocFrequency = results[2];

        // ensure that key frequency is relative to the given document (when appropriate)
        if (id && results.length == 4) {
            keyFrequency = parseInt(results[3]);
        }
        var tf = 1 + (Math.log(keyFrequency) / Math.LN10);
        var idf = Math.log(docFrequency / keyDocFrequency) / Math.LN10;

        var result = {};
        result.key = key;
        result.rawtf = keyFrequency;
        result.df = keyDocFrequency;
        result.n = docFrequency;
        result.idf = idf;
        result.tf = tf;
        result.tfidf = tf * idf;
        callback(null, result);
    };

    if (id) {
        this._redisClient.multi()
            .get(totalKey).get(totalDocKey).zcard(key).zscore(id, key)
            .exec(execResults);
    } else {
        this._redisClient.multi()
            .get(totalKey).get(totalDocKey).zcard(key)
            .exec(execResults);
    }
};

module.exports = DocumentGraph;
