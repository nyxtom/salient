var Tokenizer = require('../../lib/salient/tokenizers/article_tokenizer'),
    tokenizer = new Tokenizer();

describe('article_tokenizer', function () {

    it('should clean the input where possible', function () {
        expect(tokenizer.clean('<div><a href="http://www.google.com" data-prop="bleh">data here to clean</a></div>'))
              .toEqual('data here to clean');
    });

    it('should clean wiki-markup where possible and when-enabled', function () {
        var text = "In [[topology]], '''knot theory''' is the study of [[knot (mathematics)|mathematical knot]]s. While inspired by knots which appear in daily life in shoelaces and rope, a mathematician's knot differs in that the ends are joined together so that it cannot be undone. In mathematical language, a knot is an [[embedding]] of a [[circle]] in 3-dimensional [[Euclidean space]], '''R'''<sup>3</sup>. Two mathematical knots are equivalent if one can be transformed into the other via a deformation of '''R'''<sup>3</sup> upon itself (known as an [[ambient isotopy]]); these transformations correspond to manipulations of a knotted string that do not involve cutting the string or passing the string through itself.";
        var expectText = "In topology, '''knot theory''' is the study of mathematical knots. While inspired by knots which appear in daily life in shoelaces and rope, a mathematician's knot differs in that the ends are joined together so that it cannot be undone. In mathematical language, a knot is an embedding of a circle in 3-dimensional Euclidean space, '''R'''3. Two mathematical knots are equivalent if one can be transformed into the other via a deformation of '''R'''3 upon itself (known as an ambient isotopy); these transformations correspond to manipulations of a knotted string that do not involve cutting the string or passing the string through itself.";
        expect(tokenizer.clean(text)).toEqual(expectText);

        text = "In 1927, working with this diagrammatic form of knots, [[J.W. Alexander]] and G. B. Briggs, and independently [[Kurt Reidemeister]], demonstrated that two knot diagrams belonging to the same knot can be related by a sequence of three kinds of moves on the diagram, shown below. These operations, now called the '''Reidemeister moves''', are:" + 
'<ol style="list-style-type:upper-Roman">' + 
'\r\n        <li> Twist and untwist in either direction.</li>' + 
'\r\n        <li> Move one strand completely over another.</li>' + 
'\r\n        <li> Move a strand completely over or under a crossing.</li>' + 
'        </ol>' + 
'' + 
'    {| align="center" style="text-align:center"' + 
"        |+ '''Reidemeister moves'''" + 
'        |- style="padding:1em"' + 
"        | [[Image:Reidemeister move 1.png|130px|]] [[File:Frame left.png]] || [[Image:Reidemeister move 2.png|210px]]" + 
"        |-" + 
"        | <u>Type I</u> || <u>Type II</u>" + 
'        |- style="padding:1em"' + 
'        | colspan="2" | [[Image:Reidemeister move 3.png|360px]]' + 
'        |-' + 
'        | colspan="2" | <u>Type III</u>' + 
"        |}";
        expectText = "In 1927, working with this diagrammatic form of knots, J.W. Alexander and G. B. Briggs, and independently Kurt Reidemeister, demonstrated that two knot diagrams belonging to the same knot can be related by a sequence of three kinds of moves on the diagram, shown below. These operations, now called the '''Reidemeister moves''', are:\r\n         Twist and untwist in either direction.\r\n         Move one strand completely over another.\r\n         Move a strand completely over or under a crossing.";
        expect(tokenizer.clean(text).trim()).toEqual(expectText);
    });

    it('should clean wiki-markup text and compress whitespace where possible', function () {
        var t = new Tokenizer({ compressWhitespace: true });
        var text = "In 1927, working with this diagrammatic form of knots, [[J.W. Alexander]] and G. B. Briggs, and independently [[Kurt Reidemeister]], demonstrated that two knot diagrams belonging to the same knot can be related by a sequence of three kinds of moves on the diagram, shown below. These operations, now called the '''Reidemeister moves''', are:" + 
'<ol style="list-style-type:upper-Roman">' + 
'\r\n        <li> Twist and untwist in either direction.</li>' + 
'\r\n        <li> Move one strand completely over another.</li>' + 
'\r\n        <li> Move a strand completely over or under a crossing.</li>' + 
'        </ol>' + 
'' + 
'    {| align="center" style="text-align:center"' + 
"        |+ '''Reidemeister moves'''" + 
'        |- style="padding:1em"' + 
"        | [[Image:Reidemeister move 1.png|130px|]] [[File:Frame left.png]] || [[Image:Reidemeister move 2.png|210px]]" + 
"        |-" + 
"        | <u>Type I</u> || <u>Type II</u>" + 
'        |- style="padding:1em"' + 
'        | colspan="2" | [[Image:Reidemeister move 3.png|360px]]' + 
'        |-' + 
'        | colspan="2" | <u>Type III</u>' + 
"        |}";
        var expectText = "In 1927, working with this diagrammatic form of knots, J.W. Alexander and G. B. Briggs, and independently Kurt Reidemeister, demonstrated that two knot diagrams belonging to the same knot can be related by a sequence of three kinds of moves on the diagram, shown below. These operations, now called the '''Reidemeister moves''', are: Twist and untwist in either direction. Move one strand completely over another. Move a strand completely over or under a crossing.";
        expect(t.clean(text)).toEqual(expectText);
    });

    it('should tokenize input appropriately using the simple word punctuation rule', function () {
        var text = "In 1927, working with this diagrammatic form of knots, J.W. Alexander and G. B. Briggs, and independently Kurt Reidemeister, demonstrated that two knot diagrams belonging to the same knot can be related by a sequence of three kinds of moves on the diagram, shown below. These operations, now called the '''Reidemeister moves''', are: Twist and untwist in either direction. Move one strand completely over another. Move a strand completely over or under a crossing.";
        var tokens = tokenizer.tokenize(text);
        var expectTokens = [ 'In', '1927', ',', 'working', 'with', 'this', 'diagrammatic', 'form', 'of', 'knots', ',', 'J', '.', 'W', '.', 'Alexander', 'and', 'G', '.', 'B', '.', 'Briggs', ',', 'and', 'independently', 'Kurt', 'Reidemeister', ',', 'demonstrated', 'that', 'two', 'knot', 'diagrams', 'belonging', 'to', 'the', 'same', 'knot', 'can', 'be', 'related', 'by', 'a', 'sequence', 'of', 'three', 'kinds', 'of', 'moves', 'on', 'the', 'diagram', ',', 'shown', 'below', '.', 'These', 'operations', ',', 'now', 'called', 'the', '\'', '\'', '\'', 'Reidemeister', 'moves', '\'', '\'', '\'', ',', 'are', ':', 'Twist', 'and', 'untwist', 'in', 'either', 'direction', '.', 'Move', 'one', 'strand', 'completely', 'over', 'another', '.', 'Move', 'a', 'strand', 'completely', 'over', 'or', 'under', 'a', 'crossing', '.' ];
        expect(tokens).toEqual(expectTokens);
    });

    it('should tokenize urls appropriately', function () {
        var text = "In 1927, working with this diagrammatic form of knots (http://www.google.com), J.W. Alexander (http://en.wikipedia.org/J.W._Alexander) and G. B. Briggs, and independently Kurt Reidemeister, demonstrated that two knot diagrams belonging to the same knot can be related by a sequence of three kinds of moves on the diagram, shown below. These operations, now called the '''Reidemeister moves''', are: Twist and untwist in either direction. Move one strand completely over another. Move a strand completely over or under a crossing.";
        var tokens = tokenizer.tokenize(text);
        var expectTokens = [ 'In', '1927', ',', 'working', 'with', 'this', 'diagrammatic', 'form', 'of', 'knots', ' (', 'http://www.google.com', ')', ',', 'J', '.', 'W', '.', 'Alexander', ' (', 'http://en.wikipedia.org/J.W._Alexander', ') ', 'and', 'G', '.', 'B', '.', 'Briggs', ',', 'and', 'independently', 'Kurt', 'Reidemeister', ',', 'demonstrated', 'that', 'two', 'knot', 'diagrams', 'belonging', 'to', 'the', 'same', 'knot', 'can', 'be', 'related', 'by', 'a', 'sequence', 'of', 'three', 'kinds', 'of', 'moves', 'on', 'the', 'diagram', ',', 'shown', 'below', '.', 'These', 'operations', ',', 'now', 'called', 'the', '\'', '\'', '\'', 'Reidemeister', 'moves', '\'', '\'', '\'', ',', 'are', ':', 'Twist', 'and', 'untwist', 'in', 'either', 'direction', '.', 'Move', 'one', 'strand', 'completely', 'over', 'another', '.', 'Move', 'a', 'strand', 'completely', 'over', 'or', 'under', 'a', 'crossing', '.' ];
        expect(tokens).toEqual(expectTokens);
    });

});
