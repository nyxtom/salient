
var fs = require('fs'),
    csv = require('csv'),
    redis = require('redis'),
    async = require('async'),
    clc = require('cli-color');

var salient = require('./../');
var args = require('minimist')(process.argv);

function usage() {
    console.log("Usage: node graph.js --importcsv=true --redishost='localhost' --redisport=1337 --redisdb=0 --importcsv_idprefix='doc' --importcsv_id=3 --importcsv_text=-1 --importskip=1 --importlimit=0 ./products.csv");
    console.log("       node graph.js --tfidf=true --docid='LGN0833' 'NOUN:engineers'");
    console.log("       node graph.js --compare --sim=cosine --docid1='LGN0833' --docid2='LGN0832'");
    console.log("       node graph.js --compare=doc_concepts --sim=cosine --docid1='LGN0833' --docid2='LGN0832'");
    console.log("       node graph.js --compare=terms --sim=cosine --docid1='noun:bike' --docid2='noun:helmet'");
    console.log("       node graph.js --index=true --docid='LGN0833'");
    console.log("       node graph.js --search=true 'NOUN:louis'");
    process.exit(0);
    return;
};

if (args.help || args.h || !(args.search || args.importcsv || args.tfidf || args.compare || args.index)) {
    return usage();
}

// Update options from the command line
var options = {};
if (args.redishost) {
    options.redisHost = args.redishost;
}
if (args.redisport) {
    options.redisPort = args.redisport;
}
if (args.redisdb) {
    options.redisDb = args.redisdb;
}
if (args.nsprefix) {
    options.nsPrefix = args.nsprefix;
}

var startTime = new Date().getTime();
var documentGraph = new salient.graph.DocumentGraph(options);
var sentimentAnalyser = new salient.sentiment.BayesSentimentAnalyser();

if (args.tfidf) {
    var id = args.docid;
    var key = "";
    var finalArgs = args._.slice(2);
    if (finalArgs.length == 0 && typeof args.tfidf == 'string') {
        key = args.tfidf;
    } else if (finalArgs.length > 0) {
        key = finalArgs[0];
    }

    documentGraph.TFIDF(id, key, function (err, result) {
        console.log(result);
        process.exit(0);
        return;
    });
}
else if (args.index && args.docid) {
    documentGraph.indexWeights(args.docid, function (success) {
        process.exit(0);
        return;
    });
}
else if (args.index) {
    var startTime = new Date().getTime();
    documentGraph.indexAllWeights(function (progress) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(["Indexing", progress.count, "of", progress.total, "documents,", progress.percent, "%"].join(" "));
    }, function (progress) {
        var endTime = new Date().getTime();
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log("Indexed", progress.count, "documents in", (endTime - startTime) / 1000, "seconds");
        process.exit(0);
        return;
    });
}
else if (args.search) {
    var searchTerms = "";
    var finalArgs = args._.slice(2);
    var limit = 10;
    if (args.searchlimit) {
        limit = args.searchlimit;
    }
    if (finalArgs.length == 0 && typeof args.search == 'string') {
        searchTerms = args.search;
    } else {
        searchTerms = finalArgs[0];
    }

    var startTime = new Date().getTime();
    var searchOptions = {};
    searchOptions.searchLimit = limit;
    documentGraph.search(searchTerms.toLowerCase().split(' '), function (err, results) {
        var endTime = new Date().getTime();
        var diff = (endTime - startTime) / 1000;
        var ids = results.shift();
        var scores = results.shift();
        var length = ids.length;
        ids = ids.slice(0, limit);
        console.log(clc.green.bold("Search returned:"), ids.length, "of", length, "results in", diff, "seconds");
        if (args.content) {
            documentGraph.getContents(ids, function (err, results) {
                for (var i = 0; i < ids.length; i++) {
                    console.log(clc.bold("-------------------------------------"));
                    console.log(clc.xterm(75).bold(ids[i]), clc.bold(scores[ids[i]]));
                    console.log(clc.bold("-------------------------------------"));
                    console.log(results[i]);
                }
                process.exit(0);
                return;
            });
        } else {
            for (var i = 0; i < ids.length; i++) {
                console.log(ids[i], scores[ids[i]]);
            }
            process.exit(0);
            return;
        }
    }, searchOptions);
}
else if (args.compare && args.docid1 && args.docid2) {
    var id1 = args.docid1;
    var id2 = args.docid2;

    var print = function (err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log(result);
        }
        process.exit(0);
        return;
    };
    if (args.compare == "terms") {
        documentGraph.CosineContextSimilarity(id1, id2, print);
    }
    else if (args.compare == "doc_concepts") {
        documentGraph.CosineConceptSimilarity(id1, id2, print);
    } else {
        documentGraph.CosineSimilarity(id1, id2, print);
    }
}
else if (args.importcsv) {
    var finalArgs = args._.slice(2);
    var inputFile = "";
    if (finalArgs.length == 0 && typeof args.importcsv == 'string') {
        inputFile = args.importcsv;
    } else if (finalArgs.length > 0) {
        inputFile = finalArgs[0];
    }
    if (inputFile.length == 0) {
        console.log("error: invalid input file specified");
        process.exit(0);
        return;
    }

    var input = fs.createReadStream(inputFile);

    var lines = 0;
    var skipLines = args.importskip || 1;
    var limitLines = args.importlimit || 0;
    var maxLine = skipLines + limitLines;
    var parser = csv.parse();
    parser.on('readable', function () {
        while (data = parser.read()) {
            lines++;
            if (lines <= skipLines) {
                continue;
            }
            if (limitLines > 0 && maxLine <= lines) {
                parser.emit('end');
                break;
            }
            var id = lines;
            var text = data[data.length - 1].trim();
            if (args.importcsv_id) {
                if (Math.abs(args.importcsv_id) < data.length) {
                    if (args.importcsv_id < 0) {
                        id = data[data.length + args.importcsv_id];
                    } else {
                        id = data[args.importcsv_id];
                    }
                }
            }

            if (args.importcsv_text) {
                if (Math.abs(args.importcsv_text) < data.length) {
                    if (args.importcsv_text < 0) {
                        text = data[data.length + args.importcsv_text];
                    } else {
                        id = data[args.importcsv_text];
                    }
                }
            }

            if (text.length == 0) {
                return;
            }

            // process the given document text according to the given id/text
            if (args.importcsv_idprefix) {
                id = args.importcsv_idprefix + id;
            }
            documentGraph.readDocument(id, text);

            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write("Processed " + (lines - skipLines) + " lines...");
        }
    });

    parser.on('end', function () {
        var endTime = new Date().getTime();
        var diff = (endTime - startTime) / 1000.0;
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log('Processed ' + (lines - skipLines) + ' lines in ' + diff + ' seconds');
        process.exit(0);
    });

    input.pipe(parser);
}
else {
    return usage();
}
