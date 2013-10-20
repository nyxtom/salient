/**
 * TextController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var anchor = require('anchor');
var Validator = anchor.Validator;
var ArticleTokenizer = require('./../../../lib/salient/tokenizers/article_tokenizer');

/**
 * Validates the given request values against the rule type using 
 * the anchor validation framework.
 */
var validate = function (values, rules, done) {
    var validator = new Validator();
    validator.initialize(rules);
    validator.validate(values, function (err) {
        if (err) {
            done(err);
        }
        else {
            done();
        }
    });
};

/**
 * Cleans the given text using the tokenization framework.
 *
 * @param req: Request containing text to clean.
 */
var clean = function (req, res) {
    var query = req.query;
    validate(query, { text: { type: 'string', required: true } }, function (err) {
        if (err) {
            res.json(err);
        }
        else {
            var tokenizer = new ArticleTokenizer();
            var text = tokenizer.clean(query.text);
            res.json({
                cleanText: text
            });
        }
    });
};

module.exports = {};
module.exports.clean = clean;
