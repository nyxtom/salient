
var fs = require('fs'),
    readline = require('readline'),
    redis = require('redis'),
    async = require('async'),
    clc = require('cli-color'),
    os = require('os'),
    cluster = require('cluster'),
    spin = require('term-spinner');

var salient = require('./../');

var args = require('minimist')(process.argv);

function usage() {
    console.log("Usage: node graph.js --importcsv=true --redishost='localhost' --redisport=1337 --redisdb=0 --importcsv_id=3 --importcsv_title=2 --importcsv_text=-1 --importcsv_link=1 --importcsv_idprefix='doc' --importskip=1 --importlimit=0 ./products.csv");
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
if (args.rediscluster) {
    options.redisCluster = args.rediscluster;
}
if (args.nsprefix) {
    options.nsPrefix = args.nsprefix;
}

var startTime = new Date().getTime();

if (args.tfidf) {
    var id = args.docid;
    var key = "";
    var finalArgs = args._.slice(2);
    if (finalArgs.length == 0 && typeof args.tfidf == 'string') {
        key = args.tfidf;
    } else if (finalArgs.length > 0) {
        key = finalArgs[0];
    }

    var documentGraph = new salient.graph.DocumentGraph(options);
    documentGraph.TFIDF(id, key, function (err, result) {
        console.log(result);
        process.exit(0);
        return;
    });
}
else if (args.index && args.docid) {
    var documentGraph = new salient.graph.DocumentGraph(options);
    documentGraph.indexWeights(args.docid, function (success) {
        process.exit(0);
        return;
    });
}
else if (args.index) {
    var startTime = new Date().getTime();
    var threshold = 0.08;
    if (args.doc_threshold) {
        threshold = args.threshold;
    }

    var spinner = spin.new(spin.types.Box1);
    var interval = setInterval(function () {
        spinner.next();
    }, 1000);

    var progressPrint = function (progress) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write([spinner.current, "Indexing", progress.count, "of", progress.total, progress.percent, "%"].join(" "));
    };
    var progressComplete = function (progress) {
        var endTime = new Date().getTime();
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        clearInterval(interval);
        console.log("Indexed", progress.count, "in", (endTime - startTime) / 1000, "seconds");
        process.exit(0);
        return;
    };

    var documentGraph = new salient.graph.DocumentGraph(options);
    if (args.index == "doc_similar") {
        documentGraph.indexSimilarDocuments(threshold, progressPrint, progressComplete);
    } else {
        documentGraph.indexAllWeights(progressPrint, progressComplete);
    }
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
    var documentGraph = new salient.graph.DocumentGraph(options);
    documentGraph.search(searchTerms.toLowerCase().split(' '), function (err, results) {
        var endTime = new Date().getTime();
        var diff = (endTime - startTime) / 1000;
        var ids = [];
        var scores = [];
        var count = 0;
        if (results && results.length > 0) {
            ids = results.shift();
            scores = results.shift();
            count = results.shift();
            ids = ids.slice(0, limit);
        }

        console.log(clc.green.bold("Search returned:"), ids.length, "of", count, "results in", diff, "seconds");
        if (count > 0 && args.content) {
            documentGraph.getContents(ids, function (err, results) {
                var iter = 0;
                while (results && results.length) {
                    var content = results.shift();
                    var title = results.shift();
                    var link = results.shift();
                    console.log(clc.bold("-------------------------------------"));
                    if (title) {
                        console.log(clc.xterm(75).bold(title), clc.bold(scores[ids[iter]]), clc.xterm(100).bold('(id: ' + ids[iter] + ')'));
                    } else {
                        console.log(clc.xterm(75).bold(ids[iter]), clc.bold(scores[ids[iter]]), clc.xterm(100).bold('(id: ' + ids[iter] + ')'));
                    }
                    console.log(clc.bold("-------------------------------------"));
                    if (link) {
                        console.log(clc.xterm(75).bold(link));
                    } else {
                        console.log(clc.bold(ids[iter]));
                    }
                    console.log(content);
                    iter++;
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
    var documentGraph = new salient.graph.DocumentGraph(options);
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

    var numWorkers = os.cpus().length;
    if (typeof args.cluster == 'number') {
        numWorkers = args.cluster;
    } else if (!args.cluster) {
        numWorkers = 1;
    }
    if (cluster.isMaster) {
        var totalWorkers = numWorkers;
        var totalSpeed = 0;
        var workerState = {};
        var totalLines = 0;

        var startTime = new Date().getTime();
        var spinner = spin.new(spin.types.Box2);
        var updateState = function () {
            spinner.next();
            updateTotals();

            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            var prefix = clc.xterm(85).bold(spinner.current + " Processed ");
            var linePrefix = totalLines + " lines from ";
            var workerPrefix = clc.xterm(120).bold(totalWorkers + " workers ");
            var speedPrefix = "@ " + clc.xterm(40).bold(totalSpeed.toFixed(2) + "/sec");
            process.stdout.write(prefix + linePrefix + workerPrefix + speedPrefix);
        };

        var updateTotals = function () {
            var _totalSpeed = 0;
            var _totalLines = 0;
            for (var w in workerState) {
                if (workerState[w]) {
                    _totalLines += workerState[w].lines;
                    _totalSpeed += workerState[w].speed;
                }
            }
            totalSpeed = _totalSpeed;
            totalLines = _totalLines;
        };

        var interval = setInterval(updateState, 1000);
        var workers = {};
        for (var i = 0; i < numWorkers; i++) {
            var worker = cluster.fork();
            workers[worker.id] = worker;
            worker.on('message', function (msg) {
                workerState[this.id] = msg;
            });
        }

        cluster.on('exit', function (worker, code, signal) {
            if (workers.hasOwnProperty(worker.id)) {
                delete workers[worker.id];
                numWorkers--;
            }
            if (numWorkers == 0) {
                updateTotals();
                var endTime = new Date().getTime();
                var diff = (endTime - startTime) / 1000.0;
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                var prefix = clc.xterm(85).bold("✓ Processed ");
                var linePrefix = totalLines + " lines in ";
                var time = clc.xterm(40).bold(diff.toFixed(2) + " seconds\r\n");
                process.stdout.write(prefix + linePrefix + time);
                process.exit(0);
                return;
            }
        });
    } else {
        var affinity = 0;
        if (cluster.worker) {
            affinity = cluster.worker.id;
        }

        var lines = 0;
        var readLines = 0;
        var nextLine = affinity;
        var skipLines = args.importskip || 0;
        var limitLines = args.importlimit || 0;
        var maxLine = skipLines + limitLines;
        var time = new Date().getTime();
        var iterCount = 0;
        var speed = 0;
        var documentGraph = new salient.graph.DocumentGraph(options);
        var inputStream = fs.createReadStream(inputFile);
        var reader = readline.createInterface({ input: inputStream, terminal: false });
        var columns = 0;
        reader.on('line', function (line) {
            if (lines == 0) {
                columns = line.split(',').length;
                lines++;
                return;
            }

            // next line to read = lines + affinity
            if (cluster.worker && lines != nextLine) {
                lines++;
                return;
            }

            nextLine = lines + (affinity + numWorkers - 1);
            lines++;
            readLines++;
            if (readLines <= skipLines) {
                return;
            }
            if (limitLines > 0 && maxLine < readLines) {
                process.send({ 'speed': speed, 'lines': readLines - skipLines });
                reader.close();
                return;
            }

            var data = [];
            var index = -1;
            for (var i = 0; i < columns; i++) {
                var prevIndex = index + 1;
                index = line.indexOf(',', index+1);
                data.push(line.substring(prevIndex, index));
            }
            data.push(line.substring(index+1, line.length));

            var id = lines;
            var text = data[data.length - 1].trim();
            if (text.length > 0 && text[0] == '\"' && text[1] == '\"') {
                text = text.substring(1, text.length-1).trim();
            }

            var title = "";
            var link = "";
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

            if (args.importcsv_title) {
                if (Math.abs(args.importcsv_title) < data.length) {
                    if (args.importcsv_title < 0) {
                        title = data[data.length + args.importcsv_title].trim();
                    } else {
                        title = data[args.importcsv_title].trim();
                    }
                }
            }

            if (args.importcsv_link) {
                if (Math.abs(args.importcsv_link) < data.length) {
                    if (args.importcsv_link < 0) {
                        link = data[data.length + args.importcsv_link];
                    } else {
                        link = data[args.importcsv_link];
                    }
                }
            }

            var categories = [];
            if (args.importcsv_categories) {
                var cats = args.importcsv_categories.toString().split(',');
                for (var i = 0; i < cats.length; i++) {
                    var cat = parseInt(cats[i]);
                    if (cat < 0) {
                        categories.push(data[data.length + cat]);
                    } else {
                        categories.push(data[cat]);
                    }
                }
            }

            if (text.length == 0 && title.length == 0) {
                return;
            }

            // process the given document text according to the given id/text
            if (args.importcsv_idprefix) {
                id = args.importcsv_idprefix + id;
            }
            documentGraph.readDocument(id, text, title, link, categories);

            var newTime = new Date().getTime();
            iterCount++;
            if ((newTime - time) > 1000) {
                speed = Math.round(100 * (iterCount / ((newTime - time) / 1000))) / 100;
                iterCount = 0;
                time = newTime;
                process.send({ 'speed': speed, 'lines': readLines - 1 - skipLines });
            }
        });

        reader.on('close', function () {
            process.send({ 'speed': speed, 'lines': readLines - 1 - skipLines });
            process.exit(0);
            return;
        });
    }
}
else {
    return usage();
}
