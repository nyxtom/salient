
var util = require('util'),
    fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn;

var args = process.argv;
if (!args || args.length < 3) {
    console.log('usage: node sentistrength senticorp.log --lines=100');
    return;
}

var sentimentFile = args[2];
var lines = fs.readFileSync(sentimentFile).toString().split('\n');
var count = lines.length;
if (args.length == 4) {
    if (args[3].indexOf('--lines=') > -1) {
        count = parseInt(args[3].split('--lines=')[1]);
    }
}
