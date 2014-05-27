# salient
salient is a natural language processing and machine learning toolkit. Salient contains many common tasks from sentiment analysis, part of speech tagging, tokenization, neural networks, regression analysis, wiktionary parsing, logistic regression, language modeling, mphf, radix trees, vocabulary building and the potential for more awesomeness. It can be used for many classification tasks, categorization, and many common text processing tasks all in node.js :D

### Usage

Test cases and usage can be found by looking within the *specs/* directory.

### Notes

It should be noted that most machine learning algorithms would be better suited in environments that can take advantage of many cores, such as in the case of GPU accelerated machine learning. Such things are necessary in order to speed up the learning rate as well as the task at hand given that many complex linear algebra operations can be done efficiently in parallel. As a result, this project is more of an example test case implementation for a wide-variety of machine learning and artificial intelligence problems. For more robust implementations, it is recommended that you glean from my implementations and others (i.e. by reference to Andrew Ng's Machine Learning course) and use that within the scope of your projects. However, there are other techniques such as map-reduce that may be able to improve the performance of running some of these operations within this package on multiple cores and multiple systems in parallel.

### License

MIT License

Copyright 2014 Thomas Holloway @nyxtom
