
var fs = require('fs'),
    path = require('path');

var JSONStream = require('JSONStream');
var salient = require('./../');

var args = require('minimist')(process.argv);
if (!args.sitemaps && !args.content && args._.length < 2) {
    console.log('Usage: node crawl.js --sitemaps=true --concurrency=2 --output=tmp.txt http://www.example.com/sitemap.xml');
    console.log('\t node crawl.js --content=true ./tmp.txt --delayms=500')
    return;
}


// Setup additional command line options
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

if (args.output) {
    var output = fs.createWriteStream(args.output);
    crawler.pipe(JSONStream.stringify(false)).pipe(output);
}
else if (args.contentdir) {
    var index = 0;
    crawler.on('data', function (data) {
        fs.writeFile(path.join(args.contentdir, (index++) + ".txt"), data, function (err) {
            if (err) console.log(err);
        });
    });
}

crawler.crawl(args._.slice(2));
