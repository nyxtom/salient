
var fs = require('fs');
var path = require('path');
var salient = require('./../')
var model = new salient.language.HiddenMarkovModel();
model.restore(path.join(__dirname, 'model.json'));
model.restore(path.join(__dirname, 'model.tagdist.json'));

var json = JSON.stringify(model);
fs.writeFileSync('en.hmm.json', json);

module.exports = model;
