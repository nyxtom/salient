
var fs = require('fs'),
    csv = require('csv'),
    transform = require('stream-transform'),
    redis = require('redis'),
    async = require('async');

var salient = require('./../');
var args = require('minimist')(process.argv);

if (args.help || args.h || (args._.length <= 2 && !args.importcsv)) {
    console.log("Usage: node graph.js --redishost='localhost' --redisport=1337 --redisdb=0 --docprefix='doc' --importcsv --importcsv_id=3 --importcsv_text=-1 --importskip=1 ./products.csv");
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
if (args.importcsv) {
    var input = fs.createReadStream(args._.slice(2)[0]);

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
