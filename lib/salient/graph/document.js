
var redis = require("redis"),
    RedisStream = require('redis-stream'),
    RedisCluster = require('node-redis-cluster').RedisCluster;

var Glossary = require("./../glossary/glossary"),
    object = require("./../object"),
    async = require('async'),
    _ = require('underscore')._;

// Default options for the document graph
var defaultOptions = {
    redisPort: 6379,
    redisHost: "0.0.0.0",
    redisDb: 0,
    nsPrefix: "",
    separator: ":",
    searchLimit: 100
};

var TERMS = "terms";
var CONTENT = "content";
var TITLE = "title";
var LINK = "href";
var CATEGORY = "category";

var TOTAL = "+";
var WEIGHT = "w";

var TERM_CONTEXT = "tctx";
var TERM_DOC = "td";
var DOC_TERM = "d";
var DOC_SIM = "dsim";
var SEARCH = "search";

var CATEGORY_TERM = "cgt";
var CATEGORY_DOC = "cgd";
var TERM_CATEGORY = "tcg";
var DOC_CATEGORY = "dcg";

// DocumentGraph represents a client for processing documents 
// in order to process document text in order to build a graph of 
// connections between document ids, text, parts of speech context 
// and the language as it is presented through the data.
function DocumentGraph(options) {
    this.options = object.extend(defaultOptions, options || {});
    this._gloss = new Glossary();
    
    // Parse redis cluster configuration in the form of:
    // "host:port,host:port,host:port"
    if (this.options.redisCluster) {
        var addresses = this.options.redisCluster.split(',');
        var config = [];
        for (var i = 0; i < addresses.length; i++) {
            var items = addresses[i].split(':');
            var host = "0.0.0.0";
            var port = 6379;
            if (items.length == 1) {
                port = parseInt(items[0]);
            } else {
                if (items[0].length > 0) {
                    host = items[0];
                }
                port = parseInt(items[1]);
            }
            config.push({ port: port, host: host });
        }
        this._redisCluster = RedisCluster.create(config, { return_buffers: true });
    } else {
        this._redisClient = redis.createClient(this.options.redisPort, this.options.redisHost, { return_buffers: true });
        this._redisClient.select(this.options.redisDb);
        this._redisStream = RedisStream(this.options.redisPort, this.options.redisHost, this.options.redisDb);
    }

    this._k_Total = this._fmt(TOTAL);
    this._k_TotalTerms = this._fmt(TOTAL, TERMS);
};

DocumentGraph.prototype._fmt = function() {
    var args = [];
    if (this.options.nsPrefix.length > 0) {
        args.push(this.options.nsPrefix);
    }
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

DocumentGraph.prototype._fmtNode = function (node) {
    var args = [];
    if (node.tag) {
        args.push(node.tag.toLowerCase());
        args.push(node.distinct || node.term.toLowerCase());
    }
    return args.join(this.options.separator);
};

DocumentGraph.prototype._client = function (key) {
    return this._multi || this._redisClient || this._redisCluster.getRedis(key);
};

// _incrEdges will increment the total number on the given key, followed by 
// adding/updating the edge weight between the id <-> key. If there is a previous 
// key node present, then we will update/add the edge between the previous key 
// and the newly provided present key, followed by returning the new key.
DocumentGraph.prototype._incrEdges = function (id, key, prevKey, weight, categories) {
    // increment total frequency on the key
    var k_TotalKey = this._fmt(TOTAL, key);
    var k_TotalTerms = this._k_TotalTerms;

    if (!this._redisCluster && !this._multi) {
        this._multi = this._redisClient.multi();
    }

    this._client(k_TotalKey).incrby(k_TotalKey, weight);
    this._client(k_TotalTerms).incrby(k_TotalTerms, weight);

    // increment/add an edge: id -> key
    // increment/add an edge: id <- key
    var k_DocTermId = this._fmt(DOC_TERM, id);
    var k_TermDocKey = this._fmt(TERM_DOC, key);
    this._client(k_DocTermId).zincrby(k_DocTermId, weight, key);
    this._client(k_TermDocKey).zincrby(k_TermDocKey, weight, id);

    // increment/add an edge for all categories -> key
    // increment/add an edge for all categories <- key
    // increment/add an edge for all categories -> id
    // increment/add an edge for all categories <- id
    if (categories) {
        for (var c in categories) {
            if (c && c.length > 0) {
                var k_CategoryTermC = this._fmt(CATEGORY_TERM, c);
                var k_TermCategoryKey = this._fmt(TERM_CATEGORY, key);
                var k_DocCategoryId = this._fmt(DOC_CATEGORY, id);
                var k_CategoryDocC = this._fmt(CATEGORY_DOC, c);

                this._client(k_CategoryTermC).zincrby(k_CategoryTermC, categories[c], key);
                this._client(k_TermCategoryKey).zincrby(k_TermCategoryKey, categories[c], c);
                this._client(k_DocCategoryId).zincrby(k_DocCategoryId, categories[c], c);
                this._client(k_CategoryDocC).zincrby(k_CategoryDocC, categories[c], id);
            }
        }
    }

    // increment/add edges for co-occurance between terms
    // increment/add an edge for context: context:prevKey -> key
    // increment/add an edge for current: context:prevKey <- key
    if (prevKey) {
        var k_TermContextPrevKey = this._fmt(TERM_CONTEXT, prevKey);
        var k_TermContextKey = this._fmt(TERM_CONTEXT, key);
        this._client(k_TermContextPrevKey).zincrby(k_TermContextPrevKey, weight, key);
        this._client(k_TermContextKey).zincrby(k_TermContextKey, weight, prevKey);
    }

    return key;
};

// Search will look up the given terms in the graph to find the 
// most relevant documents associated with the given terms using 
// the tfidf scores as a measurement.
DocumentGraph.prototype.search = function (terms, callback, options) {
    var self = this;
    var options = options || {};
    options.searchLimit = options.searchLimit || this.options.searchLimit;
    async.map(terms, function (term, cb) {
        if (term.indexOf(':') < 0) {
            var prefix = self._fmt(TERM_DOC, "*");
            var k = prefix + self.options.separator + term;
            if (self._redisCluster) {
                self._redisCluster.execAll('keys', [k], function (err, clusterResults) {
                    var reducedTerms = [];
                    for (var c in clusterResults) {
                        var keys = clusterResults[c];
                        for (var i = 0; i < keys.length; i++) {
                            reducedTerms.push(keys[i].slice(prefix.length - 1, keys[i].length));
                        }
                    }

                    cb(null, reducedTerms);
                });
            } else {
                self._client(k).keys(k, function (err, keys) {
                    var reducedTerms = [];
                    for (var i = 0; i < keys.length; i++) {
                        reducedTerms.push(keys[i].slice(prefix.length - 1, keys[i].length));
                    }

                    cb(null, reducedTerms);
                });
            }
        } else {
            cb(null, term);
        }
    }, function (err, termResults) {
        terms = _.flatten(termResults);
        var outKey = self._fmt('search', terms.join('_'));
        var args = [outKey, terms.length]; 
        for (var i = 0; i < terms.length; i++) {
            args.push(self._fmt(WEIGHT, terms[i]));
        }
        args.push('AGGREGATE');
        args.push('SUM');
        var selectResults = function (primaryClient) {
            primaryClient.zcard(outKey, function (err, cardResult) {
                if (err) {
                    callback(err);
                } else {
                    primaryClient.zrevrange(outKey, 0, options.searchLimit, 'WITHSCORES', function (err, results) {
                        if (err) {
                            callback(err);
                            return;
                        }

                        var scores = {};
                        var ids = [];
                        while (results.length) {
                            var docId = results.shift();
                            var docTermWeight = parseFloat(results.shift(), 10);
                            if (!scores.hasOwnProperty(docId)) {
                                scores[docId] = 0;
                                ids.push(docId);
                            }
                            scores[docId] += docTermWeight;
                        }
                        ids = ids.sort(function (a, b) { return scores[b] - scores[a] });
                        callback(null, [ids,scores,cardResult]);
                    });
                }
            });
        };

        var primaryClient = self._client(args[2]);
        primaryClient.exists(outKey, function (err, existsResult) {
            if (err) {
                callback(err);
            } else if (existsResult == 1) {
                selectResults(primaryClient);
            } else {
                // handle clustered zunions through the use of copy and migration
                if (self._redisCluster) {
                    var clients = [];
                    for (var i = 2; i < args.length - 2; i++) {
                        var c = self._client(args[i]);
                        clients.push([c, args[i], i]);
                    }

                    // determine the best migration path
                    async.map(clients, function (item, cb) {
                        item[0].zcard(item[1], function (err, reply) { 
                            if (reply == 0 || err) {
                                cb(err, null);
                            } else {
                                cb(err, [item[1], reply]); 
                            }
                        });
                    }, function (err, results) {
                        if (err) {
                            callback(err);
                        } else {
                            results = results.filter(function (a) { 
                                if (a == null) {
                                    return false;
                                } else {
                                    return true;
                                }
                            });

                            if (results.length == 0) {
                                callback(false);
                                return;
                            }

                            var delKeys = [];
                            async.every(results, function (item, cb) {
                                var arg = item[0];
                                var c = self._client(arg);
                                if (c != primaryClient) {
                                    // perform the dump and restore
                                    c.dump(arg, function (err, reply) {
                                        if (err) {
                                            cb(false);
                                        }
                                        else if (reply) {
                                            primaryClient.restore(arg, 0, reply, function (err, result) {
                                                if (err) {
                                                    cb(false);
                                                } else {
                                                    delKeys.push(arg);
                                                    cb(true);
                                                }
                                            });
                                        } else {
                                            cb(true);
                                        }
                                    });
                                } else {
                                    cb(true);
                                }
                            }, function (success) {
                                if (success) {
                                    primaryClient.zunionstore(args, function (err, results) {
                                        if (err) {
                                            callback(err);
                                        } else {
                                            for (var i = 0; i < delKeys.length; i++) {
                                                primaryClient.del(delKeys[i]);
                                            }
                                            selectResults(primaryClient);
                                        }
                                    });
                                } else {
                                    callback(success);
                                }
                            });
                        }
                    });
                }
                else {
                    var client = self._client(args[0]);
                    client.zunionstore(args, function (err, result) {
                        if (err) {
                            callback(err);
                        } else {
                            selectResults(client);
                        }
                    });
                }
            }
        });
    });
};

DocumentGraph.prototype.getContents = function (ids, callback) {
    var formattedIds = [];
    for (var i = 0; i < ids.length; i++) {
        formattedIds.push(this._fmt(CONTENT, ids[i]));
        formattedIds.push(this._fmt(TITLE, ids[i]));
        formattedIds.push(this._fmt(LINK, ids[i]));
    }

    if (this._redisCluster) {
        this._redisCluster.execMany('get', formattedIds, function (err, results) {
            if (err) {
                callback(err);
            } else {
                var r = [];
                while (formattedIds.length) {
                    r.push(results[formattedIds.shift()].toString());
                    r.push(results[formattedIds.shift()].toString());
                    r.push(results[formattedIds.shift()].toString());
                }
                callback(null, r);
            }
        });
    } else {
        this._redisClient.mget(formattedIds, callback);
    }
};

// readDocument will parse the text, tokenize, and tag it to build a 
// directed and undirected graph of the given document id to various 
// directed nodes that form the structure of the document text. Edge 
// weights are determined by a simple frequency scalar.
DocumentGraph.prototype.readDocument = function (id, text, title, link, categories, next) {
    // increment the total number of documents found
    this._client(this._k_Total).incrby(this._k_Total, 1);

    // set the content of this document in redis so we can get it later
    var k_ContentId = this._fmt(CONTENT, id);
    this._client(k_ContentId).set(k_ContentId, text);

    // set the title and link if they exist
    if (title) {
        var k_TitleId = this._fmt(TITLE, id);
        this._client(k_TitleId).set(k_TitleId, title);
    }
    if (link) {
        var k_LinkId = this._fmt(LINK, id);
        this._client(k_LinkId).set(k_LinkId, link);
    }

    // parse the text (tokenize, tag..etc)
    var parseLoop = function (obj, contents, weight, categoryWeights) {
        obj._gloss.parse(contents);
        var current = obj._gloss.root;
        var prev = null;
        do {
            var s = current.toJSON();
            if (!s.children && !s.orig && !s.isFiltered) {
                // increment total and add/incr bidirectional edges for current node
                prev = obj._incrEdges(id, obj._fmtNode(s), prev, weight, categoryWeights);
            } else if (!s.isFiltered) {
                if (s.orig && s.children) {
                    // increment total and add bidirectional edge weight for original node
                    if (!s.orig.isFiltered) {
                        prev = obj._incrEdges(id, obj._fmtNode(s.orig), prev, weight, categoryWeights);
                    }

                    for (var i = 0; i < s.children.length; i++) {
                        // increment total and add/incr bidirectional edges on child
                        if (!s.children[i].isFiltered) {
                            prev = obj._incrEdges(id, obj._fmtNode(s.children[i]), prev, weight, categoryWeights);
                        }
                    }
                }
            }

            current = current.next;
        } while (current);
    };

    var categoryWeights = {};
    if (categories) {
        var prev = null;
        for (var i = 0; i < categories.length; i++) {
            var category = categories[i];
            if (category && category.length > 0) {
                category = category.toLowerCase();
                category = category.replace(/'s/g, "s").replace(/\s+/g, "_");
                categoryWeights[category] = 1;
            }
        }
    }
    if (title) {
        parseLoop(this, title, title && text ? 10 : 2, categoryWeights);
    }
    if (text) {
        parseLoop(this, text, 1, categoryWeights);
    }

    if (this._multi) {
        this._multi.exec();
        delete this._multi;
    }
};

DocumentGraph.prototype._computeTermWeights = function (ids, term, callback) {
    var self = this;
    async.every(ids, function (id, cb) {
        self._computeWeights(id, [term], cb);
    }, callback);
};

// _computeWeights will ensure that all provided terms have their tfidf computed 
// with respect to the given document identifier before returning to callback.
DocumentGraph.prototype._computeWeights = function (id, terms, callback) {
    // compute the tfidf for all terms in this document
    var self = this;
    var k_WeightId = self._fmt(WEIGHT, id);
    var rClient = self._client(k_WeightId);
    async.every(terms, function (term, cb) {
        self.TFIDF(id, term, function (err, result) {
            if (err) {
                cb(false);
            } else {
                var k_WeightTerm = self._fmt(WEIGHT, term);
                var r2Client = self._client(k_WeightTerm);
                rClient.zadd(k_WeightId, result.tfidf, term, function (err, success) {
                    r2Client.zadd(k_WeightTerm, result.tfidf, id, function (err, success) {
                        cb(success);
                    });
                });
            }
        });
    }, callback);
};

// Ensures that all documents in the database are indexed for tfidf weights
DocumentGraph.prototype.indexAllWeights = function (progress, callback) {
    var self = this;
    var k_DocTermStar = this._fmt(DOC_TERM, "*");
    var handleResults = function (err, keys) {
        var iter = 0;
        async.eachLimit(keys, 8, function (item, cb) {
            var id = item.slice((self._fmt(DOC_TERM) + ":").length, item.length);
            self.indexWeights(id, function (success) {
                iter++;
                progress({ total: keys.length, count: iter, percent: Math.round((iter / keys.length) * 100.0) });
                cb(null);
            });
        }, function () {
            callback({total: keys.length, count: iter});
        });
    }

    if (this._redisCluster) {
        this._redisCluster.execAll('keys', [k_DocTermStar], function (err, clusterResults) {
            var keys = [];
            if (clusterResults) {
                for (var c in clusterResults) {
                    var ckeys = clusterResults[c];
                    for (var i = 0; i < ckeys.length; i++) {
                        keys.push(ckeys[i]);
                    }
                }
            }

            handleResults(err, keys);
        });
    } else {
        this._client(k_DocTermStar).keys(k_DocTermStar, handleResults);
    }
};

DocumentGraph.prototype.indexSimilarDocuments = function (threshold, progress, callback) {
    var self = this;
    var k_DocTermStar = this._fmt(DOC_TERM, "*");
    var handleResults = function (err, keys) {
        var lengthSlice = self._fmt(DOC_TERM).length + 1;
        var iter = 0;
        var total = keys.length * keys.length;
        async.eachLimit(keys, 8, function (idi, cbi) {
            var docid1 = idi.slice(lengthSlice, idi.length);
            var docidResults = [self._fmt(DOC_SIM, docid1)];
            async.eachLimit(keys, 8, function (idk, cbk) {
                iter++;
                var docid2 = idk.slice(lengthSlice, idk.length);
                if (docid1 == docid2) {
                    cbk();
                } else {
                    self.CosineSimilarity(docid1, docid2, function (err, distance) {
                        progress({ total: total, count: iter, percent: Math.round((iter / total) * 100.0) });
                        if (distance > threshold) {
                            self._redisClient.zadd(self._fmt(DOC_SIM, docid1), distance, docid2, function () {
                                cbk();
                            });
                        } else {
                            cbk();
                        }
                    });
                }
            }, function (err) {
                cbi();
            });
        }, function (err) {
            callback({ total: total, count: iter });
        });
    };

    if (this._redisCluster) {
        this._redisCluster.execAll('keys', [k_DocTermStar], function (err, clusterResults) {
            var keys = [];
            if (clusterResults) {
                for (var c in clusterResults) {
                    var ckeys = clusterResults[c];
                    for (var i = 0; i < ckeys.length; i++) {
                        keys.push(ckeys[i]);
                    }
                }
            }

            handleResults(err, keys);
        });
    } else {
        this._client(k_DocTermStar).keys(k_DocTermStar, handleResults);
    }
};

// Ensures that all terms in the given document id are indexed and computed for tfidf
DocumentGraph.prototype.indexWeights = function (id, callback) {
    var self = this;
    var k_DocTermId = this._fmt(DOC_TERM, id);
    this._client(k_DocTermId).zrevrange(k_DocTermId, 0, -1, function (err, keys) {
        if (!keys) {
            callback(false);
            return;
        }

        self._computeWeights(id, keys, callback);
    });
};

DocumentGraph.prototype._isIdFiltered = function (filterPrefixes, id) {
    var isFiltered = false;
    if (filterPrefixes && filterPrefixes.length > 0) {
        isFiltered = true;
        for (var i = 0; i < filterPrefixes.length; i++) {
            var prefix = filterPrefixes[i];
            if (id.indexOf(prefix) >= 0) {
                isFiltered = false;
                break;
            }
        }
    }
    return isFiltered;
};

DocumentGraph.prototype._cosineFilter = function (prefix, filterPrefixes, id1, id2, callback) {
    var self = this;
    var id1_scores = {};
    var id2_scores = {};
    var ids = [];
    var k_PrefixId1 = self._fmt(prefix, id1);
    var k_PrefixId2 = self._fmt(prefix, id2);
    self._client(k_PrefixId1).zrevrange(k_PrefixId1, 0, -1, 'WITHSCORES', function (err, id1_results) {
        if (err) {
            callback(err, null);
            return;
        }

        self._client(k_PrefixId2).zrevrange(k_PrefixId2, 0, -1, 'WITHSCORES', function (err, id2_results) {
            if (err) {
                callback(err, null);
                return;
            }

            var id1_sum = 0;
            while (id1_results.length) {
                var id = id1_results.shift().toString();
                var score = parseInt(id1_results.shift());
                if (prefix == TERM_CONTEXT && self._totalTerms) {
                    score = (score / self._totalTerms);
                }
                if (!self._isIdFiltered(filterPrefixes, id)) {
                    id1_scores[id] = score;
                    if (ids.indexOf(id) < 0) {
                        ids.push(id);
                    }

                    id1_sum += (score * score);
                }
            }

            var id2_sum = 0;
            while (id2_results.length) {
                var id = id2_results.shift().toString();
                var score = parseInt(id2_results.shift());
                if (prefix == TERM_CONTEXT && self._totalTerms) {
                    score = (score / self._totalTerms);
                }
                if (!self._isIdFiltered(filterPrefixes, id)) {
                    id2_scores[id] = score;
                    if (ids.indexOf(id) < 0) {
                        ids.push(id);
                    }

                    id2_sum += (score * score);
                }
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

// Measures the cosine similarity between two different documents by 
// looking up all the features (concepts only) of a given document id, 
// and for each edge, we will compute them as weighted features.
DocumentGraph.prototype.CosineConceptSimilarity = function (id1, id2, callback) {
    this._cosineFilter(WEIGHT, ['noun','adj','adv'], id1, id2, callback);
};

// Measures the cosine similarity between two different documents by 
// looking up all the features that represent a given document id, 
// and for each edge, we will compute them as weighted features.
DocumentGraph.prototype.CosineSimilarity = function (id1, id2, callback) {
    this._cosineFilter(WEIGHT, null, id1, id2, callback);
};

DocumentGraph.prototype.CosineContextSimilarity = function (term1, term2, callback) {
    if (!this._totalTerms) {
        var self = this;
        this._client(this._k_TotalTerms).get(this._k_TotalTerms, function (err, result) {
            if (err) {
                callback(err, null);
                return;
            }
            self._totalTerms = result;
            self._cosineFilter(TERM_CONTEXT, null, term1, term2, callback);
        });
    } else {
        this._cosineFilter(TERM_CONTEXT, null, term1, term2, callback);
    }
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
    var k_TotalKey = this._fmt(TOTAL, key);

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

    if (this._redisCluster) {
        var keys = [this._k_Total, k_TotalKey, this._fmt(TERM_DOC, key)];
        if (id) {
            keys.push(this._fmt(DOC_TERM, id));
        }

        // map the above keys to the various redis functions according to a clustered set of clients
        var maps = [];
        for (var i = 0; i < keys.length; i++) {
            var k = this._client(keys[i]);
            if (i == 0 || i == 1) {
                maps[i] = [k, 'get', [keys[i]]];
            } else if (i == 2) {
                maps[i] = [k, 'zcard', [keys[i]]];
            } else {
                maps[i] = [k, 'zscore', [keys[i], key]];
            }
        }

        // Perform the operation as a map-invoke operation set
        async.map(maps, function (item, clusterCallback) {
            item[0].send_command(item[1], item[2], clusterCallback);
        }, execResults);
    }
    else if (id) {
        this._redisClient.multi()
            .get(this._k_Total).get(k_TotalKey).zcard(this._fmt(TERM_DOC, key)).zscore(this._fmt(DOC_TERM, id), key)
            .exec(execResults);
    } else {
        this._redisClient.multi()
            .get(this._k_Total).get(k_TotalKey).zcard(this._fmt(TERM_DOC, key))
            .exec(execResults);
    }
};

module.exports = DocumentGraph;
