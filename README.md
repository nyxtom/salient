# salient
salient is a natural language processing and machine learning toolkit. Salient contains many common tasks from sentiment analysis, part of speech tagging, tokenization, neural networks, regression analysis, wiktionary parsing, logistic regression, language modeling, mphf, radix trees, vocabulary building and the potential for more awesomeness. It can be used for many classification tasks, categorization, and many common text processing tasks all in node.js :D

### Usage

Test cases and usage can be found by looking within the *specs/* directory.

### Notes

It should be noted that most machine learning algorithms would be better suited in environments that can take advantage of many cores, such as in the case of GPU accelerated machine learning. Such things are necessary in order to speed up the learning rate as well as the task at hand given that many complex linear algebra operations can be done efficiently in parallel. As a result, this project is more of an example test case implementation for a wide-variety of machine learning and artificial intelligence problems. For more robust implementations, it is recommended that you glean from my implementations and others (i.e. by reference to Andrew Ng's Machine Learning course) and use that within the scope of your projects. However, there are other techniques such as map-reduce that may be able to improve the performance of running some of these operations within this package on multiple cores and multiple systems in parallel.

### License

The MIT License (MIT)

Copyright (c) 2014 Thomas Holloway (@nyxtom)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
