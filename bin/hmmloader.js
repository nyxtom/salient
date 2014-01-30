
var salient = require('./../')
var model = new salient.language.HiddenMarkovModel();
model.restore(path.join(__dirname, 'model.json'));
model.restore(path.join(__dirname, 'model.tagdist.json'));

module.exports = model;
