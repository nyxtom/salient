
var fs = require('fs');
var JSONStream = require('JSONStream');
var salient = require('./../');

var args = require('minimist')(process.argv);
if (!args || !args.sitemaps) {
    console.log('Usage: node crawl.js --sitemaps=true --concurrency=2 --output=tmp.txt http://www.example.com/sitemap.xml');
    return;
}


// Setup additional command line options
var options = {};
if (args.concurrency) {
    options.concurrency = args.concurrency;
}

var crawler = new salient.crawlers.SitemapCrawler(options);
crawler.on('download-begin', function (queueItem) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write('Crawling ' + queueItem.loc + "...");
});
crawler.on('download-progress', function (queueItem, state) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write("Downloading " + queueItem.loc + " [" + state.received + " bytes]");
});
crawler.on('download-end', function (queueItem) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write('Parsing ' + queueItem.loc + ' content...');
});
crawler.on('parse-end', function (queueItem) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log('✓ Successfully processed ' + queueItem.loc + ' [' + queueItem.count + ' urls]');
});
crawler.on('end', function () {
    console.log('Found ' + crawler.processed + ' total urls' + (args.output ? ' outputed to ' + args.output : ''));
});

if (args.output) {
    var output = fs.createWriteStream(args.output);
    crawler.pipe(JSONStream.stringify(false)).pipe(output);
}

if (args.sitemaps) {
    crawler.crawl(args._.slice(2));
}
