
var fs = require('fs'),
    path = require('path');

var JSONStream = require('JSONStream');
var salient = require('./../');

var args = require('minimist')(process.argv);
if (!args.sitemaps && !args.content && args._.length < 2) {
    console.log('Usage: node crawl.js --sitemaps=true --concurrency=2 --output=tmp.txt http://www.example.com/sitemap.xml');
    console.log('\t node crawl.js --content=true ./tmp.txt --delayms=500');
    console.log('\t node crawl.js --content=true --contentdir=./dump/ --delayms=500 --offset=1000 ./tmp.txt');
    console.log('\t node crawl.js --state=true ./state.crawl');
    return;
}


// Setup additional command line options
if (args.state) {
    var file = fs.readFileSync(args._.slice(2)[0]);
    var fileState = JSON.parse(file.toString());
    if (fileState.args) {
        args = fileState.args;
        if (fileState.index) {
            args.offset = fileState.index;
        }
    }
}

var options = {};
if (args.concurrency) {
    options.concurrency = args.concurrency;
}
if (args.delayms) {
    options.rateLimit = args.delayms;
}

var crawler = null;
function downloadBegin(queueItem) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write('Crawling ' + queueItem.loc + "...");
};
function downloadProgress(queueItem, state) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write("Downloading " + queueItem.loc + " [" + state.received + " bytes]");
};
function downloadEnd(queueItem) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write('Processing ' + queueItem.loc + ' content...');
};


if (args.content) {
    crawler = new salient.crawlers.ContentCrawler(options);
}
else if (args.sitemaps) {
    crawler = new salient.crawlers.SitemapCrawler(options);
}

crawler.on('download-begin', downloadBegin);
crawler.on('download-progress', downloadProgress);
crawler.on('download-end', downloadEnd);
crawler.on('parse-end', function (queueItem) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log('✓ Successfully processed ' + queueItem.loc + ' [' + queueItem.count + ' urls]');
});
crawler.on('end', function () {
    if (crawler.processed) {
        console.log('Found ' + crawler.processed + ' total urls' + (args.output ? ' outputed to ' + args.output : ''));
    }
});

var readOffset = 0;
var index = args.offset || 0;
var skip = index > 0;
var readOffset = 0;
if (args.output) {
    var output = fs.createWriteStream(args.output);
    crawler.pipe(JSONStream.stringify(false)).pipe(output);
}
else if (args.contentdir) {
    setInterval(function () {
        saveState();
    }, 5000);

    crawler.on('data', function (data) {
        if (skip && readOffset < index) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write('Skipping lines ' + readOffset + '...');
            readOffset++;
        }
        else {
            if (skip) skip = false;
            var loc = data[1];
            loc = loc.substring(loc.lastIndexOf('/') + 1);
            index++;
            fs.writeFile(path.join(args.contentdir, loc), data[0], function (err) {
                if (err) console.log(err);
                data = null;
            });
        }
    });
}

crawler.crawl(args._.slice(2));

function saveState(exitProc) {
    if (args.contentdir) {
        fs.writeFile(path.join(args.contentdir, '_state.crawl'), JSON.stringify({ 'args': args, 'index': index }), function (err) { 
            if (exitProc) {
                process.exit();
            }
        });
    }
}

function exit() {
    saveState(true);
}

process.on('SIGINT', exit);
process.on('SIGTERM', exit);
process.on('SIGUSR1', exit);
