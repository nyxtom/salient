
var fs = require('fs'),
    csv = require('csv'),
    redis = require('redis'),
    async = require('async');

var salient = require('./../');
var args = require('minimist')(process.argv);

if (args.help || args.h || !(args.importcsv || args.tfidf || args.cosine || args.index)) {
    console.log("Usage: node graph.js --importcsv=true --redishost='localhost' --redisport=1337 --redisdb=0 --docprefix='doc' --importcsv_id=3 --importcsv_text=-1 --importskip=1 ./products.csv");
    console.log("       node graph.js --tfidf=true --docid='LGN0833' 'NOUN:engineers'");
    console.log("       node graph.js --cosine=true --docid1='LGN0833' --docid2='LGN0832'");
    console.log("       node graph.js --index=true --docid='LGN0833'");
    console.log(args);
    return;
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
if (args.docprefix) {
    options.docPrefix = args.docprefix;
}

var lines = 0;
var skipLines = args.importskip || 1;
var startTime = new Date().getTime();
var documentGraph = new salient.graph.DocumentGraph(options);

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
    documentGraph._indexWeightsById(args.docid, function (success) {
        process.exit(0);
        return;
    });
}
else if (args.cosine && args.docid1 && args.docid2) {
    var id1 = args.docid1;
    var id2 = args.docid2;

    documentGraph._indexWeightsById(id1, function (success) {
        documentGraph._indexWeightsById(id2, function (success) {
            documentGraph.CosineSimilarity(id1, id2, function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(result);
                }
                process.exit(0);
                return;
            });
        });
    });

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

    var parser = csv.parse();
    parser.on('readable', function () {
        while (data = parser.read()) {
            lines++;
            if (lines <= skipLines) {
                continue;
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
            id = documentGraph._fmt(documentGraph.options.docPrefix, id);
            documentGraph.readDocument(id, text);

            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write("Processed " + lines + " lines...");
        }
    });

    parser.on('end', function () {
        var endTime = new Date().getTime();
        var diff = (endTime - startTime) / 1000.0;
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log('Processed ' + lines + ' lines in ' + diff + ' seconds');
        process.exit(0);
    });

    input.pipe(parser);
}
